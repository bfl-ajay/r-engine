/**
 * Sorting Service
 * Handles data sorting with multi-level support and custom comparators
 */

import { SortDefinitionEx, SortFieldConfiguration } from '@reporting-engine/shared';

export interface SortContext {
  fields: SortDefinitionEx[];
  customComparators?: Map<string, (a: any, b: any) => number>;
  caseInsensitive?: boolean;
  nullsFirst?: boolean;
}

/**
 * SortingService - Handles data sorting operations
 */
class SortingService {
  /**
   * Sort data by multiple fields
   * @param data Array of data rows
   * @param sortDefinitions Sort field definitions
   * @param context Additional sorting context
   * @returns Sorted array
   */
  sortData(
    data: any[],
    sortDefinitions: SortDefinitionEx[],
    context?: SortContext
  ): any[] {
    if (!sortDefinitions || sortDefinitions.length === 0) {
      return [...data];
    }

    // Create a copy to avoid mutating original data
    const sorted = [...data];

    // Create sort context with defaults
    const ctx: SortContext = {
      fields: sortDefinitions,
      customComparators: context?.customComparators || new Map(),
      caseInsensitive: context?.caseInsensitive ?? true,
      nullsFirst: context?.nullsFirst ?? false,
    };

    sorted.sort((a, b) => this.compareRows(a, b, ctx));
    return sorted;
  }

  /**
   * Compare two rows across multiple sort fields
   */
  private compareRows(a: any, b: any, context: SortContext): number {
    for (const sortDef of context.fields) {
      const comparison = this.compareValues(
        a[sortDef.field],
        b[sortDef.field],
        sortDef.direction,
        context
      );

      if (comparison !== 0) {
        return comparison;
      }
    }
    return 0;
  }

  /**
   * Compare two values
   */
  private compareValues(
    a: any,
    b: any,
    direction: 'ASC' | 'DESC',
    context: SortContext
  ): number {
    // Handle nulls
    if (a === null || a === undefined) {
      if (b === null || b === undefined) return 0;
      return context.nullsFirst ? -1 : 1;
    }
    if (b === null || b === undefined) {
      return context.nullsFirst ? 1 : -1;
    }

    let comparison = 0;

    // Check for custom comparator
    const customComparator = context.customComparators?.get(
      this.getValueType(a)
    );
    if (customComparator) {
      comparison = customComparator(a, b);
    } else {
      comparison = this.defaultCompare(a, b, context.caseInsensitive);
    }

    return direction === 'DESC' ? -comparison : comparison;
  }

  /**
   * Default comparison logic for different types
   */
  private defaultCompare(a: any, b: any, caseInsensitive: boolean): number {
    const typeA = this.getValueType(a);
    const typeB = this.getValueType(b);

    // Different types - sort by type name
    if (typeA !== typeB) {
      return typeA.localeCompare(typeB);
    }

    switch (typeA) {
      case 'number':
        return a - b;

      case 'date':
        return new Date(a).getTime() - new Date(b).getTime();

      case 'boolean':
        return a === b ? 0 : a ? 1 : -1;

      case 'string':
        if (caseInsensitive) {
          return String(a)
            .toLowerCase()
            .localeCompare(String(b).toLowerCase());
        }
        return String(a).localeCompare(String(b));

      case 'object':
        return JSON.stringify(a).localeCompare(JSON.stringify(b));

      default:
        return String(a).localeCompare(String(b));
    }
  }

  /**
   * Get normalized value type
   */
  private getValueType(value: any): string {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string') return 'string';
    if (value instanceof Date) return 'date';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'unknown';
  }

  /**
   * Sort data with custom comparator function
   * @param data Array of data rows
   * @param field Field name
   * @param comparatorFn Comparator function as string (JavaScript code)
   * @param direction Sort direction
   * @returns Sorted array
   */
  sortWithCustomComparator(
    data: any[],
    field: string,
    comparatorFn: string,
    direction: 'ASC' | 'DESC' = 'ASC'
  ): any[] {
    const sorted = [...data];

    try {
      // Create function from string
      // eslint-disable-next-line no-new-func
      const comparator = new Function('a', 'b', comparatorFn) as (
        a: any,
        b: any
      ) => number;

      sorted.sort((a, b) => {
        const result = comparator(a[field], b[field]);
        return direction === 'DESC' ? -result : result;
      });
    } catch (error) {
      console.error('Error executing custom comparator:', error);
      // Fall back to default sorting
      return this.sortData(data, [{ field, direction }]);
    }

    return sorted;
  }

