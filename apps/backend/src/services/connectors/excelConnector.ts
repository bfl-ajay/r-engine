/**
 * Excel File Connector
 * Handles Excel file reading and querying
 */

import xlsx from 'xlsx';
import { DataSourceConnection, QueryResult, ColumnMetadata } from '@reporting-engine/shared';

export interface ConnectorResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ExcelWorkbookInfo {
  sheets: string[];
  sheetData: Map<string, any[]>;
}

/**
 * ExcelConnector - Reads and processes Excel files
 */
class ExcelConnector {
  private config: DataSourceConnection;
  private workbook?: xlsx.WorkBook;
  private cache: Map<string, any[]> = new Map();

  constructor(config: DataSourceConnection) {
    this.config = config;
  }

  /**
   * Load Excel file
   */
  async loadWorkbook(): Promise<ConnectorResult> {
    try {
      if (this.workbook) {
        return { success: true, data: { message: 'Workbook already loaded' } };
      }

      const filePath = this.config.filePath || this.config.fileUrl;
      if (!filePath) {
        return { success: false, error: 'No file path or URL provided' };
      }

      // In production, would handle both local files and URLs
      this.workbook = xlsx.readFile(filePath);

      return { success: true, data: { sheets: this.workbook.SheetNames } };
    } catch (error) {
      return { success: false, error: `Failed to load workbook: ${error}` };
    }
  }

  /**
   * Get sheet data
   */
  async getSheetData(sheetName?: string): Promise<ConnectorResult> {
    try {
      if (!this.workbook) {
        await this.loadWorkbook();
      }

      if (!this.workbook) {
        return { success: false, error: 'Workbook not loaded' };
      }

      const sheet = sheetName || this.workbook.SheetNames[0];
      if (!sheet) {
        return { success: false, error: 'No sheets found in workbook' };
      }

      // Check cache first
      if (this.cache.has(sheet)) {
        return { success: true, data: this.cache.get(sheet) };
      }

      const worksheet = this.workbook.Sheets[sheet];
      if (!worksheet) {
        return { success: false, error: `Sheet "${sheet}" not found` };
      }

      // Convert to JSON
      const data = xlsx.utils.sheet_to_json(worksheet, {
        header: this.config.hasHeaders !== false ? 1 : undefined,
        defval: '',
      }) as any[];

      // Cache the data
      this.cache.set(sheet, data);

      return { success: true, data };
    } catch (error) {
      return { success: false, error: `Failed to read sheet: ${error}` };
    }
  }

