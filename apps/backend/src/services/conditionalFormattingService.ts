/**
 * Conditional Formatting Service
 * Handles dynamic styling based on cell values
 */

export interface ConditionalFormat {
  id: string;
  name: string;
  field: string;
  condition: FormatCondition;
  format: StyleFormat;
  priority?: number;
  enabled: boolean;
}

export interface FormatCondition {
  type: 'VALUE' | 'RANGE' | 'EXPRESSION' | 'RANK' | 'PERCENTILE' | 'FORMULA';
  operator?: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'IN' | 'CONTAINS';
  value?: any;
  values?: any[];
  expression?: string;
  min?: number;
  max?: number;
}

export interface StyleFormat {
  backgroundColor?: string;
  color?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  icon?: string; // Icon name or path
  dataBar?: {
    enabled: boolean;
    color?: string;
    direction?: 'left' | 'right';
  };
  colorScale?: {
    enabled: boolean;
    minColor?: string;
    midColor?: string;
    maxColor?: string;
  };
}

export interface FormattedCell {
  value: any;
  style: StyleFormat;
  appliedRules: string[];
}

/**
 * ConditionalFormattingService - Manage conditional formatting rules
 */
class ConditionalFormattingService {
  private formats: Map<string, ConditionalFormat> = new Map();

  /**
   * Register conditional format rule
   */
  registerFormat(format: ConditionalFormat): void {
    this.formats.set(format.id, format);
  }

  /**
   * Unregister format rule
   */
  unregisterFormat(formatId: string): boolean {
    return this.formats.delete(formatId);
  }

  /**
   * Get format rule
   */
  getFormat(formatId: string): ConditionalFormat | undefined {
    return this.formats.get(formatId);
  }

  /**
   * Get all formats
   */
  getAllFormats(): ConditionalFormat[] {
    return Array.from(this.formats.values()).sort(
      (a, b) => (a.priority || 0) - (b.priority || 0)
    );
  }

  /**
   * Get formats for field
   */
  getFormatsForField(field: string): ConditionalFormat[] {
    return this.getAllFormats().filter(
      (f) => f.field === field && f.enabled
    );
  }

  /**
   * Apply formatting to cell
   */
  formatCell(
    value: any,
    field: string,
    row: any,
    allData?: any[]
  ): FormattedCell {
    const formats = this.getFormatsForField(field);
    const appliedRules: string[] = [];
    let style: StyleFormat = {};

    formats.forEach((format) => {
      if (this.matchesCondition(value, format.condition, row, allData)) {
        style = this.mergeStyles(style, format.format);
        appliedRules.push(format.id);
      }
    });

    return { value, style, appliedRules };
  }

  /**
   * Apply formatting to entire row
   */
  formatRow(
    row: any,
    fields: string[],
    allData?: any[]
  ): Record<string, FormattedCell> {
    const result: Record<string, FormattedCell> = {};

    fields.forEach((field) => {
      result[field] = this.formatCell(row[field], field, row, allData);
    });

    return result;
  }

  /**
   * Apply formatting to dataset
   */
  formatData(
    data: any[],
    fields: string[]
  ): Array<Record<string, FormattedCell>> {
    return data.map((row) => this.formatRow(row, fields, data));
  }

  /**
   * Check if value matches condition
   */
  private matchesCondition(
    value: any,
    condition: FormatCondition,
    row: any,
    allData?: any[]
  ): boolean {
    switch (condition.type) {
      case 'VALUE':
        return this.matchesValueCondition(value, condition);

      case 'RANGE':
        return this.matchesRangeCondition(value, condition);

      case 'EXPRESSION':
        return this.matchesExpressionCondition(value, row, condition);

      case 'RANK':
        return this.matchesRankCondition(value, allData, condition);

      case 'PERCENTILE':
        return this.matchesPercentileCondition(value, allData, condition);

      case 'FORMULA':
        return this.matchesFormulaCondition(value, row, condition);

      default:
        return false;
    }
  }

  /**
   * Match VALUE condition
   */
  private matchesValueCondition(value: any, condition: FormatCondition): boolean {
    if (!condition.operator || condition.value === undefined) return false;

    const val = Number(value);
    const cond = Number(condition.value);

    switch (condition.operator) {
      case '=':
        return val === cond;
      case '!=':
        return val !== cond;
      case '>':
        return val > cond;
      case '>=':
        return val >= cond;
      case '<':
        return val < cond;
      case '<=':
        return val <= cond;
      case 'IN':
        return condition.values?.includes(value) || false;
      case 'CONTAINS':
        return String(value).includes(String(condition.value));
      default:
        return false;
    }
  }

  /**
   * Match RANGE condition
   */
  private matchesRangeCondition(
    value: any,
    condition: FormatCondition
  ): boolean {
    const val = Number(value);
    const min = condition.min ?? Number.NEGATIVE_INFINITY;
    const max = condition.max ?? Number.POSITIVE_INFINITY;

    return val >= min && val <= max;
  }

