/**
 * Report Rendering Service
 * Orchestrates report generation from definition and data
 */

import type { ReportDefinition } from '../../../packages/shared/src/types';
import htmlRenderer from './htmlRenderer';
import dataBindingResolver from './dataBindingResolver';
import expressionEngine from './expressionEngine';

export interface RenderOptions {
  format?: 'HTML' | 'PDF' | 'JSON';
  includeStyles?: boolean;
  responsive?: boolean;
  pageBreakOn?: 'DATA' | 'GROUP' | 'MANUAL';
}

export interface ReportDataSet {
  rows: Record<string, any>[];
  totalRows: number;
  pageSize?: number;
}

class ReportRenderingService {
  /**
   * Render a report with data
   */
  async renderReport(
    report: ReportDefinition,
    dataSet: ReportDataSet,
    parameters: Record<string, any> = {},
    options: RenderOptions = {}
  ): Promise<string> {
    // Validate report
    const errors = this.validateReport(report);
    if (errors.length > 0) {
      throw new Error(`Report validation failed: ${errors.join(', ')}`);
    }

    // Validate field availability
    const requiredFields = dataBindingResolver.extractReferencedFields(report);
    if (dataSet.rows.length > 0) {
      const validation = dataBindingResolver.validateFieldAvailability(
        requiredFields,
        dataSet.rows[0]
      );
      if (!validation.valid) {
        console.warn(`Missing fields in data: ${validation.missingFields.join(', ')}`);
      }
    }

    // Prepare data for rendering
    const pageSize = options.pageBreakOn === 'MANUAL' ? Infinity : (dataSet.pageSize || 50);
    const pageData = this.preparePageData(report, dataSet, parameters, pageSize);

    // Render based on format
    switch (options.format?.toUpperCase()) {
      case 'PDF':
        return this.renderToPdf(report, pageData, options);
      case 'JSON':
        return JSON.stringify(pageData, null, 2);
      case 'HTML':
      default:
        return htmlRenderer.renderReport(report, pageData, options);
    }
  }

  /**
   * Prepare page data structure for rendering
   */
  private preparePageData(
    report: ReportDefinition,
    dataSet: ReportDataSet,
    parameters: Record<string, any>,
    pageSize: number
  ): Array<any> {
    const pages: Array<any> = [];
    const totalPages = Math.ceil(dataSet.rows.length / pageSize);

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageStartIndex = (pageNum - 1) * pageSize;
      const pageEndIndex = Math.min(pageNum * pageSize, dataSet.rows.length);
      const pageRows = dataSet.rows.slice(pageStartIndex, pageEndIndex);

      const pageData = {
        bands: this.prepareBandData(report, pageRows, parameters),
        pageNumber: pageNum,
        totalPages,
        parameters,
      };

      pages.push(pageData);
    }

    return pages;
  }

  /**
   * Prepare band data for a page
   */
  private prepareBandData(
    report: ReportDefinition,
    rows: Record<string, any>[],
    parameters: Record<string, any>
  ): Record<string, any> {
    const bandData: Record<string, any> = {};

    for (const band of report.bands) {
      if (!band.visible) continue;

      // Singular bands appear once per page
      if (this.isSingularBand(band.type)) {
        bandData[band.id] = [{ rowData: {} }];
      } else {
        // Repeatable bands appear once per data row
        bandData[band.id] = rows.map((rowData) => ({
          rowData,
          bandId: band.id,
          type: band.type,
        }));
      }
    }

    return bandData;
  }

  /**
   * Render report to PDF (placeholder for PDF library integration)
   */
  private async renderToPdf(
    report: ReportDefinition,
    pageData: any[],
    options: RenderOptions
  ): Promise<string> {
    // First generate HTML
    const html = htmlRenderer.renderReport(report, pageData, options);

    // TODO: Integrate with Puppeteer or similar for PDF generation
    // For now, return HTML with note
    console.warn('PDF rendering requires integration with Puppeteer or similar');
    return html;
  }

  /**
   * Validate report definition
   */
  private validateReport(report: ReportDefinition): string[] {
    const errors: string[] = [];

    if (!report.name?.trim()) {
      errors.push('Report name is required');
    }

    if (!report.bands || report.bands.length === 0) {
      errors.push('Report must have at least one band');
    }

    // Validate band names are unique
    const bandNames = new Set<string>();
    for (const band of report.bands || []) {
      if (bandNames.has(band.name)) {
        errors.push(`Duplicate band name: ${band.name}`);
      }
      bandNames.add(band.name);
    }

    // Validate expressions
    for (const band of report.bands || []) {
      for (const object of band.children || []) {
        if (object.type === 'EXPRESSION' && object.expression) {
          const validation = expressionEngine.validateExpression(object.expression);
          if (!validation.valid) {
            errors.push(`Invalid expression in ${object.name}: ${validation.error}`);
          }
        }
      }
    }

    return errors;
  }

  /**
   * Check if band is singular
   */
  private isSingularBand(bandType: string): boolean {
    const singularBands = [
      'TITLE',
      'REPORT_HEADER',
      'REPORT_FOOTER',
      'REPORT_SUMMARY',
    ];
    return singularBands.includes(bandType);
  }

  /**
   * Get estimated report size
   */
  estimateReportSize(
    report: ReportDefinition,
    rowCount: number
  ): { pages: number; estimatedBytes: number } {
    // Rough estimation: ~2KB per object per row
    const objectsPerBand = report.bands.reduce((sum, b) => sum + b.children.length, 0);
    const repeatableBandCount = report.bands.filter(
      (b) => !this.isSingularBand(b.type)
    ).length;
    const estimatedObjects = objectsPerBand + rowCount * repeatableBandCount;
    const estimatedBytes = estimatedObjects * 2048;

    // Estimate pages (assuming ~50 rows per page)
    const pages = Math.ceil(rowCount / 50);

    return { pages, estimatedBytes };
  }

  /**
   * Get report statistics
   */
  getReportStats(report: ReportDefinition): Record<string, any> {
    const fields = dataBindingResolver.extractReferencedFields(report);
    const objectCount = report.bands.reduce((sum, b) => sum + b.children.length, 0);
    const bandCount = report.bands.length;

    return {
      name: report.name,
      version: report.version,
      bands: bandCount,
      objects: objectCount,
      dataSources: report.dataSources?.length || 0,
      parameters: report.parameters?.length || 0,
      fields: fields.length,
      referencedFields: fields,
    };
  }
}

export default new ReportRenderingService();
