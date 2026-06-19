/**
 * Filtering Service
 * Handles advanced data filtering with operators and logical conditions
 */

import { FilterDefinition, AdvancedFilteringConfiguration } from '@reporting-engine/shared';

export interface FilterResult {
  filtered: any[];
  totalRows: number;
  matchedRows: number;
  executionTime: number;
}

export interface FilterValidation {
  valid: boolean;
  errors: string[];
}

/**
 * FilteringService - Handles data filtering operations
 */
class FilteringService {
  /**
   * Apply filters to data
   */
  filterData(data: any[], filters: FilterDefinition[]): FilterResult {
    const startTime = performance.now();

    if (!filters || filters.length === 0) {
      return {
        filtered: data,
        totalRows: data.length,
        matchedRows: data.length,
        executionTime: performance.now() - startTime,
      };
    }

    const filtered = data.filter((row) => this.matchesFilters(row, filters));

    return {
      filtered,
      totalRows: data.length,
      matchedRows: filtered.length,
      executionTime: performance.now() - startTime,
    };
  }

  /**
   * Check if row matches all filter conditions
   */
  private matchesFilters(row: any, filters: FilterDefinition[]): boolean {
    let result = true;

    filters.forEach((filter) => {
      const matches = this.matchesFilter(row, filter);
      const logic = filter.logic || 'AND';

      if (logic === 'AND') {
        result = result && matches;
      } else if (logic === 'OR') {
        result = result || matches;
      }
    });

    return result;
  }

  /**
   * Check if row matches single filter
   */
  private matchesFilter(row: any, filter: FilterDefinition): boolean {
    const value = row[filter.field];

    switch (filter.operator) {
      case '=':
        return this.equals(value, filter.value);

      case '!=':
        return !this.equals(value, filter.value);

      case '>':
        return this.greaterThan(value, filter.value);

      case '>=':
        return this.greaterThanOrEqual(value, filter.value);

      case '<':
        return this.lessThan(value, filter.value);

      case '<=':
        return this.lessThanOrEqual(value, filter.value);

      case 'IN':
        return this.inList(value, filter.values);

      case 'LIKE':
        return this.like(value, filter.value);

      case 'BETWEEN':
        return (
          this.greaterThanOrEqual(value, filter.value) &&
          this.lessThanOrEqual(value, filter.values?.[0])
        );

      case 'IS_NULL':
        return value === null || value === undefined;

      default:
        return true;
    }
  }

  /**
   * Equality comparison
   */
  private equals(a: any, b: any): boolean {
    if (a === null || a === undefined) {
      return b === null || b === undefined;
    }

    if (typeof a === 'string' && typeof b === 'string') {
      return a.toLowerCase() === b.toLowerCase();
    }

    return a === b;
  }

  /**
   * Greater than comparison
   */
  private greaterThan(a: any, b: any): boolean {
    if (a === null || a === undefined) return false;
    if (typeof a === 'string') return a.localeCompare(b) > 0;
    return Number(a) > Number(b);
  }

  /**
   * Greater than or equal comparison
   */
  private greaterThanOrEqual(a: any, b: any): boolean {
    return this.equals(a, b) || this.greaterThan(a, b);
  }

  /**
   * Less than comparison
   */
  private lessThan(a: any, b: any): boolean {
    if (a === null || a === undefined) return true;
    if (typeof a === 'string') return a.localeCompare(b) < 0;
    return Number(a) < Number(b);
  }

  /**
   * Less than or equal comparison
   */
  private lessThanOrEqual(a: any, b: any): boolean {
    return this.equals(a, b) || this.lessThan(a, b);
  }

  /**
   * Check if value is in list
   */
  private inList(value: any, list?: any[]): boolean {
    if (!list || list.length === 0) return false;
    return list.some((item) => this.equals(value, item));
  }

  /**
   * Pattern matching (LIKE operator)
   */
  private like(value: any, pattern: any): boolean {
    if (value === null || value === undefined) return false;

    const str = String(value).toLowerCase();
    const pat = String(pattern).toLowerCase();

    // Convert SQL LIKE pattern to regex
    const regexPattern = pat
      .replace(/\%/g, '.*')
      .replace(/\_/g, '.');

    try {
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(str);
    } catch (error) {
      console.error('Error in LIKE filter:', error);
      return false;
    }
  }

  /**
   * Apply complex filter configuration
   */
  applyFilterConfiguration(
    data: any[],
    config: AdvancedFilteringConfiguration
  ): FilterResult {
    if (!config.enabled) {
      return {
        filtered: data,
        totalRows: data.length,
        matchedRows: data.length,
        executionTime: 0,
      };
    }

    let filtered = data;
    const startTime = performance.now();

    // Apply default filters
    if (config.defaultFilters && config.defaultFilters.length > 0) {
      filtered = this.filterData(filtered, config.defaultFilters).filtered;
    }

    // Apply saved filters if needed (handled separately by caller)

    return {
      filtered,
      totalRows: data.length,
      matchedRows: filtered.length,
      executionTime: performance.now() - startTime,
    };
  }

