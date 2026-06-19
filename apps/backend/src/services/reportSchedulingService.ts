/**
 * Report Scheduling Service
 * Manages scheduled report execution and distribution
 */

export interface Schedule {
  id: string;
  reportId: string;
  cronExpression: string;
  recipients: string[];
  format: 'PDF' | 'EXCEL' | 'HTML' | 'CSV';
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
  runCount: number;
  failureCount: number;
  parameters?: Record<string, any>;
  timezone?: string;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  startTime: number;
  endTime?: number;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  fileUrl?: string;
  error?: string;
  duration?: number;
}

/**
 * ReportSchedulingService - Schedule report generation
 */
class ReportSchedulingService {
  private schedules: Map<string, Schedule> = new Map();
  private executions: Map<string, ScheduleExecution> = new Map();
  private timers: Map<string, NodeJS.Timer> = new Map();

  /**
   * Create schedule
   */
  createSchedule(
    reportId: string,
    cronExpression: string,
    recipients: string[],
    format: 'PDF' | 'EXCEL' | 'HTML' | 'CSV',
    parameters?: Record<string, any>
  ): Schedule {
    const id = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const schedule: Schedule = {
      id,
      reportId,
      cronExpression,
      recipients,
      format,
      enabled: true,
      runCount: 0,
      failureCount: 0,
      parameters,
    };

    this.schedules.set(id, schedule);
    this.startSchedule(id);

    return schedule;
  }

  /**
   * Start schedule
   */
  private startSchedule(scheduleId: string): void {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule || !schedule.enabled) return;

    // Calculate next run time
    schedule.nextRun = this.calculateNextRun(schedule.cronExpression);

    // Set up timer for next execution
    const delay = (schedule.nextRun! - Date.now()) || 1000;
    if (delay > 0) {
      const timer = setTimeout(() => {
        this.executeSchedule(scheduleId);
        this.startSchedule(scheduleId); // Reschedule for next occurrence
      }, delay);

      this.timers.set(scheduleId, timer);
    }
  }

  /**
   * Execute schedule
   */
  private async executeSchedule(scheduleId: string): Promise<void> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return;

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const execution: ScheduleExecution = {
      id: executionId,
      scheduleId,
      startTime: Date.now(),
      status: 'RUNNING',
    };

    this.executions.set(executionId, execution);

    try {
      // In production, would call actual report execution service
      // const reportData = await reportExecutionService.execute(schedule.reportId, schedule.parameters);
      // const fileUrl = await exportService.export(reportData, schedule.format);

      execution.status = 'SUCCESS';
      execution.fileUrl = `/reports/${executionId}.${schedule.format.toLowerCase()}`;
      schedule.lastRun = Date.now();
      schedule.runCount++;

      // Send to recipients
      await this.sendToRecipients(execution, schedule);
    } catch (error) {
      execution.status = 'FAILED';
      execution.error = `${error}`;
      schedule.failureCount++;
    }

    execution.endTime = Date.now();
    execution.duration = execution.endTime - execution.startTime;
  }

  /**
   * Send report to recipients
   */
  private async sendToRecipients(
    execution: ScheduleExecution,
    schedule: Schedule
  ): Promise<void> {
    // In production, would send via email service
    schedule.recipients.forEach((recipient) => {
      // emailService.send(recipient, subject, reportAttachment);
    });
  }

  /**
   * Calculate next run time from cron expression
   */
  private calculateNextRun(cronExpression: string): number {
    // Simplified cron parser
    const parts = cronExpression.split(' ');

    const now = new Date();
    let next = new Date(now);

    // Handle common cron patterns
    if (cronExpression === '@daily') {
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
    } else if (cronExpression === '@weekly') {
      next.setDate(next.getDate() + 7);
      next.setHours(0, 0, 0, 0);
    } else if (cronExpression === '@monthly') {
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      next.setHours(0, 0, 0, 0);
    } else if (cronExpression === '@hourly') {
      next.setHours(next.getHours() + 1);
      next.setMinutes(0, 0, 0);
    } else {
      // Simplified: add 24 hours
      next.setDate(next.getDate() + 1);
    }

    return next.getTime();
  }

  /**
   * Update schedule
   */
  updateSchedule(id: string, updates: Partial<Schedule>): Schedule | null {
    const schedule = this.schedules.get(id);
    if (!schedule) return null;

    const updated = {...schedule, ...updates};
    this.schedules.set(id, updated);

    // Restart if cron expression changed
    if (updates.cronExpression && updates.cronExpression !== schedule.cronExpression) {
      this.stopSchedule(id);
      this.startSchedule(id);
    }

    return updated;
  }

  /**
   * Stop schedule
   */
  stopSchedule(id: string): boolean {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    const schedule = this.schedules.get(id);
    if (schedule) {
      schedule.enabled = false;
      schedule.nextRun = undefined;
    }

    return true;
  }

  /**
   * Delete schedule
   */
  deleteSchedule(id: string): boolean {
    this.stopSchedule(id);
    return this.schedules.delete(id);
  }

  /**
   * Get schedule
   */
  getSchedule(id: string): Schedule | undefined {
    return this.schedules.get(id);
  }

  /**
   * List schedules for report
   */
  listSchedulesForReport(reportId: string): Schedule[] {
    return Array.from(this.schedules.values()).filter((s) => s.reportId === reportId);
  }

  /**
   * List all schedules
   */
  listAllSchedules(): Schedule[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Get execution history
   */
  getExecutionHistory(scheduleId: string, limit: number = 50): ScheduleExecution[] {
    return Array.from(this.executions.values())
      .filter((e) => e.scheduleId === scheduleId)
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  /**
   * Get execution statistics
   */
  getExecutionStatistics(scheduleId: string): {
    totalRuns: number;
    successCount: number;
    failureCount: number;
    averageDuration: number;
    successRate: number;
  } {
    const executions = Array.from(this.executions.values()).filter(
      (e) => e.scheduleId === scheduleId
    );

    const successCount = executions.filter((e) => e.status === 'SUCCESS').length;
    const failureCount = executions.filter((e) => e.status === 'FAILED').length;
    const avgDuration =
      executions.reduce((sum, e) => sum + (e.duration || 0), 0) / Math.max(executions.length, 1);

    return {
      totalRuns: executions.length,
      successCount,
      failureCount,
      averageDuration: Math.round(avgDuration),
      successRate: (successCount / Math.max(executions.length, 1)) * 100,
    };
  }

  /**
   * Test schedule immediately
   */
  async testSchedule(id: string): Promise<{success: boolean; error?: string}> {
    try {
      await this.executeSchedule(id);
      return {success: true};
    } catch (error) {
      return {success: false, error: `${error}`};
    }
  }

  /**
   * Pause all schedules
   */
  pauseAll(): void {
    this.schedules.forEach((schedule) => {
      schedule.enabled = false;
      this.stopSchedule(schedule.id);
    });
  }

  /**
   * Resume all schedules
   */
  resumeAll(): void {
    this.schedules.forEach((schedule) => {
      schedule.enabled = true;
      this.startSchedule(schedule.id);
    });
  }

  /**
   * Get next scheduled reports
   */
  getNextScheduledReports(count: number = 10): Schedule[] {
    return Array.from(this.schedules.values())
      .filter((s) => s.enabled && s.nextRun)
      .sort((a, b) => (a.nextRun || 0) - (b.nextRun || 0))
      .slice(0, count);
  }
}

export default new ReportSchedulingService();
