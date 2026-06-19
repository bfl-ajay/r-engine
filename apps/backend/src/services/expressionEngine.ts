/**
 * Expression Engine
 * Evaluates JavaScript expressions and field references
 */

interface ExpressionContext {
  row?: Record<string, any>;     // Current data row
  parameters?: Record<string, any>; // Report parameters
  pageNumber?: number;            // Current page number
  totalPages?: number;            // Total pages
  rowNumber?: number;             // Current row number in dataset
  groupValues?: Record<string, any>; // Current group values
}

class ExpressionEngine {
  /**
   * Resolve a field reference (e.g., {fieldName} or {=expression})
   */
  resolveExpression(expression: string, context: ExpressionContext): any {
    if (!expression) {
      return '';
    }

    // Simple field reference: {fieldName}
    if (!expression.startsWith('=')) {
      const fieldName = expression.trim();
      return context.row?.[fieldName] ?? '';
    }

    // JavaScript expression: {=expression}
    return this.evaluateExpression(expression.substring(1), context);
  }

  /**
   * Evaluate a JavaScript expression with given context
   */
  evaluateExpression(expression: string, context: ExpressionContext): any {
    try {
      // Build variable assignments for the expression
      const variables = {
        ...context.row,
        ...context.parameters,
        PAGE_NUMBER: context.pageNumber,
        TOTAL_PAGES: context.totalPages,
        ROW_NUMBER: context.rowNumber,
        ...context.groupValues,
      };

      // Create function to safely evaluate expression
      const variableNames = Object.keys(variables);
      const variableValues = Object.values(variables);
      const funcBody = `return (${expression})`;

      // Create and execute function
      const func = new Function(...variableNames, funcBody);
      const result = func(...variableValues);

      return result ?? '';
    } catch (error) {
      console.error(`Expression evaluation error: ${expression}`, error);
      return `#ERROR: ${(error as Error).message}`;
    }
  }

  /**
   * Format a value based on format string
   */
  formatValue(value: any, format?: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (!format) {
      return String(value);
    }

    // Simple format string support
    // Examples: {0:C} = currency, {0:N2} = number with 2 decimals, {0:d} = date

    if (typeof value === 'number') {
      // Currency format: C or C2
      if (format.match(/^C\d?$/)) {
        const decimals = parseInt(format.charAt(1)) || 2;
        return value.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      }

      // Number format: N or N2
      if (format.match(/^N\d?$/)) {
        const decimals = parseInt(format.charAt(1)) || 2;
        return value.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      }

      // Percentage format: P or P2
      if (format.match(/^P\d?$/)) {
        const decimals = parseInt(format.charAt(1)) || 2;
        return (value * 100).toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }) + '%';
      }
    }

    if (value instanceof Date || typeof value === 'string') {
      // Date format: d, D, g, G, etc.
      const date = value instanceof Date ? value : new Date(value);
      
      switch (format.toLowerCase()) {
        case 'd': // Short date
          return date.toLocaleDateString('en-US');
        case 'D': // Long date
          return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        case 'g': // General date/time
          return date.toLocaleString('en-US');
        case 'G': // Full date/time
          return date.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        case 't': // Short time
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        case 'T': // Long time
          return date.toLocaleTimeString('en-US');
        default:
          // Custom format not supported, return as-is
          return String(value);
      }
    }

    return String(value);
  }

  /**
   * Check if a condition is true
   */
  evaluateCondition(condition: string, context: ExpressionContext): boolean {
    try {
      const result = this.evaluateExpression(condition, context);
      return Boolean(result);
    } catch (error) {
      console.error(`Condition evaluation error: ${condition}`, error);
      return false;
    }
  }

  /**
   * Validate expression syntax
   */
  validateExpression(expression: string): { valid: boolean; error?: string } {
    try {
      if (!expression || expression === '') {
        return { valid: true };
      }

      // Try to parse as function
      new Function(`return (${expression})`);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: (error as Error).message,
      };
    }
  }
}

export default new ExpressionEngine();
