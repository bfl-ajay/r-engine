/**
 * Custom Functions Service
 * Manages user-defined and built-in functions for expressions
 */

import { CustomFunction, FunctionParameter } from '@reporting-engine/shared';

export interface FunctionRegistry {
  functions: Map<string, CustomFunction>;
  categories: Map<string, CustomFunction[]>;
}

export interface FunctionCallResult {
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * CustomFunctionsService - Manages custom and built-in functions
 */
class CustomFunctionsService {
  private registry: FunctionRegistry = {
    functions: new Map(),
    categories: new Map(),
  };

  constructor() {
    this.registerBuiltInFunctions();
  }

  /**
   * Register built-in functions
   */
  private registerBuiltInFunctions(): void {
    // Math functions
    this.registerFunction({
      id: 'abs',
      name: 'ABS',
      description: 'Returns absolute value',
      parameters: [{ name: 'value', dataType: 'NUMBER', required: true }],
      returnType: 'NUMBER',
      body: 'return Math.abs(value);',
      isBuiltIn: true,
      category: 'MATH',
      example: 'ABS(-5) = 5',
    });

    this.registerFunction({
      id: 'round',
      name: 'ROUND',
      description: 'Rounds to specified decimal places',
      parameters: [
        { name: 'value', dataType: 'NUMBER', required: true },
        { name: 'decimals', dataType: 'NUMBER', required: false, defaultValue: 0 },
      ],
      returnType: 'NUMBER',
      body:
        'return decimals !== undefined ? Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals) : Math.round(value);',
      isBuiltIn: true,
      category: 'MATH',
      example: 'ROUND(3.14159, 2) = 3.14',
    });

    this.registerFunction({
      id: 'floor',
      name: 'FLOOR',
      description: 'Rounds down to nearest integer',
      parameters: [{ name: 'value', dataType: 'NUMBER', required: true }],
      returnType: 'NUMBER',
      body: 'return Math.floor(value);',
      isBuiltIn: true,
      category: 'MATH',
      example: 'FLOOR(3.9) = 3',
    });

    this.registerFunction({
      id: 'ceil',
      name: 'CEIL',
      description: 'Rounds up to nearest integer',
      parameters: [{ name: 'value', dataType: 'NUMBER', required: true }],
      returnType: 'NUMBER',
      body: 'return Math.ceil(value);',
      isBuiltIn: true,
      category: 'MATH',
      example: 'CEIL(3.1) = 4',
    });

    // String functions
    this.registerFunction({
      id: 'upper',
      name: 'UPPER',
      description: 'Converts string to uppercase',
      parameters: [{ name: 'text', dataType: 'STRING', required: true }],
      returnType: 'STRING',
      body: 'return String(text).toUpperCase();',
      isBuiltIn: true,
      category: 'STRING',
      example: 'UPPER("hello") = "HELLO"',
    });

    this.registerFunction({
      id: 'lower',
      name: 'LOWER',
      description: 'Converts string to lowercase',
      parameters: [{ name: 'text', dataType: 'STRING', required: true }],
      returnType: 'STRING',
      body: 'return String(text).toLowerCase();',
      isBuiltIn: true,
      category: 'STRING',
      example: 'LOWER("HELLO") = "hello"',
    });

    this.registerFunction({
      id: 'trim',
      name: 'TRIM',
      description: 'Removes leading and trailing whitespace',
      parameters: [{ name: 'text', dataType: 'STRING', required: true }],
      returnType: 'STRING',
      body: 'return String(text).trim();',
      isBuiltIn: true,
      category: 'STRING',
      example: 'TRIM("  hello  ") = "hello"',
    });

    this.registerFunction({
      id: 'substring',
      name: 'SUBSTRING',
      description: 'Extracts substring',
      parameters: [
        { name: 'text', dataType: 'STRING', required: true },
        { name: 'start', dataType: 'NUMBER', required: true },
        { name: 'length', dataType: 'NUMBER', required: false },
      ],
      returnType: 'STRING',
      body: 'return length ? String(text).substr(start, length) : String(text).substr(start);',
      isBuiltIn: true,
      category: 'STRING',
      example: 'SUBSTRING("hello", 0, 3) = "hel"',
    });

    this.registerFunction({
      id: 'length',
      name: 'LENGTH',
      description: 'Returns string length',
      parameters: [{ name: 'text', dataType: 'STRING', required: true }],
      returnType: 'NUMBER',
      body: 'return String(text).length;',
      isBuiltIn: true,
      category: 'STRING',
      example: 'LENGTH("hello") = 5',
    });

    this.registerFunction({
      id: 'replace',
      name: 'REPLACE',
      description: 'Replaces text occurrences',
      parameters: [
        { name: 'text', dataType: 'STRING', required: true },
        { name: 'find', dataType: 'STRING', required: true },
        { name: 'replace', dataType: 'STRING', required: true },
      ],
      returnType: 'STRING',
      body: 'return String(text).replace(new RegExp(find, "g"), replace);',
      isBuiltIn: true,
      category: 'STRING',
      example: 'REPLACE("hello world", "world", "there") = "hello there"',
    });

    // Date functions
    this.registerFunction({
      id: 'today',
      name: 'TODAY',
      description: 'Returns current date',
      parameters: [],
      returnType: 'DATE',
      body: 'return new Date().toISOString().split("T")[0];',
      isBuiltIn: true,
      category: 'DATE',
      example: 'TODAY() = "2026-06-19"',
    });

    this.registerFunction({
      id: 'now',
      name: 'NOW',
      description: 'Returns current date and time',
      parameters: [],
      returnType: 'DATE',
      body: 'return new Date();',
      isBuiltIn: true,
      category: 'DATE',
      example: 'NOW() = current timestamp',
    });

    this.registerFunction({
      id: 'year',
      name: 'YEAR',
      description: 'Extracts year from date',
      parameters: [{ name: 'date', dataType: 'DATE', required: true }],
      returnType: 'NUMBER',
      body: 'return new Date(date).getFullYear();',
      isBuiltIn: true,
      category: 'DATE',
      example: 'YEAR("2026-06-19") = 2026',
    });

    this.registerFunction({
      id: 'month',
      name: 'MONTH',
      description: 'Extracts month from date',
      parameters: [{ name: 'date', dataType: 'DATE', required: true }],
      returnType: 'NUMBER',
      body: 'return new Date(date).getMonth() + 1;',
      isBuiltIn: true,
      category: 'DATE',
      example: 'MONTH("2026-06-19") = 6',
    });

    this.registerFunction({
      id: 'day',
      name: 'DAY',
      description: 'Extracts day from date',
      parameters: [{ name: 'date', dataType: 'DATE', required: true }],
      returnType: 'NUMBER',
      body: 'return new Date(date).getDate();',
      isBuiltIn: true,
      category: 'DATE',
      example: 'DAY("2026-06-19") = 19',
    });

    // Logic functions
    this.registerFunction({
      id: 'if',
      name: 'IF',
      description: 'Conditional function',
      parameters: [
        { name: 'condition', dataType: 'BOOLEAN', required: true },
        { name: 'trueValue', dataType: 'STRING', required: true },
        { name: 'falseValue', dataType: 'STRING', required: true },
      ],
      returnType: 'STRING',
      body: 'return condition ? trueValue : falseValue;',
      isBuiltIn: true,
      category: 'LOGIC',
      example: 'IF(score >= 70, "Pass", "Fail")',
    });

    this.registerFunction({
      id: 'coalesce',
      name: 'COALESCE',
      description: 'Returns first non-null value',
      parameters: [{ name: 'values', dataType: 'ARRAY', required: true }],
      returnType: 'STRING',
      body:
        'return values.find(v => v !== null && v !== undefined) || null;',
      isBuiltIn: true,
      category: 'LOGIC',
      example: 'COALESCE(null, null, "value") = "value"',
    });

    this.registerFunction({
      id: 'isnull',
      name: 'ISNULL',
      description: 'Checks if value is null',
      parameters: [{ name: 'value', dataType: 'STRING', required: true }],
      returnType: 'BOOLEAN',
      body: 'return value === null || value === undefined;',
      isBuiltIn: true,
      category: 'LOGIC',
      example: 'ISNULL(null) = true',
    });
  }

