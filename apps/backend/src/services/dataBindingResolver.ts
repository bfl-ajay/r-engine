/**
 * Data Binding Resolver
 * Resolves field references and data bindings in report objects
 */

import expressionEngine from './expressionEngine';
import type { ReportObject, ReportDefinition } from '@reporting-engine/shared';

interface DataBindingContext {
  rowData: Record<string, any>;
  parameters: Record<string, any>;
  pageNumber: number;
  totalPages: number;
  rowNumber: number;
  groupValues: Record<string, any>;
}

class DataBindingResolver {
  /**
   * Resolve all data bindings in a report object
   */
  resolveObjectBindings(
    object: ReportObject,
    context: DataBindingContext
  ): Record<string, any> {
    const resolved: Record<string, any> = {
      id: object.id,
      type: object.type,
      name: object.name,
      position: object.position,
      size: object.size,
      visible: object.visible,
      style: object.style,
    };

    // Handle different object types
    switch (object.type) {
      case 'TEXT':
        resolved.text = object.text || '';
        break;

      case 'FIELD':
        resolved.fieldName = object.fieldName || '';
        resolved.value = this.resolveFieldBinding(object.fieldName, context);
        resolved.formattedValue = expressionEngine.formatValue(
          resolved.value,
          object.format
        );
        break;

      case 'EXPRESSION':
        resolved.expression = object.expression || '';
        resolved.value = expressionEngine.resolveExpression(
          object.expression || '',
          {
            row: context.rowData,
            parameters: context.parameters,
            pageNumber: context.pageNumber,
            totalPages: context.totalPages,
            rowNumber: context.rowNumber,
            groupValues: context.groupValues,
          }
        );
        resolved.formattedValue = expressionEngine.formatValue(
          resolved.value,
          object.format
        );
        break;

      case 'IMAGE':
        resolved.imageSource = object.imageSource || '';
        // If image source contains expression, resolve it
        if (object.imageSource?.includes('{')) {
          resolved.imageSource = expressionEngine.resolveExpression(
            object.imageSource,
            {
              row: context.rowData,
              parameters: context.parameters,
            }
          );
        }
        break;

      case 'PAGE_NUMBER':
        resolved.value = context.pageNumber;
        break;

      case 'TOTAL_PAGES':
        resolved.value = context.totalPages;
        break;

      case 'DATE_TIME':
        resolved.value = new Date().toISOString();
        resolved.formattedValue = expressionEngine.formatValue(
          resolved.value,
          object.format || 'G'
        );
        break;

      case 'TABLE':
        // Table bindings resolved separately during table rendering
        resolved.dataSource = object.dataSource || '';
        resolved.columns = object.columns || [];
        break;

      case 'MATRIX':
        resolved.rowFields = object.rowFields || [];
        resolved.columnFields = object.columnFields || [];
        resolved.dataFields = object.dataFields || [];
        break;

      case 'CHART':
        resolved.chartType = object.chartType || '';
        resolved.chartData = object.chartData || {};
        break;

      default:
        // Other object types passed as-is
        resolved.text = object.text || '';
    }

    return resolved;
  }

  /**
   * Resolve a field binding (field reference)
   */
  private resolveFieldBinding(fieldName: string | undefined, context: DataBindingContext): any {
    if (!fieldName) {
      return '';
    }

    // Check row data first
    if (context.rowData && fieldName in context.rowData) {
      return context.rowData[fieldName];
    }

    // Check parameters
    if (context.parameters && fieldName in context.parameters) {
      return context.parameters[fieldName];
    }

    // Check group values
    if (context.groupValues && fieldName in context.groupValues) {
      return context.groupValues[fieldName];
    }

    // Field not found
    console.warn(`Field not found in context: ${fieldName}`);
    return `#REF: ${fieldName}`;
  }

  /**
   * Resolve data bindings for multiple rows
   */
  resolveRowData(
    objects: ReportObject[],
    rowData: Record<string, any>,
    context: Omit<DataBindingContext, 'rowData'>
  ): Record<string, any>[] {
    return objects.map((obj) =>
      this.resolveObjectBindings(obj, {
        ...context,
        rowData,
      })
    );
  }

  /**
   * Check if an object is visible based on visibility expression
   */
  isObjectVisible(object: ReportObject, context: DataBindingContext): boolean {
    // If no expression, use visible property
    if (!object.style?.opacity) {
      return object.visible !== false;
    }

    // TODO: Add visibility expression support if needed

    return object.visible !== false;
  }

  /**
   * Get all fields referenced in a report
   */
  extractReferencedFields(report: ReportDefinition): string[] {
    const fields = new Set<string>();

    // Extract from all bands and objects
    for (const band of report.bands) {
      for (const object of band.children) {
        if (object.type === 'FIELD' && object.fieldName) {
          fields.add(object.fieldName);
        } else if (object.type === 'EXPRESSION' && object.expression) {
          // Extract field references from expression
          const matches = object.expression.match(/\{([^}]+)\}/g);
          if (matches) {
            for (const match of matches) {
              const fieldName = match.slice(1, -1);
              if (!fieldName.startsWith('=')) {
                fields.add(fieldName);
              }
            }
          }
        }
      }
    }

    return Array.from(fields);
  }

  /**
   * Validate that all required fields are available in data
   */
  validateFieldAvailability(
    fieldNames: string[],
    data: Record<string, any>
  ): { valid: boolean; missingFields: string[] } {
    const missingFields = fieldNames.filter((field) => !(field in data));
    return {
      valid: missingFields.length === 0,
      missingFields,
    };
  }
}

export default new DataBindingResolver();
