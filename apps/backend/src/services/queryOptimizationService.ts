/**
 * Query Optimization Service
 * Optimizes queries for better performance
 */

import { AdvancedQueryBuilder, FilterDefinition } from '@reporting-engine/shared';

export interface QueryAnalysis {
  complexity: number; // 1-100
  estimatedRows: number;
  selectivity: number; // 0-1
  hasIndexableColumns: boolean;
  recommendations: string[];
  optimized: boolean;
}

export interface OptimizationStrategy {
  name: string;
  description: string;
  appliedCount: number;
  estimatedImprovement: number; // percentage
}

/**
 * QueryOptimizationService - Optimize database queries
 */
class QueryOptimizationService {
  private statistics: Map<string, QueryAnalysis> = new Map();
  private strategies: Map<string, OptimizationStrategy> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Initialize optimization strategies
   */
  private initializeStrategies(): void {
    this.strategies.set('pushdown_filters', {
      name: 'Push Down Filters',
      description: 'Move filters to WHERE clause in query',
      appliedCount: 0,
      estimatedImprovement: 30,
    });

    this.strategies.set('use_indexes', {
      name: 'Use Indexes',
      description: 'Optimize for indexed columns',
      appliedCount: 0,
      estimatedImprovement: 50,
    });

    this.strategies.set('reduce_columns', {
      name: 'Reduce Selected Columns',
      description: 'Select only required columns',
      appliedCount: 0,
      estimatedImprovement: 20,
    });

    this.strategies.set('limit_rows', {
      name: 'Add Limit',
      description: 'Limit result rows when possible',
      appliedCount: 0,
      estimatedImprovement: 40,
    });

    this.strategies.set('join_optimization', {
      name: 'Join Optimization',
      description: 'Optimize join order',
      appliedCount: 0,
      estimatedImprovement: 25,
    });
  }

  /**
   * Optimize query builder
   */
  optimizeQuery(builder: AdvancedQueryBuilder): AdvancedQueryBuilder {
    let optimized = { ...builder };

    // 1. Push down filters to WHERE clause
    if (!optimized.where || optimized.where.length === 0) {
      optimized = this.pushDownFilters(optimized);
    }

    // 2. Reduce selected columns
    optimized = this.reduceColumns(optimized);

    // 3. Add default limit if not present
    if (!optimized.limit && optimized.limit !== 0) {
      optimized.limit = 10000; // Default safety limit
    }

    // 4. Optimize joins
    if (optimized.joins && optimized.joins.length > 1) {
      optimized = this.optimizeJoins(optimized);
    }

    // 5. Optimize grouping
    if (optimized.groupBy && optimized.groupBy.length > 0) {
      optimized = this.optimizeGrouping(optimized);
    }

    return optimized;
  }

  /**
   * Push down filters to WHERE clause
   */
  private pushDownFilters(
    builder: AdvancedQueryBuilder
  ): AdvancedQueryBuilder {
    // This would typically involve analyzing ORDER BY and GROUP BY
    // and moving applicable conditions to WHERE
    return builder;
  }

  /**
   * Reduce selected columns to only needed ones
   */
  private reduceColumns(
    builder: AdvancedQueryBuilder
  ): AdvancedQueryBuilder {
    // Remove duplicates and unnecessary columns
    const unique = Array.from(new Set(builder.select));
    return { ...builder, select: unique };
  }

  /**
   * Optimize join order
   */
  private optimizeJoins(
    builder: AdvancedQueryBuilder
  ): AdvancedQueryBuilder {
    if (!builder.joins) return builder;

    // Sort joins by estimated selectivity (put more selective joins first)
    const optimized = [...builder.joins].sort((a, b) => {
      const aSelectivity = this.estimateJoinSelectivity(a.condition);
      const bSelectivity = this.estimateJoinSelectivity(b.condition);
      return aSelectivity - bSelectivity;
    });

    return { ...builder, joins: optimized };
  }

  /**
   * Optimize grouping (move HAVING to WHERE when possible)
   */
  private optimizeGrouping(
    builder: AdvancedQueryBuilder
  ): AdvancedQueryBuilder {
    if (!builder.having) return builder;

    // Conditions on non-aggregated columns can move to WHERE
    const where = builder.where || [];
    const having = builder.having || [];

    const moveToWhere = having.filter(
      (h) => !this.isAggregateField(h.field, builder)
    );

    if (moveToWhere.length > 0) {
      return {
        ...builder,
        where: [...where, ...moveToWhere],
        having: having.filter((h) => !moveToWhere.includes(h)),
      };
    }

    return builder;
  }

  /**
   * Analyze query for optimization opportunities
   */
  analyzeQuery(
    builder: AdvancedQueryBuilder,
    tableRowCounts?: Map<string, number>
  ): QueryAnalysis {
    const analysis: QueryAnalysis = {
      complexity: this.calculateComplexity(builder),
      estimatedRows: this.estimateRowCount(builder, tableRowCounts),
      selectivity: this.estimateSelectivity(builder),
      hasIndexableColumns: this.hasIndexableColumns(builder),
      recommendations: this.generateRecommendations(builder),
      optimized: false,
    };

    return analysis;
  }

  /**
   * Calculate query complexity (1-100)
   */
  private calculateComplexity(builder: AdvancedQueryBuilder): number {
    let complexity = 10; // Base

    if (builder.joins) complexity += builder.joins.length * 15;
    if (builder.groupBy) complexity += builder.groupBy.length * 10;
    if (builder.having) complexity += 15;
    if (builder.where) complexity += builder.where.length * 5;

    return Math.min(complexity, 100);
  }

