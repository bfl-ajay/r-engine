/**
 * Grouping Service
 * Handles data grouping, subtotals, and aggregate calculations
 */

import {
  GroupingConfiguration,
  GroupField,
  SubtotalDefinition,
  QueryResult,
  ColumnMetadata,
} from '@reporting-engine/shared';

export interface GroupedData {
  groups: Group[];
  subtotals: Map<string, any>;
  hierarchy: GroupHierarchy;
}

export interface Group {
  key: string;
  value: any;
  field: string;
  rows: any[];
  subtotals: Map<string, number>;
  isExpanded?: boolean;
  childGroups?: Group[];
  parentKey?: string;
  level: number;
}

export interface GroupHierarchy {
  levels: number;
  groupFields: GroupField[];
  maxDepth: number;
}

export interface AggregateResult {
  field: string;
  function: string;
  value: number;
  count: number;
}

/**
 * GroupingService - Handles data grouping and aggregation
 */
class GroupingService {
  /**
   * Group data by specified fields
   * @param data Array of data rows
   * @param grouping Grouping configuration
   * @returns Grouped data structure
   */
  groupData(data: any[], grouping: GroupingConfiguration): GroupedData {
    if (!grouping.enabled || !grouping.groupingFields || grouping.groupingFields.length === 0) {
      return {
        groups: [],
        subtotals: new Map(),
        hierarchy: {
          levels: 0,
          groupFields: [],
          maxDepth: 0,
        },
      };
    }

    const groupFields = grouping.groupingFields;
    const groups: Group[] = [];
    const groupedMap = this.createGroupHierarchy(data, groupFields);

    // Convert map to group array
    groupedMap.forEach((group) => {
      groups.push(group);
    });

    // Calculate subtotals for each group
    if (grouping.subtotals && grouping.subtotals.length > 0) {
      this.calculateSubtotals(groups, grouping.subtotals, groupFields.length);
    }

    return {
      groups,
      subtotals: new Map(),
      hierarchy: {
        levels: groupFields.length,
        groupFields,
        maxDepth: this.getMaxGroupDepth(groups),
      },
    };
  }

  /**
   * Create hierarchical grouping structure
   * @param data Array of rows
   * @param groupFields Fields to group by
   * @returns Map of grouped data
   */
  private createGroupHierarchy(
    data: any[],
    groupFields: GroupField[]
  ): Map<string, Group> {
    const groups = new Map<string, Group>();

    data.forEach((row) => {
      let currentLevel = groups;
      let currentKey = '';

      groupFields.forEach((groupField, index) => {
        const fieldValue = row[groupField.field];
        const groupKey = this.createGroupKey(fieldValue, index);
        currentKey += (currentKey ? '|' : '') + groupKey;

        if (!currentLevel.has(groupKey)) {
          const newGroup: Group = {
            key: currentKey,
            value: fieldValue,
            field: groupField.field,
            rows: [],
            subtotals: new Map(),
            isExpanded: true,
            childGroups: [],
            level: index,
          };

          currentLevel.set(groupKey, newGroup);

          // Add to parent's child groups if not root level
          if (index > 0) {
            const parentGroups = this.getParentGroup(groups, currentKey);
            if (parentGroups) {
              parentGroups.childGroups = parentGroups.childGroups || [];
              parentGroups.childGroups.push(newGroup);
            }
          }
        }

        const group = currentLevel.get(groupKey)!;
        if (index === groupFields.length - 1) {
          // Leaf group - add row
          group.rows.push(row);
        }

        currentLevel = new Map([[groupKey, group]]);
      });
    });

    return groups;
  }

  /**
   * Get parent group from hierarchical structure
   */
  private getParentGroup(groups: Map<string, Group>, key: string): Group | null {
    const parts = key.split('|');
    if (parts.length < 2) return null;

    const parentKey = parts.slice(0, -1).join('|');
    // This is simplified - full implementation would traverse hierarchy
    return groups.get(parts[0]) || null;
  }

