/**
 * Drill-Down Service
 * Manages hierarchical drilling through report data
 */

export interface DrillDownDefinition {
  id: string;
  sourceField: string;
  targetReportId: string;
  targetField: string;
  parameterMapping: Record<string, string>;
  label?: string;
  enabled: boolean;
}

export interface DrillDownContext {
  reportId: string;
  level: number;
  path: DrillDownStep[];
  currentFilters: Record<string, any>;
}

export interface DrillDownStep {
  reportId: string;
  field: string;
  value: any;
  level: number;
  timestamp: number;
}

export interface DrillDownResult {
  sourceReportId: string;
  targetReportId: string;
  field: string;
  value: any;
  parameters: Record<string, any>;
  context: DrillDownContext;
}

/**
 * DrillDownService - Manage drill-down navigation
 */
class DrillDownService {
  private drillDowns: Map<string, DrillDownDefinition> = new Map();
  private contexts: Map<string, DrillDownContext> = new Map();

  /**
   * Register drill-down definition
   */
  registerDrillDown(definition: DrillDownDefinition): void {
    this.drillDowns.set(definition.id, definition);
  }

  /**
   * Get drill-down definition
   */
  getDrillDown(id: string): DrillDownDefinition | undefined {
    return this.drillDowns.get(id);
  }

  /**
   * Get all drill-downs
   */
  getAllDrillDowns(): DrillDownDefinition[] {
    return Array.from(this.drillDowns.values());
  }

  /**
   * Get drill-downs for field
   */
  getDrillDownsForField(field: string): DrillDownDefinition[] {
    return this.getAllDrillDowns().filter(
      (d) => d.sourceField === field && d.enabled
    );
  }

  /**
   * Check if cell is drillable
   */
  isDrillable(field: string): boolean {
    return this.getDrillDownsForField(field).length > 0;
  }

  /**
   * Execute drill-down
   */
  executeDrillDown(
    sourceReportId: string,
    field: string,
    value: any,
    row: any
  ): DrillDownResult | null {
    const drillDowns = this.getDrillDownsForField(field);
    if (drillDowns.length === 0) return null;

    // Use first matching drill-down
    const drillDown = drillDowns[0];

    // Build parameters
    const parameters: Record<string, any> = {};
    Object.entries(drillDown.parameterMapping).forEach(([source, target]) => {
      parameters[target] = row[source] || value;
    });

    // Create or get context
    let context = this.contexts.get(sourceReportId);
    if (!context) {
      context = {
        reportId: sourceReportId,
        level: 0,
        path: [],
        currentFilters: {},
      };
    }

    // Add step to path
    context.path.push({
      reportId: sourceReportId,
      field,
      value,
      level: context.level,
      timestamp: Date.now(),
    });

    // Update context
    context.level++;
    context.currentFilters[field] = value;
    context.reportId = drillDown.targetReportId;

    this.contexts.set(sourceReportId, context);

    return {
      sourceReportId,
      targetReportId: drillDown.targetReportId,
      field,
      value,
      parameters,
      context,
    };
  }

  /**
   * Navigate back in drill-down
   */
  drillUp(sourceReportId: string): DrillDownContext | null {
    const context = this.contexts.get(sourceReportId);
    if (!context || context.path.length === 0) return null;

    // Remove last step
    const lastStep = context.path[context.path.length - 1];
    context.path.pop();

    // Update context
    context.level = Math.max(0, context.level - 1);
    delete context.currentFilters[lastStep.field];

    if (context.path.length > 0) {
      const previousStep = context.path[context.path.length - 1];
      context.reportId = previousStep.reportId;
    } else {
      context.reportId = sourceReportId;
    }

    return context;
  }

  /**
   * Get drill-down path
   */
  getDrillDownPath(sourceReportId: string): DrillDownStep[] {
    const context = this.contexts.get(sourceReportId);
    return context?.path || [];
  }

  /**
   * Get current drill-down context
   */
  getContext(sourceReportId: string): DrillDownContext | undefined {
    return this.contexts.get(sourceReportId);
  }

  /**
   * Get current filters
   */
  getCurrentFilters(sourceReportId: string): Record<string, any> {
    const context = this.contexts.get(sourceReportId);
    return context?.currentFilters || {};
  }

