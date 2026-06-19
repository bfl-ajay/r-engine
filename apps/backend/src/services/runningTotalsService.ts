/**
 * Running Totals Service
 * Handles cumulative calculations across data rows
 */

import { RunningTotalDefinition } from '@reporting-engine/shared';

export interface RunningTotal {
  id: string;
  name: string;
  field: string;
  scope: 'REPORT' | 'GROUP' | 'PAGE';
  value: number;
  rowCount: number;
  lastReset?: number;
}

export interface RunningTotalContext {
  groupBreakField?: string;
  pageNumber?: number;
  totals: Map<string, RunningTotal>;
}

/**
 * RunningTotalsService - Manages cumulative calculations
 */
class RunningTotalsService {
  /**
   * Initialize running totals context
   */
  initializeContext(
    definitions: RunningTotalDefinition[]
  ): RunningTotalContext {
    const totals = new Map<string, RunningTotal>();

    definitions.forEach((def) => {
      totals.set(def.id, {
        id: def.id,
        name: def.name,
        field: def.field,
        scope: def.scope,
        value: 0,
        rowCount: 0,
      });
    });

    return {
      totals,
      pageNumber: 1,
    };
  }

  /**
   * Update running totals for a row
   */
  updateTotals(
    row: any,
    context: RunningTotalContext,
    definitions: RunningTotalDefinition[]
  ): void {
    definitions.forEach((def) => {
      const total = context.totals.get(def.id);
      if (!total) return;

      const value = this.getRowValue(row, def);
      if (value === null || value === undefined) return;

      total.value += Number(value);
      total.rowCount++;
    });
  }

  /**
   * Reset totals when group breaks (for GROUP scope)
   */
  resetGroupTotals(
    context: RunningTotalContext,
    definitions: RunningTotalDefinition[]
  ): void {
    definitions.forEach((def) => {
      if (def.scope === 'GROUP') {
        const total = context.totals.get(def.id);
        if (total) {
          total.value = 0;
          total.rowCount = 0;
          total.lastReset = Date.now();
        }
      }
    });
  }

  /**
   * Reset totals when page breaks (for PAGE scope)
   */
  resetPageTotals(
    context: RunningTotalContext,
    definitions: RunningTotalDefinition[]
  ): void {
    definitions.forEach((def) => {
      if (def.scope === 'PAGE') {
        const total = context.totals.get(def.id);
        if (total) {
          total.value = 0;
          total.rowCount = 0;
          total.lastReset = Date.now();
        }
      }
    });
    context.pageNumber = (context.pageNumber || 0) + 1;
  }

  /**
   * Get running total value
   */
  getRunningTotal(
    context: RunningTotalContext,
    totalId: string
  ): number {
    return context.totals.get(totalId)?.value || 0;
  }

  /**
   * Get all running totals
   */
  getAllRunningTotals(context: RunningTotalContext): Map<string, number> {
    const result = new Map<string, number>();
    context.totals.forEach((total, id) => {
      result.set(id, total.value);
    });
    return result;
  }

  /**
   * Get average of running total
   */
  getRunningAverage(
    context: RunningTotalContext,
    totalId: string
  ): number {
    const total = context.totals.get(totalId);
    if (!total || total.rowCount === 0) return 0;
    return total.value / total.rowCount;
  }

  /**
   * Get row count for running total
   */
  getRowCount(context: RunningTotalContext, totalId: string): number {
    return context.totals.get(totalId)?.rowCount || 0;
  }

  /**
   * Apply running totals to data
   */
  applyRunningTotals(
    data: any[],
    definitions: RunningTotalDefinition[]
  ): Array<any & { __runningTotals?: Record<string, number> }> {
    const context = this.initializeContext(definitions);
    const result: Array<any & { __runningTotals?: Record<string, number> }> = [];

    data.forEach((row, index) => {
      this.updateTotals(row, context, definitions);

      const rowWithTotals = {
        ...row,
        __runningTotals: Object.fromEntries(
          Array.from(context.totals.entries()).map(([id, total]) => [
            id,
            total.value,
          ])
        ),
      };

      result.push(rowWithTotals);
    });

    return result;
  }