  /**
   * Match EXPRESSION condition
   */
  private matchesExpressionCondition(
    value: any,
    row: any,
    condition: FormatCondition
  ): boolean {
    if (!condition.expression) return false;

    try {
      let expr = condition.expression.replace(/\{(\w+)\}/g, (_, field) => {
        return row[field] || 0;
      });

      // eslint-disable-next-line no-new-func
      return new Function('value', `return ${expr}`)(value);
    } catch (error) {
      console.error(`Error evaluating format expression: ${condition.expression}`, error);
      return false;
    }
  }

  /**
   * Match RANK condition
   */
  private matchesRankCondition(
    value: any,
    allData: any[] | undefined,
    condition: FormatCondition
  ): boolean {
    if (!allData || !condition.value) return false;

    const values = allData.map((row) => Number(row)).sort((a, b) => b - a);
    const rank = values.indexOf(Number(value)) + 1;
    const targetRank = Number(condition.value);

    return rank === targetRank;
  }

  /**
   * Match PERCENTILE condition
   */
  private matchesPercentileCondition(
    value: any,
    allData: any[] | undefined,
    condition: FormatCondition
  ): boolean {
    if (!allData || condition.min === undefined || condition.max === undefined) {
      return false;
    }

    const sorted = allData.sort((a, b) => Number(a) - Number(b));
    const percentile = (this.getPercentile(sorted, Number(value)) / 100) * sorted.length;

    return (
      percentile >= (condition.min / 100) * sorted.length &&
      percentile <= (condition.max / 100) * sorted.length
    );
  }

  /**
   * Match FORMULA condition
   */
  private matchesFormulaCondition(
    value: any,
    row: any,
    condition: FormatCondition
  ): boolean {
    if (!condition.expression) return false;

    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('value', 'row', `return ${condition.expression}`);
      return fn(value, row);
    } catch (error) {
      console.error(`Error evaluating formula condition`, error);
      return false;
    }
  }

  /**
   * Calculate percentile rank
   */
  private getPercentile(data: number[], value: number): number {
    const count = data.filter((v) => v <= value).length;
    return (count / data.length) * 100;
  }

  /**
   * Merge styles
   */
  private mergeStyles(base: StyleFormat, overlay: StyleFormat): StyleFormat {
    return {
      ...base,
      ...overlay,
      dataBar: overlay.dataBar || base.dataBar,
      colorScale: overlay.colorScale || base.colorScale,
    };
  }

  /**
   * Convert style to CSS
   */
  convertStyleToCSS(style: StyleFormat): Record<string, string> {
    const css: Record<string, string> = {};

    if (style.backgroundColor) css.backgroundColor = style.backgroundColor;
    if (style.color) css.color = style.color;
    if (style.fontWeight) css.fontWeight = style.fontWeight;
    if (style.fontStyle) css.fontStyle = style.fontStyle;
    if (style.textDecoration) css.textDecoration = style.textDecoration;
    if (style.borderColor) css.borderColor = style.borderColor;
    if (style.borderWidth) css.borderWidth = `${style.borderWidth}px solid`;
    if (style.opacity !== undefined) css.opacity = String(style.opacity);

    return css;
  }

  /**
   * Create format rule
   */
  createFormat(
    id: string,
    name: string,
    field: string,
    condition: FormatCondition,
    format: StyleFormat
  ): ConditionalFormat {
    return {
      id,
      name,
      field,
      condition,
      format,
      enabled: true,
      priority: 1,
    };
  }

  /**
   * Create color scale format
   */
  createColorScaleFormat(
    id: string,
    field: string,
    minColor: string = '#00B050',
    midColor?: string,
    maxColor: string = '#FF0000'
  ): ConditionalFormat {
    return {
      id,
      name: `Color Scale - ${field}`,
      field,
      condition: { type: 'RANGE' },
      format: {
        colorScale: {
          enabled: true,
          minColor,
          midColor,
          maxColor,
        },
      },
      enabled: true,
    };
  }

  /**
   * Create data bar format
   */
  createDataBarFormat(
    id: string,
    field: string,
    color: string = '#4472C4'
  ): ConditionalFormat {
    return {
      id,
      name: `Data Bar - ${field}`,
      field,
      condition: { type: 'RANGE' },
      format: {
        dataBar: {
          enabled: true,
          color,
          direction: 'left',
        },
      },
      enabled: true,
    };
  }

  /**
   * Validate format rule
   */
  validateFormat(format: ConditionalFormat): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!format.id) errors.push('Format ID is required');
    if (!format.field) errors.push('Field is required');
    if (!format.condition) errors.push('Condition is required');

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export formats as JSON
   */
  exportFormats(): string {
    return JSON.stringify(Array.from(this.formats.values()), null, 2);
  }

  /**
   * Import formats from JSON
   */
  importFormats(json: string): { success: boolean; error?: string } {
    try {
      const formats = JSON.parse(json) as ConditionalFormat[];
      formats.forEach((f) => this.registerFormat(f));
      return { success: true };
    } catch (error) {
      return { success: false, error: `${error}` };
    }
  }
}

export default new ConditionalFormattingService();