  /**
   * Register a custom function
   */
  registerFunction(func: CustomFunction): void {
    this.registry.functions.set(func.id, func);

    // Add to category
    const category = func.category || 'CUSTOM';
    if (!this.registry.categories.has(category)) {
      this.registry.categories.set(category, []);
    }
    this.registry.categories.get(category)!.push(func);
  }

  /**
   * Unregister a function
   */
  unregisterFunction(functionId: string): boolean {
    const func = this.registry.functions.get(functionId);
    if (!func) return false;

    this.registry.functions.delete(functionId);

    // Remove from category
    const category = func.category || 'CUSTOM';
    const categoryFuncs = this.registry.categories.get(category);
    if (categoryFuncs) {
      const index = categoryFuncs.findIndex((f) => f.id === functionId);
      if (index >= 0) {
        categoryFuncs.splice(index, 1);
      }
    }

    return true;
  }

  /**
   * Get function by ID
   */
  getFunction(functionId: string): CustomFunction | undefined {
    return this.registry.functions.get(functionId);
  }

  /**
   * Get all functions
   */
  getAllFunctions(): CustomFunction[] {
    return Array.from(this.registry.functions.values());
  }

  /**
   * Get functions by category
   */
  getFunctionsByCategory(category: string): CustomFunction[] {
    return this.registry.categories.get(category) || [];
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.registry.categories.keys());
  }