  /**
   * Build WHERE clause from drill-down filters
   */
  buildWhereClause(sourceReportId: string): string {
    const filters = this.getCurrentFilters(sourceReportId);
    const clauses = Object.entries(filters).map(
      ([field, value]) => `${field} = '${value}'`
    );

    return clauses.length > 0 ? clauses.join(' AND ') : '';
  }

  /**
   * Get drill-down breadcrumb
   */
  getBreadcrumb(sourceReportId: string): Array<{
    label: string;
    value: any;
    field: string;
    level: number;
  }> {
    const path = this.getDrillDownPath(sourceReportId);
    return path.map((step) => ({
      label: `${step.field}: ${step.value}`,
      value: step.value,
      field: step.field,
      level: step.level,
    }));
  }

  /**
   * Clear drill-down context
   */
  clearContext(sourceReportId: string): void {
    this.contexts.delete(sourceReportId);
  }

  /**
   * Can drill down further
   */
  canDrillDown(field: string): boolean {
    return this.isDrillable(field);
  }

  /**
   * Can drill up
   */
  canDrillUp(sourceReportId: string): boolean {
    const context = this.contexts.get(sourceReportId);
    return (context?.path.length || 0) > 0;
  }

  /**
   * Get drill-down depth
   */
  getDrillDownDepth(sourceReportId: string): number {
    const context = this.contexts.get(sourceReportId);
    return context?.level || 0;
  }

  /**
   * Create drill-down definition
   */
  createDrillDown(
    id: string,
    sourceField: string,
    targetReportId: string,
    targetField: string,
    parameterMapping: Record<string, string> = {}
  ): DrillDownDefinition {
    return {
      id,
      sourceField,
      targetReportId,
      targetField,
      parameterMapping,
      enabled: true,
    };
  }

  /**
   * Validate drill-down definition
   */
  validateDrillDown(def: DrillDownDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!def.id) errors.push('Drill-down ID is required');
    if (!def.sourceField) errors.push('Source field is required');
    if (!def.targetReportId) errors.push('Target report ID is required');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get all available drill-down targets
   */
  getAvailableTargets(sourceReportId: string): string[] {
    return Array.from(
      new Set(this.getAllDrillDowns().map((d) => d.targetReportId))
    );
  }

  /**
   * Check if drill-down chain is valid
   */
  validateChain(
    reportId: string,
    fieldPath: string[]
  ): { valid: boolean; error?: string } {
    let currentReportId = reportId;

    for (const field of fieldPath) {
      const drillDowns = this.getAllDrillDowns().filter(
        (d) => d.sourceField === field
      );

      if (drillDowns.length === 0) {
        return {
          valid: false,
          error: `No drill-down found for field: ${field}`,
        };
      }

      currentReportId = drillDowns[0].targetReportId;
    }

    return { valid: true };
  }

  /**
   * Get drill-down chain
   */
  getDrillDownChain(sourceReportId: string, field: string): DrillDownDefinition[] {
    const chain: DrillDownDefinition[] = [];
    let currentField = field;
    let visited = new Set<string>();

    while (true) {
      const drillDowns = this.getDrillDownsForField(currentField);
      if (drillDowns.length === 0) break;

      const next = drillDowns[0];
      if (visited.has(next.id)) break; // Prevent infinite loops

      chain.push(next);
      visited.add(next.id);
      currentField = next.targetField;
    }

    return chain;
  }

  /**
   * Export drill-down definitions
   */
  exportDrillDowns(): string {
    return JSON.stringify(Array.from(this.drillDowns.values()), null, 2);
  }

  /**
   * Import drill-down definitions
   */
  importDrillDowns(json: string): { success: boolean; error?: string } {
    try {
      const definitions = JSON.parse(json) as DrillDownDefinition[];
      definitions.forEach((d) => this.registerDrillDown(d));
      return { success: true };
    } catch (error) {
      return { success: false, error: `${error}` };
    }
  }

  /**
   * Get drill-down statistics
   */
  getStatistics(sourceReportId: string): {
    depth: number;
    breadcrumb: Array<{ field: string; value: any }>;
    canGoBack: boolean;
  } {
    const path = this.getDrillDownPath(sourceReportId);
    return {
      depth: path.length,
      breadcrumb: path.map((step) => ({
        field: step.field,
        value: step.value,
      })),
      canGoBack: path.length > 0,
    };
  }
}

export default new DrillDownService();
