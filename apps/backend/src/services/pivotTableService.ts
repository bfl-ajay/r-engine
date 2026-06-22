/**
 * Pivot Table Service
 * Transforms data into pivot table format
 */

export interface PivotField {
  field: string;
  type: 'ROW' | 'COLUMN' | 'VALUE';
  aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'STDDEV' | 'VARIANCE';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PivotTable {
  rowFields: string[];
  columnFields: string[];
  dataFields: Map<string, number | string>;
  rows: Array<{label: string; children?: any; values: Map<string, number | string>}>;
  columns: string[];
  data: number[][];
  totals: {rows: number[]; columns: number[]; grand: number};
}

/**
 * PivotTableService - Create pivot tables
 */
class PivotTableService {
  /**
   * Create pivot table from data
   */
  createPivotTable(
    data: Array<Record<string, any>>,
    rowFields: string[],
    columnFields: string[],
    valueField: string,
    aggregation: 'SUM' | 'COUNT' | 'AVG' = 'SUM'
  ): PivotTable {
    const pivotData: Map<string, Map<string, number[]>> = new Map();

    // Group data
    data.forEach((row) => {
      const rowKey = rowFields.map((f) => row[f]).join('|');
      const colKey = columnFields.map((f) => row[f]).join('|');
      const value = parseFloat(row[valueField]) || 0;

      if (!pivotData.has(rowKey)) {
        pivotData.set(rowKey, new Map());
      }

      const colMap = pivotData.get(rowKey)!;
      if (!colMap.has(colKey)) {
        colMap.set(colKey, []);
      }

      colMap.get(colKey)!.push(value);
    });

    // Get unique column keys
    const colKeys = new Set<string>();
    pivotData.forEach((colMap) => {
      colMap.forEach((_, colKey) => colKeys.add(colKey));
    });
    const columns = Array.from(colKeys).sort();

    // Build rows
    const rows: Array<{label: string; values: Map<string, number | string>}> = [];
    const rowTotals: number[] = [];
    const colTotals: Map<string, number> = new Map(columns.map((c) => [c, 0]));
    let grandTotal = 0;

    const rowKeys = Array.from(pivotData.keys()).sort();
    rowKeys.forEach((rowKey) => {
      const colMap = pivotData.get(rowKey)!;
      const values = new Map<string, number | string>();
      let rowTotal = 0;

      columns.forEach((col) => {
        const cellData = colMap.get(col) || [];
        const cellValue = this.aggregateValues(cellData, aggregation);
        values.set(col, cellValue);
        rowTotal += cellValue;
        colTotals.set(col, (colTotals.get(col) || 0) + cellValue);
      });

      grandTotal += rowTotal;
      rowTotals.push(rowTotal);

      rows.push({
        label: rowKey,
        values,
      });
    });

    // Build data matrix
    const dataMatrix: number[][] = [];
    rows.forEach((row) => {
      const rowData: number[] = [];
      columns.forEach((col) => {
        rowData.push((row.values.get(col) as number) || 0);
      });
      dataMatrix.push(rowData);
    });

    return {
      rowFields,
      columnFields,
      dataFields: new Map(),
      rows,
      columns,
      data: dataMatrix,
      totals: {
        rows: rowTotals,
        columns: columns.map((c) => colTotals.get(c) || 0),
        grand: grandTotal,
      },
    };
  }

  /**
   * Aggregate values
   */
  private aggregateValues(values: number[], aggregation: string): number {
    if (values.length === 0) return 0;

    switch (aggregation) {
      case 'SUM':
        return values.reduce((a, b) => a + b, 0);
      case 'COUNT':
        return values.length;
      case 'AVG':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'MIN':
        return Math.min(...values);
      case 'MAX':
        return Math.max(...values);
      default:
        return values.reduce((a, b) => a + b, 0);
    }
  }

  /**
   * Add calculated field to pivot table
   */
  addCalculatedField(
    pivot: PivotTable,
    fieldName: string,
    expression: (row: Map<string, number | string>) => number
  ): PivotTable {
    const updated = {...pivot};

    updated.rows = updated.rows.map((row) => ({
      ...row,
      values: new Map([...row.values, [fieldName, expression(row.values)]]),
    }));

    return updated;
  }

