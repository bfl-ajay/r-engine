/**
 * Performance Monitoring Service
 * Tracks and monitors report generation and query performance
 */

export interface PerformanceMetric {
  id: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  metadata: Record<string, any>;
}

export interface PerformanceStats {
  operation: string;
  count: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
  slowest: PerformanceMetric[];
  fastest: PerformanceMetric[];
}

export interface PerformanceThreshold {
  operation: string;
  warningMs: number;
  criticalMs: number;
}

/**
 * PerformanceMonitoringService - Monitor application performance
 */
class PerformanceMonitoringService {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private thresholds: Map<string, PerformanceThreshold> = new Map();
  private alerts: Array<{ timestamp: number; message: string; severity: string }> = [];

  constructor() {
    this.initializeThresholds();
  }

  /**
   * Initialize default thresholds
   */
  private initializeThresholds(): void {
    this.thresholds.set('query_execution', {
      operation: 'query_execution',
      warningMs: 5000,
      criticalMs: 10000,
    });

    this.thresholds.set('report_rendering', {
      operation: 'report_rendering',
      warningMs: 10000,
      criticalMs: 30000,
    });

    this.thresholds.set('data_export', {
      operation: 'data_export',
      warningMs: 15000,
      criticalMs: 60000,
    });
  }

  /**
   * Start monitoring an operation
   */
  startOperation(operation: string, metadata?: Record<string, any>): string {
    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const metric: PerformanceMetric = {
      id,
      operation,
      startTime: Date.now(),
      success: false,
      metadata: metadata || {},
    };

    this.metrics.set(id, metric);
    return id;
  }

  /**
   * End operation and record metrics
   */
  endOperation(
    operationId: string,
    success: boolean = true,
    error?: string
  ): PerformanceMetric | null {
    const metric = this.metrics.get(operationId);
    if (!metric) return null;

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.success = success;
    metric.error = error;

    // Check thresholds
    this.checkThresholds(metric);

    return metric;
  }

  /**
   * Check if metric exceeds thresholds
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.get(metric.operation);
    if (!threshold || !metric.duration) return;

    if (metric.duration > threshold.criticalMs) {
      this.recordAlert({
        timestamp: Date.now(),
        message: `CRITICAL: ${metric.operation} took ${metric.duration}ms (threshold: ${threshold.criticalMs}ms)`,
        severity: 'CRITICAL',
      });
    } else if (metric.duration > threshold.warningMs) {
      this.recordAlert({
        timestamp: Date.now(),
        message: `WARNING: ${metric.operation} took ${metric.duration}ms (threshold: ${threshold.warningMs}ms)`,
        severity: 'WARNING',
      });
    }
  }

  /**
   * Record an alert
   */
  private recordAlert(alert: {
    timestamp: number;
    message: string;
    severity: string;
  }): void {
    this.alerts.push(alert);

    // Keep last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
  }

  /**
   * Get performance stats for operation
   */
  getStats(operation: string): PerformanceStats | null {
    const operationMetrics = Array.from(this.metrics.values()).filter(
      (m) => m.operation === operation
    );

    if (operationMetrics.length === 0) return null;

    const durations = operationMetrics
      .filter((m) => m.duration !== undefined)
      .map((m) => m.duration as number);

    const successCount = operationMetrics.filter((m) => m.success).length;

    return {
      operation,
      count: operationMetrics.length,
      totalTime: durations.reduce((a, b) => a + b, 0),
      averageTime: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      minTime: durations.length > 0 ? Math.min(...durations) : 0,
      maxTime: durations.length > 0 ? Math.max(...durations) : 0,
      successRate: operationMetrics.length > 0 ? (successCount / operationMetrics.length) * 100 : 0,
      slowest: this.getSlowestMetrics(operation, 5),
      fastest: this.getFastestMetrics(operation, 5),
    };
  }

