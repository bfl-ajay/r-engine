/**
 * Export Service
 * Handles report export to various formats
 */

import prisma from '../database';
import renderingService from './renderingService';
import type { ReportDefinition } from '@reporting-engine/shared';

export type ExportFormat = 'PDF' | 'EXCEL' | 'CSV' | 'HTML' | 'WORD' | 'JSON' | 'XML';

interface ExportJobInput {
  reportInstanceId: string;
  format: ExportFormat;
  fileName?: string;
  parameters?: Record<string, any>;
}

class ExportService {
  /**
   * Create an export job
   */
  async createExportJob(input: ExportJobInput): Promise<any> {
    const exportJob = await prisma.exportJob.create({
      data: {
        reportInstanceId: input.reportInstanceId,
        format: input.format,
        fileName: input.fileName || `report-${Date.now()}.${this.getFileExtension(input.format)}`,
        status: 'PENDING',
        createdAt: new Date(),
      },
    });

    return exportJob;
  }

  /**
   * Process export job
   */
  async processExportJob(
    jobId: string,
    report: ReportDefinition,
    data: any
  ): Promise<{ data: string; format: ExportFormat }> {
    const job = await prisma.exportJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Export job not found');
    }

    // Update job status
    await prisma.exportJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING' },
    });

    try {
      let exportData: string;

      switch (job.format) {
        case 'PDF':
          exportData = await this.exportToPdf(report, data);
          break;
        case 'EXCEL':
          exportData = await this.exportToExcel(report, data);
          break;
        case 'CSV':
          exportData = await this.exportToCsv(report, data);
          break;
        case 'HTML':
          exportData = await this.exportToHtml(report, data);
          break;
        case 'WORD':
          exportData = await this.exportToWord(report, data);
          break;
        case 'JSON':
          exportData = JSON.stringify(data, null, 2);
          break;
        case 'XML':
          exportData = this.exportToXml(report, data);
          break;
        default:
          throw new Error(`Unsupported export format: ${job.format}`);
      }

      // Update job status to completed
      await prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          fileSize: Buffer.byteLength(exportData, 'utf8'),
          completedAt: new Date(),
        },
      });

      return { data: exportData, format: job.format };
    } catch (error) {
      // Update job status to failed
      await prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Export to PDF
   */
  private async exportToPdf(report: ReportDefinition, data: any): Promise<string> {
    // TODO: Integrate with Puppeteer for PDF generation
    // For now, return HTML that can be converted
    const html = await this.exportToHtml(report, data);
    console.warn('PDF export requires Puppeteer integration');
    return html;
  }

  /**
   * Export to Excel
   */
  private async exportToExcel(report: ReportDefinition, data: any): Promise<string> {
    // TODO: Integrate with ExcelJS for Excel generation
    console.warn('Excel export requires ExcelJS integration');
    return JSON.stringify(data);
  }

  /**
   * Export to CSV
   */
  private async exportToCsv(report: ReportDefinition, data: any): Promise<string> {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    // Get headers from first row
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map((row: Record<string, any>) =>
        headers.map((h) => this.escapeCsvValue(row[h])).join(',')
      ),
    ].join('\n');

    return csv;
  }

  /**
   * Export to HTML
   */
  private async exportToHtml(report: ReportDefinition, data: any): Promise<string> {
    // Use the rendering service to generate HTML
    const html = await renderingService.renderReport(
      report,
      {
        rows: Array.isArray(data) ? data : [data],
        totalRows: Array.isArray(data) ? data.length : 1,
      },
      {},
      { format: 'HTML', includeStyles: true }
    );
    return html;
  }

  /**
   * Export to Word (DOCX)
   */
  private async exportToWord(report: ReportDefinition, data: any): Promise<string> {
    // TODO: Integrate with docx library
    console.warn('Word export requires docx library integration');
    return JSON.stringify(data);
  }

  /**
   * Export to XML
   */
  private exportToXml(report: ReportDefinition, data: any): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<report>\n';
    xml += `  <name>${this.escapeXml(report.name)}</name>\n`;
    xml += `  <version>${this.escapeXml(report.version)}</version>\n`;
    xml += '  <data>\n';

    if (Array.isArray(data)) {
      for (const item of data) {
        xml += '    <row>\n';
        for (const [key, value] of Object.entries(item)) {
          xml += `      <${this.sanitizeXmlTag(key)}>${this.escapeXml(String(value))}</${this.sanitizeXmlTag(
            key
          )}>\n`;
        }
        xml += '    </row>\n';
      }
    }

    xml += '  </data>\n';
    xml += '</report>';
    return xml;
  }

  /**
   * Get file extension for format
   */
  private getFileExtension(format: ExportFormat): string {
    const extensions: Record<ExportFormat, string> = {
      PDF: 'pdf',
      EXCEL: 'xlsx',
      CSV: 'csv',
      HTML: 'html',
      WORD: 'docx',
      JSON: 'json',
      XML: 'xml',
    };
    return extensions[format] || 'txt';
  }

  /**
   * Escape CSV value
   */
  private escapeCsvValue(value: any): string {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * Sanitize XML tag name
   */
  private sanitizeXmlTag(tag: string): string {
    return tag
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/^[0-9]/, '_$&')
      .substring(0, 255);
  }

  /**
   * Get export status
   */
  async getExportStatus(jobId: string): Promise<any> {
    const job = await prisma.exportJob.findUnique({
      where: { id: jobId },
    });
    return job;
  }

  /**
   * List export jobs for a report instance
   */
  async listExportJobs(reportInstanceId: string): Promise<any[]> {
    const jobs = await prisma.exportJob.findMany({
      where: { reportInstanceId },
      orderBy: { createdAt: 'desc' },
    });
    return jobs;
  }

  /**
   * Delete export job
   */
  async deleteExportJob(jobId: string): Promise<void> {
    await prisma.exportJob.delete({
      where: { id: jobId },
    });
  }
}

export default new ExportService();