  /**
   * Call a function
   */
  callFunction(
    functionId: string,
    args: Record<string, any>
  ): FunctionCallResult {
    const func = this.getFunction(functionId);
    if (!func) {
      return { success: false, error: `Function "${functionId}" not found` };
    }

    try {
      // Validate arguments
      const validation = this.validateFunctionCall(func, args);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Execute function
      // eslint-disable-next-line no-new-func
      const fn = new Function(...Object.keys(args), func.body);
      const result = fn(...Object.values(args));

      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: `Error executing function: ${error}`,
      };
    }
  }

  /**
   * Validate function call
   */
  private validateFunctionCall(
    func: CustomFunction,
    args: Record<string, any>
  ): { valid: boolean; error?: string } {
    // Check required parameters
    const requiredParams = func.parameters.filter((p) => p.required !== false);
    const missingParams = requiredParams.filter((p) => args[p.name] === undefined);

    if (missingParams.length > 0) {
      return {
        valid: false,
        error: `Missing required parameters: ${missingParams.map((p) => p.name).join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * Get function signature
   */
  getFunctionSignature(func: CustomFunction): string {
    const params = func.parameters
      .map((p) => `${p.name}: ${p.dataType}${p.required ? '' : '?'}`)
      .join(', ');
    return `${func.name}(${params}): ${func.returnType}`;
  }

  /**
   * Create function from template
   */
  createFunctionFromTemplate(
    name: string,
    parameters: FunctionParameter[],
    returnType: string,
    body: string
  ): CustomFunction {
    return {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      parameters,
      returnType: returnType as any,
      body,
      category: 'CUSTOM',
    };
  }

  /**
   * Validate function body
   */
  validateFunctionBody(body: string): { valid: boolean; error?: string } {
    try {
      // eslint-disable-next-line no-new-func
      new Function(body);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: `${error}` };
    }
  }

  /**
   * Export function
   */
  exportFunction(functionId: string): string | null {
    const func = this.getFunction(functionId);
    if (!func) return null;
    return JSON.stringify(func, null, 2);
  }

  /**
   * Import function
   */
  importFunction(json: string): { success: boolean; error?: string } {
    try {
      const func = JSON.parse(json) as CustomFunction;

      // Validate required fields
      if (!func.id || !func.name || !func.returnType || !func.body) {
        return { success: false, error: 'Missing required function fields' };
      }

      // Validate body
      const validation = this.validateFunctionBody(func.body);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      this.registerFunction(func);
      return { success: true };
    } catch (error) {
      return { success: false, error: `${error}` };
    }
  }

  /**
   * List built-in functions
   */
  getBuiltInFunctions(): CustomFunction[] {
    return this.getAllFunctions().filter((f) => f.isBuiltIn);
  }

  /**
   * List custom functions
   */
  getCustomFunctions(): CustomFunction[] {
    return this.getAllFunctions().filter((f) => !f.isBuiltIn);
  }

  /**
   * Search functions
   */
  searchFunctions(query: string): CustomFunction[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllFunctions().filter(
      (f) =>
        f.name.toLowerCase().includes(lowerQuery) ||
        f.description?.toLowerCase().includes(lowerQuery)
    );
  }
}

export default new CustomFunctionsService();