  /**
   * Validate filter definitions
   */
  validateFilters(
    filters: FilterDefinition[],
    availableFields: string[]
  ): FilterValidation {
    const errors: string[] = [];

    if (!filters || filters.length === 0) {
      return { valid: true, errors: [] };
    }

    filters.forEach((filter, index) => {
      if (!filter.field) {
        errors.push(`Filter ${index}: field is required`);
      } else if (!availableFields.includes(filter.field)) {
        errors.push(
          `Filter ${index}: field "${filter.field}" not found in available fields`
        );
      }

      const validOperators = [
        '=',
        '!=',
        '>',
        '>=',
        '<',
        '<=',
        'IN',
        'LIKE',
        'BETWEEN',
        'IS_NULL',
      ];

      if (!validOperators.includes(filter.operator)) {
        errors.push(
          `Filter ${index}: invalid operator "${filter.operator}"`
        );
      }

      // Value validation based on operator
      if (filter.operator === 'BETWEEN') {
        if (!filter.value || !filter.values || filter.values.length < 1) {
          errors.push(
            `Filter ${index}: BETWEEN requires value and values array`
          );
        }
      } else if (filter.operator === 'IN') {
        if (!filter.values || filter.values.length === 0) {
          errors.push(`Filter ${index}: IN requires non-empty values array`);
        }
      } else if (filter.operator !== 'IS_NULL') {
        if (filter.value === null && filter.value === undefined) {
          errors.push(`Filter ${index}: value is required for this operator`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build SQL WHERE clause from filters
   */
  buildSqlWhereClause(filters: FilterDefinition[]): string {
    if (!filters || filters.length === 0) return '';

    const clauses = filters.map((filter, index) => {
      const paramName = `$${index + 1}`;

      switch (filter.operator) {
        case '=':
          return `${filter.field} = ${paramName}`;
        case '!=':
          return `${filter.field} != ${paramName}`;
        case '>':
          return `${filter.field} > ${paramName}`;
        case '>=':
          return `${filter.field} >= ${paramName}`;
        case '<':
          return `${filter.field} < ${paramName}`;
        case '<=':
          return `${filter.field} <= ${paramName}`;
        case 'IN':
          const placeholders = filter.values
            ?.map((_, i) => `$${index + i + 1}`)
            .join(',');
          return `${filter.field} IN (${placeholders})`;
        case 'LIKE':
          return `${filter.field} LIKE ${paramName}`;
        case 'BETWEEN':
          return `${filter.field} BETWEEN ${paramName} AND $${index + 2}`;
        case 'IS_NULL':
          return `${filter.field} IS NULL`;
        default:
          return '';
      }
    });

    return clauses.filter((c) => c.length > 0).join(' AND ');
  }

  /**
   * Create filter from UI input
   */
  createFilter(
    field: string,
    operator: string,
    value?: any,
    values?: any[]
  ): FilterDefinition {
    return {
      field,
      operator: operator as FilterDefinition['operator'],
      value,
      values,
      logic: 'AND',
    };
  }

  /**
   * Add filter to list
   */
  addFilter(
    filters: FilterDefinition[],
    newFilter: FilterDefinition
  ): FilterDefinition[] {
    return [...filters, newFilter];
  }

  /**
   * Remove filter by index
   */
  removeFilter(
    filters: FilterDefinition[],
    index: number
  ): FilterDefinition[] {
    return filters.filter((_, i) => i !== index);
  }

  /**
   * Update filter by index
   */
  updateFilter(
    filters: FilterDefinition[],
    index: number,
    updated: FilterDefinition
  ): FilterDefinition[] {
    return filters.map((f, i) => (i === index ? updated : f));
  }

  /**
   * Clear all filters
   */
  clearFilters(): FilterDefinition[] {
    return [];
  }

  /**
   * Get filter count
   */
  getFilterCount(filters: FilterDefinition[]): number {
    return filters?.length || 0;
  }

  /**
   * Check if filtering is active
   */
  isFilteringActive(filters: FilterDefinition[]): boolean {
    return this.getFilterCount(filters) > 0;
  }

  /**
   * Get filter description
   */
  getFilterDescription(filter: FilterDefinition): string {
    let desc = `${filter.field} ${filter.operator}`;

    if (filter.operator === 'IN' && filter.values) {
      desc += ` (${filter.values.join(', ')})`;
    } else if (filter.operator === 'BETWEEN' && filter.value && filter.values) {
      desc += ` ${filter.value} AND ${filter.values[0]}`;
    } else if (filter.operator !== 'IS_NULL' && filter.value !== undefined) {
      desc += ` ${filter.value}`;
    }

    return desc;
  }

  /**
   * Export filters as JSON
   */
  exportFilters(filters: FilterDefinition[]): string {
    return JSON.stringify(filters, null, 2);
  }

  /**
   * Import filters from JSON
   */
  importFilters(json: string): FilterDefinition[] {
    try {
      return JSON.parse(json) as FilterDefinition[];
    } catch (error) {
      console.error('Error parsing filters JSON:', error);
      return [];
    }
  }
}

export default new FilteringService();
