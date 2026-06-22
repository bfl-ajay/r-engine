/**
 * HTML Report Renderer
 * Generates HTML output from report definition
 */

import type { ReportDefinition, Band, ReportObject } from '@reporting-engine/shared';
import { BAND_DISPLAY_NAMES } from '@reporting-engine/shared';
import dataBindingResolver from './dataBindingResolver';

interface RenderOptions {
  includeStyles?: boolean;
  responsive?: boolean;
  printCSS?: boolean;
}

interface PageData {
  bands: Record<string, BandData[]>;
  pageNumber: number;
  totalPages: number;
  parameters: Record<string, any>;
  rowNumber?: number;
}

interface BandData {
  bandId: string;
  type: string;
  objects: Record<string, any>[];
  rowData?: Record<string, any>;
}

class HtmlReportRenderer {
  /**
   * Generate complete HTML report
   */
  renderReport(
    report: ReportDefinition,
    data: PageData[],
    options: RenderOptions = {}
  ): string {
    const { includeStyles = true, responsive = true, printCSS = true } = options;

    let html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += `<title>${this.escapeHtml(report.name)}</title>\n`;

    if (includeStyles) {
      html += this.generateStyles(report, { responsive, printCSS });
    }

    html += '</head>\n<body>\n';

    // Render each page
    for (let i = 0; i < data.length; i++) {
      html += this.renderPage(report, data[i], i + 1, options);
    }

    html += '</body>\n</html>';
    return html;
  }

  /**
   * Render a single page
   */
  private renderPage(
    report: ReportDefinition,
    pageData: PageData,
    pageNumber: number,
    options: RenderOptions
  ): string {
    let html = `<div class="page page-${pageNumber}">\n`;

    const pageSetup = report.pageSetup;
    const margins = `${pageSetup.marginTop || 20}mm ${pageSetup.marginRight || 20}mm ${
      pageSetup.marginBottom || 20
    }mm ${pageSetup.marginLeft || 20}mm`;

    html += `<div class="page-content" style="margin: ${margins};">\n`;

    // Render bands in order
    for (const band of report.bands) {
      if (!band.visible) continue;

      const bandData = pageData.bands[band.id] || [];

      if (bandData.length === 0 && !this.isSingularBand(band.type)) {
        continue; // Skip empty repeatable bands
      }

      // Render the band
      html += this.renderBand(report, band, bandData, pageData, options);
    }

    html += '</div>\n</div>\n';
    return html;
  }

  /**
   * Render a band
   */
  private renderBand(
    report: ReportDefinition,
    band: Band,
    bandData: BandData[],
    pageData: PageData,
    options: RenderOptions
  ): string {
    let html = `<div class="band band-${band.type.toLowerCase()}" data-band-id="${band.id}">\n`;

    // For singular bands, render once
    if (this.isSingularBand(band.type)) {
      html += this.renderBandContent(report, band, pageData, options);
    } else {
      // For repeatable bands, render for each row
      for (let i = 0; i < bandData.length; i++) {
        const rowPageData = {
          ...pageData,
          rowNumber: i + 1,
        };
        html += this.renderBandContent(report, band, rowPageData, options, bandData[i].rowData);
      }
    }

    html += '</div>\n';
    return html;
  }

  /**
   * Render band content (objects within band)
   */
  private renderBandContent(
    report: ReportDefinition,
    band: Band,
    pageData: PageData,
    options: RenderOptions,
    rowData?: Record<string, any>
  ): string {
    let html = '';

    const bandStyle = this.getBandStyle(band);
    html += `<div class="band-body" style="${bandStyle}">\n`;

    // Render objects in band
    for (const object of band.children) {
      if (!object.visible) continue;

      const context = {
        rowData: rowData || {},
        parameters: pageData.parameters,
        pageNumber: pageData.pageNumber,
        totalPages: pageData.totalPages,
        rowNumber: pageData.rowNumber || 0,
        groupValues: {},
      };

      const resolvedObject = dataBindingResolver.resolveObjectBindings(object, context);
      html += this.renderObject(resolvedObject, options);
    }

    html += '</div>\n';
    return html;
  }

  /**
   * Render a report object
   */
  private renderObject(object: Record<string, any>, options: RenderOptions): string {
    const style = this.getObjectStyle(object);

    switch (object.type) {
      case 'TEXT':
      case 'LABEL':
        return `<div class="object text-object" style="${style}">${this.escapeHtml(
          object.text || ''
        )}</div>\n`;

      case 'FIELD':
        return `<div class="object field-object" style="${style}">${this.escapeHtml(
          object.formattedValue || ''
        )}</div>\n`;

      case 'EXPRESSION':
        return `<div class="object expression-object" style="${style}">${this.escapeHtml(
          object.formattedValue || ''
        )}</div>\n`;

      case 'IMAGE':
        if (object.imageSource) {
          return `<div class="object image-object" style="${style}"><img src="${this.escapeHtml(
            object.imageSource
          )}" alt="${object.name}" style="max-width: 100%; max-height: 100%;"></div>\n`;
        }
        return '';

      case 'PAGE_NUMBER':
        return `<span class="object page-number" style="${style}">${object.value}</span>\n`;

      case 'TOTAL_PAGES':
        return `<span class="object total-pages" style="${style}">${object.value}</span>\n`;

      case 'DATE_TIME':
        return `<span class="object datetime" style="${style}">${this.escapeHtml(
          object.formattedValue || ''
        )}</span>\n`;

      case 'TABLE':
        return this.renderTable(object, options);

      case 'SHAPE':
      case 'LINE':
        return this.renderShape(object, options);

      default:
        return '';
    }
  }