  /**
   * Create normalized group key
   */
  private createGroupKey(value: any, level: number): string {
    if (value === null || value === undefined) {
      return '__null__';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Calculate subtotals for grouped data
   */
  private calculateSubtotals(
    groups: Group[],
    subtotals: SubtotalDefinition[],
    groupLevels: number
  ): void {
    groups.forEach((group) => {
      subtotals.forEach((subtotal) => {
        // Check if this subtotal should be applied to this group level
        const groupLevel = subtotal.groupLevel || groupLevels - 1;

        if (groupLevel === group.level) {
          const result = this.calculateAggregate(
            group.rows,
            subtotal.field,
            subtotal.function
          );
          group.subtotals.set(subtotal.id, result);
        }
      });

      // Recursively calculate for child groups
      if (group.childGroups && group.childGroups.length > 0) {
        this.calculateSubtotals(group.childGroups, subtotals, groupLevels);
      }
    });
  }

  /**
   * Calculate aggregate value for a field
   */
  private calculateAggregate(rows: any[], field: string, func: string): number {
    if (!rows || rows.length === 0) return 0;

    const values = rows
      .map((row) => row[field])
      .filter((v) => v !== null && v !== undefined)
      .map((v) => (typeof v === 'string' ? parseFloat(v) : Number(v)))
      .filter((v) => !isNaN(v));

    if (values.length === 0) return 0;

    switch (func.toUpperCase()) {
      case 'SUM':
        return values.reduce((a, b) => a + b, 0);

      case 'COUNT':
        return rows.length;

      case 'AVERAGE':
      case 'AVG':
        return values.reduce((a, b) => a + b, 0) / values.length;

      case 'MIN':
        return Math.min(...values);

      case 'MAX':
        return Math.max(...values);

      case 'STDDEV':
        return this.calculateStandardDeviation(values);

      case 'VARIANCE':
        return this.calculateVariance(values);

      default:
        return 0;
    }
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    const variance = this.calculateVariance(values);
    return Math.sqrt(variance);
  }

  /**
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
  }

  /**
   * Get maximum group depth
   */
  private getMaxGroupDepth(groups: Group[]): number {
    let maxDepth = 0;

    const traverse = (group: Group, depth: number) => {
      maxDepth = Math.max(maxDepth, depth);
      if (group.childGroups && group.childGroups.length > 0) {
        group.childGroups.forEach((child) => traverse(child, depth + 1));
      }
    };

    groups.forEach((group) => traverse(group, 1));
    return maxDepth;
  }

  /**
   * Get subtotal for a specific group
   */
  getSubtotal(group: Group, subtotalId: string): number {
    return group.subtotals.get(subtotalId) || 0;
  }

  /**
   * Get all subtotals for a group
   */
  getAllSubtotals(group: Group): Map<string, number> {
    return new Map(group.subtotals);
  }

  /**
   * Expand/collapse group
   */
  toggleGroup(group: Group): void {
    group.isExpanded = !group.isExpanded;
  }

  /**
   * Expand all groups
   */
  expandAll(groups: Group[]): void {
    groups.forEach((group) => {
      group.isExpanded = true;
      if (group.childGroups) {
        this.expandAll(group.childGroups);
      }
    });
  }

  /**
   * Collapse all groups
   */
  collapseAll(groups: Group[]): void {
    groups.forEach((group) => {
      group.isExpanded = false;
      if (group.childGroups) {
        this.collapseAll(group.childGroups);
      }
    });
  }

  /**
   * Get flattened list of visible rows based on expand/collapse state
   */
  getVisibleRows(groups: Group[]): any[] {
    const rows: any[] = [];

    const traverse = (group: Group) => {
      if (group.isExpanded || group.level === 0) {
        rows.push(...group.rows);
        if (group.childGroups && group.isExpanded) {
          group.childGroups.forEach(traverse);
        }
      }
    };

    groups.forEach(traverse);
    return rows;
  }

  /**
   * Get group summary statistics
   */
  getGroupSummary(group: Group): {
    groupValue: any;
    rowCount: number;
    subtotals: Record<string, number>;
  } {
    const subtotals: Record<string, number> = {};
    group.subtotals.forEach((value, key) => {
      subtotals[key] = value;
    });

    return {
      groupValue: group.value,
      rowCount: group.rows.length,
      subtotals,
    };
  }

  /**
   * Format group label
   */
  formatGroupLabel(group: Group, groupField: GroupField): string {
    const value = group.value;

    if (value === null || value === undefined) {
      return '(Empty)';
    }

    // Handle different value types
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'object') {
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Apply sorting to groups
   */
  sortGroups(groups: Group[]): void {
    groups.sort((a, b) => {
      if (a.value === b.value) return 0;
      if (a.value === null) return 1;
      if (b.value === null) return -1;
      return a.value < b.value ? -1 : 1;
    });

    groups.forEach((group) => {
      if (group.childGroups) {
        this.sortGroups(group.childGroups);
      }
    });
  }
}

export default new GroupingService();
