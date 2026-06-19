/**
 * Execution Service
 * Handles report execution and job management
 */

import prisma from '../database';
import reportService from './reportService';
import renderingService from './renderingService';
import type { ReportDefinition } from '../../../packages/shared/src/types';

interface ExecutionParams {
  reportId: string;
  parameters: Record<string, any>;
}

class ExecutionService {
  /**
   * Execute a report
   */
  async executeReport(reportId: string, parameters: Record<string, any> = {}): Promise<any> {
    const report = await reportService.getReportById(reportId);

    if (!report) {
      throw new Error('Report not found');
    }

    // Create execution instance
    const instance = await prisma.reportInstance.create({
      data: {
        reportId,
        reportVersion: report.version,
        status: 'RUNNING',
        parameters,
        startedAt: new Date(),
      },
    });

    // TODO: Queue execution job in RabbitMQ for async processing
    // For now, mark as completed immediately

    try {
      // Simulate data retrieval (in reality this would query data sources)
      const mockData = this.generateMockData(10);

      // Render report
      const html = await renderingService.renderReport(
        report.content as ReportDefinition,
        {
          rows: mockData,
          totalRows: mockData.length,
          pageSize: 50,
        },
        parameters,
        { format: 'HTML' }
      );

      // Update instance with results
      const updated = await prisma.reportInstance.update({
        where: { id: instance.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          rowCount: mockData.length,
          pageCount: Math.ceil(mockData.length / 50),
          // Store result (in real implementation, would save to file/blob storage)
          // resultData: html,
        },
      });

      return updated;
    } catch (error) {
      // Mark as failed
      await prisma.reportInstance.update({
        where: { id: instance.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          // errorMessage: (error as Error).message,
        },
      });

      throw error;
    }
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string): Promise<any> {
    const instance = await prisma.reportInstance.findUnique({
      where: { id: executionId },
      include: {
        report: true,
      },
    });

    return instance;
  }

  /**
   * Get execution result (HTML/PDF/etc)
   */
  async getExecutionResult(executionId: string, format: string = 'HTML'): Promise<any> {
    const instance = await prisma.reportInstance.findUnique({
      where: { id: executionId },
      include: {
        report: true,
      },
    });

    if (!instance) {
      return null;
    }

    if (instance.status !== 'COMPLETED') {
      throw new Error(`Execution is ${instance.status}, result not available`);
    }

    // TODO: Retrieve actual result from storage
    // For now return execution info
    return {
      executionId,
      status: instance.status,
      rowCount: instance.rowCount,
      pageCount: instance.pageCount,
      format,
    };
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<any> {
    const instance = await prisma.reportInstance.findUnique({
      where: { id: executionId },
    });

    if (!instance) {
      return null;
    }

    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(instance.status)) {
      throw new Error(`Cannot cancel execution with status ${instance.status}`);
    }

    const updated = await prisma.reportInstance.update({
      where: { id: executionId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Delete execution
   */
  async deleteExecution(executionId: string): Promise<void> {
    await prisma.reportInstance.delete({
      where: { id: executionId },
    });
  }

  /**
   * List executions for a report
   */
  async listExecutions(reportId: string, limit: number = 10): Promise<any[]> {
    const instances = await prisma.reportInstance.findMany({
      where: { reportId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return instances;
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(reportId: string): Promise<Record<string, any>> {
    const instances = await prisma.reportInstance.findMany({
      where: { reportId },
    });

    const statsByStatus = {
      COMPLETED: 0,
      FAILED: 0,
      RUNNING: 0,
      CANCELLED: 0,
      PENDING: 0,
    };

    let totalRows = 0;
    let totalTime = 0;
    let count = 0;

    for (const instance of instances) {
      statsByStatus[instance.status as keyof typeof statsByStatus]++;
      totalRows += instance.rowCount || 0;

      if (instance.completedAt && instance.startedAt) {
        totalTime += instance.completedAt.getTime() - instance.startedAt.getTime();
        count++;
      }
    }

    return {
      totalExecutions: instances.length,
      statsByStatus,
      averageRows: instances.length > 0 ? totalRows / instances.length : 0,
      averageTime: count > 0 ? totalTime / count : 0,
      lastExecution: instances[0]?.startedAt,
    };
  }

  /**
   * Generate mock data for testing
   */
  private generateMockData(rowCount: number): Record<string, any>[] {
    const data: Record<string, any>[] = [];

    for (let i = 0; i < rowCount; i++) {
      data.push({
        id: i + 1,
        name: `Customer ${i + 1}`,
        email: `customer${i + 1}@example.com`,
        amount: Math.floor(Math.random() * 10000) + 100,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        status: ['Active', 'Inactive', 'Pending'][Math.floor(Math.random() * 3)],
      });
    }

    return data;
  }
}

export default new ExecutionService();