  /**
   * Get slowest metrics
   */
  private getSlowestMetrics(operation: string, limit: number): PerformanceMetric[] {
    return Array.from(this.metrics.values())
      .filter((m) => m.operation === operation && m.duration)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, limit);
  }

  /**
   * Get fastest metrics
   */
  private getFastestMetrics(operation: string, limit: number): PerformanceMetric[] {
    return Array.from(this.metrics.values())
      .filter((m) => m.operation === operation && m.duration)
      .sort((a, b) => (a.duration || 0) - (b.duration || 0))
      .slice(0, limit);
  }

  /**
   * Get all stats
   */
  getAllStats(): PerformanceStats[] {
    const operations = new Set(Array.from(this.metrics.values()).map((m) => m.operation));
    const stats: PerformanceStats[] = [];

    operations.forEach((op) => {
      const stat = this.getStats(op);
      if (stat) stats.push(stat);
    });

    return stats;
  }

  /**
   * Get alerts
   */
  getAlerts(limit: number = 100): Array<{
    timestamp: number;
    message: string;
    severity: string;
  }> {
    return this.alerts.slice(-limit).reverse();
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(sinceMsAgo: number): Array<{
    timestamp: number;
    message: string;
    severity: string;
  }> {
    const since = Date.now() - sinceMsAgo;
    return this.alerts.filter((a) => a.timestamp > since);
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Set threshold
   */
  setThreshold(
    operation: string,
    warningMs: number,
    criticalMs: number
  ): void {
    this.thresholds.set(operation, {
      operation,
      warningMs,
      criticalMs,
    });
  }

  /**
   * Get threshold
   */
  getThreshold(operation: string): PerformanceThreshold | undefined {
    return this.thresholds.get(operation);
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    timestamp: number;
    stats: PerformanceStats[];
    alerts: Array<{ timestamp: number; message: string; severity: string }>;
    summary: {
      totalOperations: number;
      totalTime: number;
      averageTime: number;
      criticalAlerts: number;
      warningAlerts: number;
    };
  } {
    const stats = this.getAllStats();
    const totalOperations = stats.reduce((a, s) => a + s.count, 0);
    const totalTime = stats.reduce((a, s) => a + s.totalTime, 0);
    const criticalAlerts = this.alerts.filter((a) => a.severity === 'CRITICAL').length;
    const warningAlerts = this.alerts.filter((a) => a.severity === 'WARNING').length;

    return {
      timestamp: Date.now(),
      stats,
      alerts: this.getAlerts(50),
      summary: {
        totalOperations,
        totalTime,
        averageTime: totalOperations > 0 ? totalTime / totalOperations : 0,
        criticalAlerts,
        warningAlerts,
      },
    };
  }

  /**
   * Get metric by ID
   */
  getMetric(id: string): PerformanceMetric | undefined {
    return this.metrics.get(id);
  }

  /**
   * Get metrics for operation in time range
   */
  getMetricsInRange(
    operation: string,
    startTime: number,
    endTime: number
  ): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(
      (m) =>
        m.operation === operation &&
        m.startTime >= startTime &&
        m.startTime <= endTime
    );
  }

  /**
   * Get operation completion rate
   */
  getCompletionRate(operation: string): number {
    const metrics = Array.from(this.metrics.values()).filter(
      (m) => m.operation === operation
    );

    if (metrics.length === 0) return 0;

    const completed = metrics.filter((m) => m.endTime).length;
    return (completed / metrics.length) * 100;
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    const data = {
      metrics: Array.from(this.metrics.values()),
      alerts: this.alerts,
      thresholds: Array.from(this.thresholds.values()),
      stats: this.getAllStats(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Get operation timeline
   */
  getTimeline(operation: string): Array<{
    time: number;
    duration: number;
    success: boolean;
  }> {
    return Array.from(this.metrics.values())
      .filter((m) => m.operation === operation && m.duration)
      .map((m) => ({
        time: m.startTime,
        duration: m.duration || 0,
        success: m.success,
      }))
      .sort((a, b) => a.time - b.time);
  }

  /**
   * Get bottleneck analysis
   */
  getBottlenecks(): Array<{
    operation: string;
    averageTime: number;
    percentageOfTotal: number;
  }> {
    const stats = this.getAllStats();
    const totalTime = stats.reduce((a, s) => a + s.totalTime, 0);

    return stats
      .map((s) => ({
        operation: s.operation,
        averageTime: s.averageTime,
        percentageOfTotal: (s.totalTime / totalTime) * 100,
      }))
      .sort((a, b) => b.percentageOfTotal - a.percentageOfTotal);
  }

  /**
   * Check health
   */
  checkHealth(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];
    const stats = this.getAllStats();

    stats.forEach((stat) => {
      if (stat.successRate < 95) {
        issues.push(
          `${stat.operation}: Success rate is ${stat.successRate.toFixed(2)}%`
        );
      }

      if (stat.averageTime > 10000) {
        issues.push(
          `${stat.operation}: Average execution time is ${stat.averageTime.toFixed(0)}ms`
        );
      }
    });

    return {
      healthy: issues.length === 0,
      issues,
    };
  }
}

export default new PerformanceMonitoringService();