  /**
   * Render a table
   */
  private renderTable(object: Record<string, any>, options: RenderOptions): string {
    const style = this.getObjectStyle(object);
    let html = `<div class="object table-object" style="${style}"><table class="data-table">\n`;

    // TODO: Implement full table rendering with data
    html += '<tr><td>Table rendering pending</td></tr>\n';
    html += '</table></div>\n';

    return html;
  }

  /**
   * Render a shape
   */
  private renderShape(object: Record<string, any>, options: RenderOptions): string {
    const style = this.getObjectStyle(object);

    if (object.type === 'LINE') {
      return `<div class="object line-object" style="${style}"></div>\n`;
    }

    return `<div class="object shape-object" style="${style}"></div>\n`;
  }

  /**
   * Get CSS style string for a band
   */
  private getBandStyle(band: Band): string {
    const styles: string[] = [];

    if (band.backgroundColor) {
      styles.push(`background-color: ${band.backgroundColor}`);
    }
    if (band.borderColor) {
      styles.push(`border-color: ${band.borderColor}`);
    }
    if (band.borderWidth) {
      styles.push(`border-width: ${band.borderWidth}px`);
    }
    if (band.height) {
      styles.push(`min-height: ${band.height}px`);
    }
    if (band.paddingTop) {
      styles.push(`padding-top: ${band.paddingTop}px`);
    }
    if (band.paddingBottom) {
      styles.push(`padding-bottom: ${band.paddingBottom}px`);
    }
    if (band.paddingLeft) {
      styles.push(`padding-left: ${band.paddingLeft}px`);
    }
    if (band.paddingRight) {
      styles.push(`padding-right: ${band.paddingRight}px`);
    }

    return styles.join('; ');
  }

  /**
   * Get CSS style string for an object
   */
  private getObjectStyle(object: Record<string, any>): string {
    const styles: string[] = [];
    const pos = object.position || {};
    const size = object.size || {};
    const objStyle = object.style || {};
    const textStyle = object.textStyle || {};

    // Position
    if (pos.x !== undefined) styles.push(`left: ${pos.x}px`);
    if (pos.y !== undefined) styles.push(`top: ${pos.y}px`);

    // Size
    if (size.width !== undefined) styles.push(`width: ${size.width}px`);
    if (size.height !== undefined) styles.push(`height: ${size.height}px`);

    // Style
    if (objStyle.backgroundColor) {
      styles.push(`background-color: ${objStyle.backgroundColor}`);
    }
    if (objStyle.borderColor) {
      styles.push(`border-color: ${objStyle.borderColor}`);
    }
    if (objStyle.borderWidth) {
      styles.push(`border: ${objStyle.borderWidth}px solid`);
    }

    // Text style
    if (textStyle.fontFamily) {
      styles.push(`font-family: "${textStyle.fontFamily}"`);
    }
    if (textStyle.fontSize) {
      styles.push(`font-size: ${textStyle.fontSize}px`);
    }
    if (textStyle.color) {
      styles.push(`color: ${textStyle.color}`);
    }
    if (textStyle.textAlign) {
      styles.push(`text-align: ${textStyle.textAlign}`);
    }
    if (textStyle.fontWeight) {
      styles.push(`font-weight: ${textStyle.fontWeight}`);
    }
    if (textStyle.fontStyle) {
      styles.push(`font-style: ${textStyle.fontStyle}`);
    }

    return styles.join('; ');
  }

  /**
   * Generate CSS styles
   */
  private generateStyles(report: ReportDefinition, options: any): string {
    const pageSetup = report.pageSetup;
    const paperSizes: Record<string, { width: number; height: number }> = {
      A4: { width: 210, height: 297 },
      LETTER: { width: 216, height: 279 },
      LEGAL: { width: 216, height: 356 },
      TABLOID: { width: 279, height: 432 },
    };

    let size = paperSizes[pageSetup.paperSize] || paperSizes.A4;
    if (pageSetup.orientation === 'LANDSCAPE') {
      [size.width, size.height] = [size.height, size.width];
    }

    const css = `<style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    .page {
      width: ${size.width}mm;
      height: ${size.height}mm;
      margin: 10mm auto;
      padding: 0;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      page-break-after: always;
      position: relative;
    }
    .page-content {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    .band {
      width: 100%;
      border: 1px solid #ccc;
    }
    .band-body {
      position: relative;
      width: 100%;
    }
    .object {
      position: absolute;
      display: inline-block;
    }
    .text-object, .field-object, .expression-object {
      padding: 4px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .image-object img {
      max-width: 100%;
      max-height: 100%;
    }
    ${options.printCSS ? `
    @media print {
      body { margin: 0; }
      .page { margin: 0; box-shadow: none; }
    }
    ` : ''}
    </style>`;

    return css;
  }

  /**
   * Check if band type is singular (appears once)
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
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }
}

export default new HtmlReportRenderer();