  /**
   * Estimate row count
   */
  private estimateRowCount(
    builder: AdvancedQueryBuilder,
    tableRowCounts?: Map<string, number>
  ): number {
    let estimate = tableRowCounts?.get(builder.from) || 100000;

    // Apply selectivity factor
    const selectivity = this.estimateSelectivity(builder);
    estimate = Math.floor(estimate * selectivity);

    // Apply limit
    if (builder.limit) {
      estimate = Math.min(estimate, builder.limit);
    }

    return estimate;
  }

  /**
   * Estimate selectivity (0-1)
   */
  private estimateSelectivity(builder: AdvancedQueryBuilder): number {
    if (!builder.where || builder.where.length === 0) return 1.0;

    // Each condition reduces selectivity by ~30%
    let selectivity = 1.0;
    builder.where.forEach(() => {
      selectivity *= 0.7;
    });

    return Math.max(selectivity, 0.01);
  }

  /**
   * Check if query uses indexable columns
   */
  private hasIndexableColumns(builder: AdvancedQueryBuilder): boolean {
    // Common indexed columns
    const indexedColumns = ['id', 'date', 'created_at', 'status', 'type'];

    const hasIndexed =
      builder.where?.some((f) =>
        indexedColumns.some((col) => f.field.includes(col))
      ) || false;

    return hasIndexed;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    builder: AdvancedQueryBuilder
  ): string[] {
    const recommendations: string[] = [];

    // Check for missing WHERE clause
    if (!builder.where || builder.where.length === 0) {
      recommendations.push('Consider adding WHERE clause to reduce data');
    }

    // Check for SELECT *
    if (builder.select.includes('*')) {
      recommendations.push('Avoid SELECT * - specify only needed columns');
    }

    // Check for multiple JOINs
    if (builder.joins && builder.joins.length > 3) {
      recommendations.push('Consider splitting query - too many joins');
    }

    // Check for missing LIMIT
    if (!builder.limit) {
      recommendations.push('Add LIMIT clause to prevent loading huge datasets');
    }

    // Check for expensive operators
    if (builder.where?.some((f) => f.operator === 'LIKE')) {
      recommendations.push('LIKE operator is slow - use exact match if possible');
    }

    return recommendations;
  }

  /**
   * Estimate join selectivity
   */
  private estimateJoinSelectivity(condition: string): number {
    // Simple heuristic - joins with equality on IDs are more selective
    if (condition.includes('=')) return 0.5;
    if (condition.includes('<') || condition.includes('>')) return 0.3;
    return 1.0;
  }

  /**
   * Check if field is aggregate function result
   */
  private isAggregateField(field: string, builder: AdvancedQueryBuilder): boolean {
    const aggregateFunctions = ['SUM', 'COUNT', 'AVG', 'MIN', 'MAX'];
    return aggregateFunctions.some((fn) => field.toUpperCase().includes(fn));
  }

  /**
   * Get optimization strategies used
   */
  getStrategies(): OptimizationStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Get strategy statistics
   */
  getStrategyStats(name: string): OptimizationStrategy | undefined {
    return this.strategies.get(name);
  }

  /**
   * Record strategy application
   */
  private recordStrategy(name: string): void {
    const strategy = this.strategies.get(name);
    if (strategy) {
      strategy.appliedCount++;
    }
  }

  /**
   * Get optimization report
   */
  getOptimizationReport(builder: AdvancedQueryBuilder): {
    original: QueryAnalysis;
    optimized: QueryAnalysis;
    estimatedImprovement: number;
  } {
    const original = this.analyzeQuery(builder);
    const optimizedBuilder = this.optimizeQuery(builder);
    const optimized = this.analyzeQuery(optimizedBuilder);

    const improvement = (
      ((original.estimatedRows - optimized.estimatedRows) /
        original.estimatedRows) *
      100
    ).toFixed(2);

    return {
      original,
      optimized,
      estimatedImprovement: parseFloat(improvement),
    };
  }

  /**
   * Suggest indexes
   */
  suggestIndexes(builder: AdvancedQueryBuilder): string[] {
    const suggestions: string[] = [];

    // Suggest indexes on WHERE columns
    builder.where?.forEach((filter) => {
      suggestions.push(`CREATE INDEX idx_${filter.field} ON ${builder.from}(${filter.field})`);
    });

    // Suggest indexes on JOIN columns
    builder.joins?.forEach((join) => {
      const columns = join.condition.split('=').map((c) => c.trim());
      columns.forEach((col) => {
        if (!suggestions.includes(col)) {
          suggestions.push(`CREATE INDEX idx_${col} ON (${col})`);
        }
      });
    });

    return [...new Set(suggestions)]; // Remove duplicates
  }

  /**
   * Estimate execution time
   */
  estimateExecutionTime(builder: AdvancedQueryBuilder): {
    estimated: string;
    unit: string;
  } {
    const complexity = this.calculateComplexity(builder);
    const rows = this.estimateRowCount(builder);

    // Very rough estimate: 10ms per 10K rows + complexity factor
    const baseTime = (rows / 10000) * 10;
    const complexityFactor = (complexity / 100) * 100;
    const estimatedMs = baseTime + complexityFactor;

    if (estimatedMs < 1000) {
      return { estimated: estimatedMs.toFixed(0), unit: 'ms' };
    } else if (estimatedMs < 60000) {
      return { estimated: (estimatedMs / 1000).toFixed(2), unit: 's' };
    } else {
      return { estimated: (estimatedMs / 60000).toFixed(2), unit: 'm' };
    }
  }

  /**
   * Cache query analysis
   */
  cacheAnalysis(key: string, analysis: QueryAnalysis): void {
    this.statistics.set(key, analysis);
  }

  /**
   * Get cached analysis
   */
  getCachedAnalysis(key: string): QueryAnalysis | undefined {
    return this.statistics.get(key);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.statistics.clear();
  }
}

export default new QueryOptimizationService();
