/**
 * Report Service
 * Business logic for report operations
 */

import prisma from '../database';
import type { ReportDefinition, PaginationParams } from '../../../packages/shared/src/types';

interface CreateReportInput {
  name: string;
  displayName?: string;
  description?: string;
  pageSetup?: any;
}

interface GetReportsParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

class ReportService {
  /**
   * Get all reports with pagination
   */
  async getAllReports(params: GetReportsParams) {
    const { page, limit, search, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdByUser: { select: { id: true, email: true } },
          modifiedByUser: { select: { id: true, email: true } },
        },
      }),
    ]);

    return {
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a report by ID
   */
  async getReportById(reportId: string) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        versions: true,
        template: true,
        dataSources: true,
        createdByUser: { select: { id: true, email: true } },
        modifiedByUser: { select: { id: true, email: true } },
      },
    });

    return report;
  }

  /**
   * Create a new report
   */
  async createReport(input: CreateReportInput) {
    const report = await prisma.report.create({
      data: {
        name: input.name,
        displayName: input.displayName || input.name,
        description: input.description,
        version: '1.0.0',
        status: 'DRAFT',
        content: {
          bands: [],
          dataSources: [],
          parameters: [],
          pageSetup: input.pageSetup || {
            paperSize: 'A4',
            orientation: 'PORTRAIT',
            marginTop: 20,
            marginBottom: 20,
            marginLeft: 20,
            marginRight: 20,
          },
        },
        createdById: 'system', // Will be replaced with actual user ID in production
      },
      include: {
        createdByUser: { select: { id: true, email: true } },
      },
    });

    return report;
  }

  /**
   * Update a report
   */
  async updateReport(reportId: string, updates: Partial<CreateReportInput>) {
    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        ...updates,
        modifiedAt: new Date(),
        modifiedById: 'system', // Will be replaced with actual user ID
      },
      include: {
        createdByUser: { select: { id: true, email: true } },
        modifiedByUser: { select: { id: true, email: true } },
      },
    });

    return report;
  }

  /**
   * Delete a report
   */
  async deleteReport(reportId: string) {
    // Delete related records first
    await prisma.reportVersion.deleteMany({ where: { reportId } });
    await prisma.reportInstance.deleteMany({ where: { reportId } });

    await prisma.report.delete({
      where: { id: reportId },
    });
  }

  /**
   * Publish a report (create a new version)
   */
  async publishReport(reportId: string) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return null;
    }

    // Update report status
    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'PUBLISHED',
        modifiedAt: new Date(),
      },
      include: {
        versions: true,
      },
    });

    // Create version record
    await prisma.reportVersion.create({
      data: {
        reportId,
        version: updated.version,
        content: updated.content,
        createdById: 'system',
      },
    });

    return updated;
  }

  /**
   * Execute a report
   */
  async executeReport(reportId: string, parameters: Record<string, any>) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    // Create report instance
    const instance = await prisma.reportInstance.create({
      data: {
        reportId,
        reportVersion: report.version,
        status: 'RUNNING',
        parameters,
        startedAt: new Date(),
      },
    });

    // TODO: Queue execution job in RabbitMQ
    // For now, just mark as completed
    const completed = await prisma.reportInstance.update({
      where: { id: instance.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        rowCount: 0,
        pageCount: 1,
      },
    });

    return completed;
  }

  /**
   * Get report versions
   */
  async getReportVersions(reportId: string) {
    const versions = await prisma.reportVersion.findMany({
      where: { reportId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdByUser: { select: { id: true, email: true } },
      },
    });

    return versions;
  }
}

export default new ReportService();