  /**
   * Multi-column sort
   */
  multiSort(
    data: any[],
    fields: SortFieldConfiguration[]
  ): any[] {
    const sortDefs: SortDefinitionEx[] = fields
      .filter((f) => f.allowSort !== false)
      .map((f) => ({
        field: f.field,
        direction: f.direction || 'ASC',
      }));

    const customComparators = new Map<string, (a: any, b: any) => number>();

    fields.forEach((field) => {
      if (field.customComparator) {
        try {
          // eslint-disable-next-line no-new-func
          const comparator = new Function('a', 'b', field.customComparator);
          customComparators.set(field.field, comparator as any);
        } catch (error) {
          console.error(
            `Error compiling custom comparator for ${field.field}:`,
            error
          );
        }
      }
    });

    return this.sortData(data, sortDefs, {
      customComparators,
      caseInsensitive: true,
      nullsFirst: false,
    });
  }

  /**
   * Group and sort
   */
  groupAndSort(
    data: any[],
    groupBy: string,
    sortBy: SortDefinitionEx[]
  ): Map<string, any[]> {
    const grouped = new Map<string, any[]>();

    // Group data
    data.forEach((row) => {
      const groupKey = String(row[groupBy] || '__undefined__');
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey)!.push(row);
    });

    // Sort each group
    grouped.forEach((rows) => {
      rows.sort((a, b) => {
        for (const sortDef of sortBy) {
          const cmp = this.defaultCompare(
            a[sortDef.field],
            b[sortDef.field],
            true
          );
          if (cmp !== 0) {
            return sortDef.direction === 'DESC' ? -cmp : cmp;
          }
        }
        return 0;
      });
    });

    // Sort groups by key
    const sortedGroups = new Map<string, any[]>(
      [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    );

    return sortedGroups;
  }

  /**
   * Quick sort with single field
   */
  quickSort(
    data: any[],
    field: string,
    direction: 'ASC' | 'DESC' = 'ASC'
  ): any[] {
    return this.sortData(data, [{ field, direction }]);
  }

  /**
   * Reverse sort direction
   */
  reverseSortDirection(direction: 'ASC' | 'DESC'): 'ASC' | 'DESC' {
    return direction === 'ASC' ? 'DESC' : 'ASC';
  }

  /**
   * Validate sort definitions
   */
  validateSortDefinitions(
    sortDefs: SortDefinitionEx[],
    availableFields: string[]
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!sortDefs || sortDefs.length === 0) {
      return { valid: true, errors: [] };
    }

    sortDefs.forEach((def, index) => {
      if (!def.field) {
        errors.push(`Sort definition ${index}: field is required`);
      } else if (!availableFields.includes(def.field)) {
        errors.push(
          `Sort definition ${index}: field "${def.field}" not found in available fields`
        );
      }

      if (!def.direction || !['ASC', 'DESC'].includes(def.direction)) {
        errors.push(
          `Sort definition ${index}: direction must be "ASC" or "DESC"`
        );
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create sort definition from UI selection
   */
  createSortDefinition(
    field: string,
    direction: 'ASC' | 'DESC'
  ): SortDefinitionEx {
    return {
      field,
      direction,
    };
  }

  /**
   * Merge sort definitions (add/update/remove)
   */
  mergeSortDefinitions(
    existing: SortDefinitionEx[],
    update: SortDefinitionEx[],
    replace: boolean = false
  ): SortDefinitionEx[] {
    if (replace) {
      return [...update];
    }

    const merged = [...existing];

    update.forEach((updateDef) => {
      const index = merged.findIndex((def) => def.field === updateDef.field);
      if (index >= 0) {
        merged[index] = updateDef;
      } else {
        merged.push(updateDef);
      }
    });

    return merged;
  }

  /**
   * Remove sort definition by field
   */
  removeSortDefinition(
    definitions: SortDefinitionEx[],
    field: string
  ): SortDefinitionEx[] {
    return definitions.filter((def) => def.field !== field);
  }

  /**
   * Clear all sort definitions
   */
  clearSortDefinitions(): SortDefinitionEx[] {
    return [];
  }

  /**
   * Get sort definition by field
   */
  getSortDefinition(
    definitions: SortDefinitionEx[],
    field: string
  ): SortDefinitionEx | undefined {
    return definitions.find((def) => def.field === field);
  }
}

export default new SortingService();