  /**
   * Get running total statistics
   */
  getStatistics(
    context: RunningTotalContext,
    totalId: string
  ): {
    total: number;
    average: number;
    count: number;
    min?: number;
    max?: number;
  } {
    const total = context.totals.get(totalId);
    if (!total)
      return { total: 0, average: 0, count: 0 };

    return {
      total: total.value,
      average: total.rowCount > 0 ? total.value / total.rowCount : 0,
      count: total.rowCount,
    };
  }

  /**
   * Get row value (handle expressions)
   */
  private getRowValue(row: any, def: RunningTotalDefinition): any {
    if (def.expression) {
      // Would use expression engine here
      return this.evaluateExpression(def.expression, row);
    }
    return row[def.field];
  }

  /**
   * Simple expression evaluation (integration point)
   */
  private evaluateExpression(expression: string, row: any): any {
    try {
      // Replace {fieldName} with actual values
      let expr = expression;
      const matches = expr.match(/{([^}]+)}/g);

      if (matches) {
        matches.forEach((match) => {
          const field = match.slice(1, -1);
          const value = row[field];
          expr = expr.replace(match, value || 0);
        });
      }

      // eslint-disable-next-line no-new-func
      return new Function('row', `return ${expr}`)(row);
    } catch (error) {
      console.error(`Error evaluating expression: ${expression}`, error);
      return 0;
    }
  }

  /**
   * Format running total value
   */
  formatRunningTotal(
    value: number,
    format?: string
  ): string {
    if (!format) return String(value);

    switch (format.toLowerCase()) {
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'percent':
        return `${(value * 100).toFixed(2)}%`;
      case 'decimal2':
        return value.toFixed(2);
      case 'decimal0':
        return value.toFixed(0);
      case 'thousand':
        return (value / 1000).toFixed(1) + 'K';
      default:
        return String(value);
    }
  }

  /**
   * Validate running total definitions
   */
  validateDefinitions(
    definitions: RunningTotalDefinition[],
    availableFields: string[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    definitions.forEach((def, index) => {
      if (!def.id) {
        errors.push(`Running total ${index}: id is required`);
      }

      if (!def.field && !def.expression) {
        errors.push(
          `Running total ${index}: either field or expression is required`
        );
      }

      if (def.field && !availableFields.includes(def.field)) {
        errors.push(
          `Running total ${index}: field "${def.field}" not found in available fields`
        );
      }

      if (!['REPORT', 'GROUP', 'PAGE'].includes(def.scope)) {
        errors.push(
          `Running total ${index}: scope must be REPORT, GROUP, or PAGE`
        );
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clone running totals context
   */
  cloneContext(context: RunningTotalContext): RunningTotalContext {
    return {
      ...context,
      totals: new Map(context.totals),
    };
  }

  /**
   * Create running total definition
   */
  createDefinition(
    id: string,
    name: string,
    field: string,
    scope: 'REPORT' | 'GROUP' | 'PAGE' = 'REPORT',
    format?: string
  ): RunningTotalDefinition {
    return {
      id,
      name,
      field,
      scope,
      format,
    };
  }

  /**
   * Get running total progress (percentage)
   */
  getProgress(
    context: RunningTotalContext,
    totalId: string,
    target: number
  ): number {
    if (target <= 0) return 0;
    const value = this.getRunningTotal(context, totalId);
    return Math.min((value / target) * 100, 100);
  }

  /**
   * Check if running total reached target
   */
  reachedTarget(
    context: RunningTotalContext,
    totalId: string,
    target: number
  ): boolean {
    return this.getRunningTotal(context, totalId) >= target;
  }
}

export default new RunningTotalsService();