  /**
   * Filter pivot table
   */
  filterPivotTable(pivot: PivotTable, filterFn: (row: any) => boolean): PivotTable {
    return {
      ...pivot,
      rows: pivot.rows.filter(filterFn),
    };
  }

  /**
   * Export pivot table to array
   */
  exportToArray(pivot: PivotTable): any[] {
    const result: any[] = [];

    // Header row
    const header = ['', ...pivot.columns];
    result.push(header);

    // Data rows
    pivot.rows.forEach((row, index) => {
      const rowData: (string | number)[] = [row.label];
      pivot.columns.forEach((col) => {
        rowData.push((row.values.get(col) ?? 0) as string | number);
      });
      rowData.push((pivot.totals.rows[index] ?? 0) as string | number); // Row total
      result.push(rowData);
    });

    // Totals row
    const totalsRow = ['TOTAL', ...pivot.totals.columns, pivot.totals.grand];
    result.push(totalsRow);

    return result;
  }

  /**
   * Export pivot table to CSV
   */
  exportToCSV(pivot: PivotTable): string {
    const lines: string[] = [];

    // Header
    const header = ['', ...pivot.columns, 'TOTAL'];
    lines.push(header.join(','));

    // Data
    pivot.rows.forEach((row, index) => {
      const rowData = [this.escapeCSV(row.label)];
      pivot.columns.forEach((col) => {
        rowData.push((row.values.get(col) || 0).toString());
      });
      rowData.push(pivot.totals.rows[index].toString());
      lines.push(rowData.join(','));
    });

    // Totals
    const totalsRow = ['TOTAL', ...pivot.totals.columns.map((t) => t.toString()), pivot.totals.grand.toString()];
    lines.push(totalsRow.join(','));

    return lines.join('\n');
  }

  /**
   * Export pivot table to HTML
   */
  exportToHTML(pivot: PivotTable): string {
    let html = '<table border="1" cellpadding="5">\n';

    // Header
    html += '  <thead>\n    <tr>\n';
    html += '      <th></th>\n';
    pivot.columns.forEach((col) => {
      html += `      <th>${this.escapeHTML(col)}</th>\n`;
    });
    html += '      <th>Total</th>\n    </tr>\n  </thead>\n';

    // Body
    html += '  <tbody>\n';
    pivot.rows.forEach((row, index) => {
      html += '    <tr>\n';
      html += `      <td><strong>${this.escapeHTML(row.label)}</strong></td>\n`;
      pivot.columns.forEach((col) => {
        html += `      <td>${row.values.get(col) || 0}</td>\n`;
      });
      html += `      <td><strong>${pivot.totals.rows[index]}</strong></td>\n`;
      html += '    </tr>\n';
    });

    // Totals row
    html += '    <tr style="background-color: #f0f0f0;">\n';
    html += '      <td><strong>TOTAL</strong></td>\n';
    pivot.totals.columns.forEach((total) => {
      html += `      <td><strong>${total}</strong></td>\n`;
    });
    html += `      <td><strong>${pivot.totals.grand}</strong></td>\n`;
    html += '    </tr>\n';

    html += '  </tbody>\n</table>';

    return html;
  }

  /**
   * Escape CSV special characters
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHTML(value: string | number): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Get pivot table statistics
   */
  getStatistics(pivot: PivotTable): {
    rowCount: number;
    columnCount: number;
    dataCount: number;
    grandTotal: number;
    average: number;
  } {
    const dataCount = pivot.data.flat().length;
    const average = dataCount > 0 ? pivot.totals.grand / dataCount : 0;

    return {
      rowCount: pivot.rows.length,
      columnCount: pivot.columns.length,
      dataCount,
      grandTotal: pivot.totals.grand,
      average,
    };
  }

  /**
   * Drill-down from pivot
   */
  drillDown(
    sourceData: Array<Record<string, any>>,
    rowValue: string,
    columnValue: string,
    rowFields: string[],
    columnFields: string[]
  ): Array<Record<string, any>> {
    return sourceData.filter((row) => {
      const rowKey = rowFields.map((f) => row[f]).join('|');
      const colKey = columnFields.map((f) => row[f]).join('|');
      return rowKey === rowValue && colKey === columnValue;
    });
  }
}

export default new PivotTableService();