  /**
   * Execute query (filter/sort sheet data)
   */
  async executeQuery(
    queryText: string,
    parameters?: Record<string, any>
  ): Promise<ConnectorResult> {
    try {
      const sheetName = parameters?.sheet || this.config.database;
      const sheetResult = await this.getSheetData(sheetName);

      if (!sheetResult.success) {
        return sheetResult;
      }

      let data = (sheetResult.data || []) as any[];

      // Apply filter if specified
      if (queryText && queryText.toLowerCase().startsWith('select')) {
        // Simple SQL-like parsing
        const whereMatch = queryText.match(/where\s+(.+?)(?:$|order\s+by|limit)/i);
        if (whereMatch) {
          data = this.applyFilter(data, whereMatch[1]);
        }

        // Apply sorting
        const orderMatch = queryText.match(/order\s+by\s+(.+?)(?:$|limit)/i);
        if (orderMatch) {
          data = this.applySort(data, orderMatch[1]);
        }

        // Apply limit
        const limitMatch = queryText.match(/limit\s+(\d+)/i);
        if (limitMatch) {
          const limit = parseInt(limitMatch[1]);
          data = data.slice(0, limit);
        }
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: `Query execution failed: ${error}` };
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<ConnectorResult> {
    try {
      const result = await this.loadWorkbook();
      if (!result.success) {
        return result;
      }

      const sheetData = await this.getSheetData();
      if (!sheetData.success) {
        return sheetData;
      }

      return {
        success: true,
        data: {
          message: 'Connection successful',
          sheets: (result.data as any).sheets,
          rowCount: (sheetData.data as any[]).length,
        },
      };
    } catch (error) {
      return { success: false, error: `Connection test failed: ${error}` };
    }
  }

  /**
   * Get schema information
   */
  async getSchema(): Promise<ConnectorResult> {
    try {
      if (!this.workbook) {
        await this.loadWorkbook();
      }

      if (!this.workbook) {
        return { success: false, error: 'Workbook not loaded' };
      }

      const schema = {
        sheets: this.workbook.SheetNames.map((sheetName) => {
          const worksheet = this.workbook!.Sheets[sheetName];
          const data = xlsx.utils.sheet_to_json(worksheet, {
            defval: '',
          }) as any[];

          const columns: ColumnMetadata[] = [];
          if (data.length > 0) {
            Object.keys(data[0]).forEach((key) => {
              columns.push({
                name: key,
                type: this.inferType(data, key),
                nullable: true,
              });
            });
          }

          return {
            name: sheetName,
            columns,
            rowCount: data.length,
          };
        }),
      };

      return { success: true, data: schema };
    } catch (error) {
      return { success: false, error: `Schema retrieval failed: ${error}` };
    }
  }

  /**
   * Get sheet names
   */
  async getSheetNames(): Promise<ConnectorResult> {
    try {
      if (!this.workbook) {
        await this.loadWorkbook();
      }

      if (!this.workbook) {
        return { success: false, error: 'Workbook not loaded' };
      }

      return { success: true, data: { sheets: this.workbook.SheetNames } };
    } catch (error) {
      return { success: false, error: `Failed to get sheet names: ${error}` };
    }
  }

  /**
   * Execute parameterized query
   */
  async executeParameterizedQuery(
    queryText: string,
    params: Record<string, any>
  ): Promise<QueryResult> {
    const result = await this.executeQuery(queryText, params);

    if (!result.success) {
      return {
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: result.error || 'Query failed',
        },
      };
    }

    const rows = result.data as any[];
    const columns: ColumnMetadata[] = [];

    if (rows.length > 0) {
      Object.keys(rows[0]).forEach((key) => {
        columns.push({
          name: key,
          type: this.inferType(rows, key),
          nullable: true,
        });
      });
    }

    return {
      success: true,
      data: rows,
      columns,
      rowCount: rows.length,
    };
  }

  /**
   * Infer column type from data
   */
  private inferType(
    data: any[],
    columnName: string
  ): 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'OBJECT' {
    const values = data.map((row) => row[columnName]).filter((v) => v !== null && v !== undefined);

    if (values.length === 0) return 'STRING';

    const firstValue = values[0];

    if (typeof firstValue === 'number') return 'NUMBER';
    if (typeof firstValue === 'boolean') return 'BOOLEAN';
    if (firstValue instanceof Date) return 'DATE';

    // Check for date-like strings
    if (typeof firstValue === 'string') {
      if (/^\d{4}-\d{2}-\d{2}/.test(firstValue)) return 'DATE';
      if (/^\d+$/.test(firstValue)) {
        const sample = values.slice(0, 10);
        if (sample.every((v) => /^\d+$/.test(String(v)))) return 'NUMBER';
      }
    }

    return 'STRING';
  }

  /**
   * Apply filter to data
   */
  private applyFilter(data: any[], filterExpression: string): any[] {
    // Simple WHERE clause parsing
    // Supports: column = value, column > value, column IN (v1, v2)
    return data.filter((row) => {
      try {
        // Replace column names with values
        let condition = filterExpression;
        Object.entries(row).forEach(([key, value]) => {
          const regex = new RegExp(`\\b${key}\\b`, 'g');
          condition = condition.replace(regex, JSON.stringify(value));
        });

        // eslint-disable-next-line no-new-func
        return new Function(`return ${condition}`)();
      } catch {
        return true;
      }
    });
  }

  /**
   * Apply sort to data
   */
  private applySort(data: any[], sortExpression: string): any[] {
    const matches = sortExpression.match(/(\w+)\s+(asc|desc)?/gi);
    if (!matches) return data;

    return data.sort((a, b) => {
      for (const match of matches) {
        const [column, direction] = match.trim().split(/\s+/i);
        const aVal = a[column];
        const bVal = b[column];
        const isDesc = direction?.toLowerCase() === 'desc';

        if (aVal < bVal) return isDesc ? 1 : -1;
        if (aVal > bVal) return isDesc ? -1 : 1;
      }
      return 0;
    });
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    this.cache.clear();
    this.workbook = undefined;
  }

  /**
   * Export data to Excel
   */
  async exportToExcel(
    data: any[],
    outputPath: string,
    sheetName: string = 'Sheet1'
  ): Promise<ConnectorResult> {
    try {
      const worksheet = xlsx.utils.json_to_sheet(data);
      const newWorkbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(newWorkbook, worksheet, sheetName);
      xlsx.writeFile(newWorkbook, outputPath);

      return { success: true, data: { message: 'Export successful' } };
    } catch (error) {
      return { success: false, error: `Export failed: ${error}` };
    }
  }

  /**
   * Get row count for sheet
   */
  async getRowCount(sheetName?: string): Promise<ConnectorResult> {
    const result = await this.getSheetData(sheetName);
    if (!result.success) return result;

    return {
      success: true,
      data: { rowCount: (result.data as any[]).length },
    };
  }

  /**
   * Get column names
   */
  async getColumnNames(sheetName?: string): Promise<ConnectorResult> {
    const result = await this.getSheetData(sheetName);
    if (!result.success) return result;

    const rows = result.data as any[];
    if (rows.length === 0) {
      return { success: true, data: { columns: [] } };
    }

    return {
      success: true,
      data: { columns: Object.keys(rows[0]) },
    };
  }

  /**
   * Get sample data
   */
  async getSampleData(sheetName?: string, limit: number = 10): Promise<ConnectorResult> {
    const result = await this.getSheetData(sheetName);
    if (!result.success) return result;

    const rows = result.data as any[];
    return {
      success: true,
      data: rows.slice(0, limit),
    };
  }
}

export default ExcelConnector;
