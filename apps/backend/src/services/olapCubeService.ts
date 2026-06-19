/**
 * OLAP Cube Service
 * Multi-dimensional data analysis and aggregation
 */

export interface Dimension {
  name: string;
  hierarchy: string[];
  members: Map<string, any>;
}

export interface Measure {
  name: string;
  dataType: 'NUMBER' | 'CURRENCY' | 'PERCENTAGE';
  aggregationType: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'DISTINCT_COUNT';
}

export interface Cube {
  name: string;
  dimensions: Map<string, Dimension>;
  measures: Map<string, Measure>;
  data: Map<string, number>;
  size: number;
}

export interface SliceQuery {
  dimensions: Record<string, string[]>;
  measures: string[];
  where?: Record<string, any>;
}

export interface DiceQuery {
  dimension: string;
  members: string[];
  measures: string[];
}

/**
 * OLAPCubeService - Multi-dimensional analysis
 */
class OLAPCubeService {
  private cubes: Map<string, Cube> = new Map();

  /**
   * Create OLAP cube from data
   */
  createCube(
    name: string,
    data: Array<Record<string, any>>,
    dimensions: string[],
    measures: Array<{name: string; field: string; aggregation: string}>
  ): Cube {
    const cube: Cube = {
      name,
      dimensions: new Map(),
      measures: new Map(),
      data: new Map(),
      size: 0,
    };

    // Build dimensions
    dimensions.forEach((dim) => {
      const values = new Set<string>();
      data.forEach((row) => {
        values.add(String(row[dim]));
      });

      cube.dimensions.set(dim, {
        name: dim,
        hierarchy: Array.from(values).sort(),
        members: new Map(Array.from(values).map((v) => [v, {value: v}])),
      });
    });

    // Register measures
    measures.forEach(({name, aggregation}) => {
      cube.measures.set(name, {
        name,
        dataType: 'NUMBER',
        aggregationType: aggregation as any,
      });
    });

    // Populate cube data
    this.populateCube(cube, data, dimensions, measures);
    this.cubes.set(name, cube);

    return cube;
  }

  /**
   * Populate cube with aggregated data
   */
  private populateCube(
    cube: Cube,
    data: Array<Record<string, any>>,
    dimensions: string[],
    measures: Array<{name: string; field: string; aggregation: string}>
  ): void {
    const aggregatedData = new Map<string, Array<Record<string, any>>>();

    // Group by dimension combinations
    data.forEach((row) => {
      const key = dimensions.map((d) => row[d]).join('|');
      if (!aggregatedData.has(key)) {
        aggregatedData.set(key, []);
      }
      aggregatedData.get(key)!.push(row);
    });

    // Calculate aggregated measures
    aggregatedData.forEach((rows, key) => {
      measures.forEach(({name, field, aggregation}) => {
        const values = rows.map((r) => parseFloat(r[field]) || 0);
        const aggregated = this.aggregate(values, aggregation);
        const dataKey = `${key}|${name}`;
        cube.data.set(dataKey, aggregated);
      });
    });

    cube.size = cube.data.size;
  }

  /**
   * Aggregate values
   */
  private aggregate(values: number[], aggregation: string): number {
    switch (aggregation) {
      case 'SUM':
        return values.reduce((a, b) => a + b, 0);
      case 'COUNT':
        return values.length;
      case 'AVG':
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      case 'MIN':
        return Math.min(...values);
      case 'MAX':
        return Math.max(...values);
      case 'DISTINCT_COUNT':
        return new Set(values).size;
      default:
        return 0;
    }
  }

  /**
   * Slice operation - restrict dimension members
   */
  slice(cubeName: string, dimension: string, members: string[]): Map<string, number> {
    const cube = this.cubes.get(cubeName);
    if (!cube) return new Map();

    const result = new Map<string, number>();

    cube.data.forEach((value, key) => {
      const [dimKey, measureName] = key.split('|').slice(0, -1);
      const parts = dimKey.split('|');
      const dims = Array.from(cube.dimensions.keys());

      const dimIndex = dims.indexOf(dimension);
      if (dimIndex >= 0 && members.includes(parts[dimIndex])) {
        result.set(key, value);
      }
    });

    return result;
  }

  /**
   * Dice operation - select specific cells
   */
  dice(cubeName: string, query: DiceQuery): Map<string, number> {
    const cube = this.cubes.get(cubeName);
    if (!cube) return new Map();

    const result = new Map<string, number>();
    const {dimension, members, measures} = query;

    cube.data.forEach((value, key) => {
      const parts = key.split('|');
      const measureName = parts.pop();

      if (measures.includes(measureName!)) {
        const dimKey = parts.join('|');
        const dimParts = dimKey.split('|');
        const dims = Array.from(cube.dimensions.keys());
        const dimIndex = dims.indexOf(dimension);

        if (dimIndex >= 0 && members.includes(dimParts[dimIndex])) {
          result.set(key, value);
        }
      }
    });

    return result;
  }

  /**
   * Roll-up operation - aggregate to higher level
   */
  rollUp(
    cubeName: string,
    dimension: string,
    level: number
  ): Map<string, number> {
    const cube = this.cubes.get(cubeName);
    if (!cube) return new Map();

    const dim = cube.dimensions.get(dimension);
    if (!dim) return new Map();

    // Simplified roll-up (would need actual hierarchy)
    const result = new Map<string, number>();
    const aggregated = new Map<string, number>();

    cube.data.forEach((value, key) => {
      const keyWithoutLevel = key.split('|').slice(0, level).join('|');
      const current = aggregated.get(keyWithoutLevel) || 0;
      aggregated.set(keyWithoutLevel, current + value);
    });

    return aggregated;
  }

  /**
   * Drill-down operation - break down to lower level
   */
  drillDown(
    cubeName: string,
    cellKey: string,
    dimension: string
  ): Map<string, number> {
    const cube = this.cubes.get(cubeName);
    if (!cube) return new Map();

    const result = new Map<string, number>();
    const prefix = cellKey + '|' + dimension;

    cube.data.forEach((value, key) => {
      if (key.startsWith(prefix)) {
        result.set(key, value);
      }
    });

    return result;
  }

  /**
   * Pivot operation - rotate dimensions
   */
  pivot(cubeName: string, dimensions: string[]): Map<string, number> {
    const cube = this.cubes.get(cubeName);
    if (!cube) return new Map();

    // Reorder dimensions in cube data keys
    const result = new Map<string, number>();
    const oldDims = Array.from(cube.dimensions.keys());

    cube.data.forEach((value, key) => {
      const parts = key.split('|');
      const measure = parts.pop();
      const dimValues: Record<string, string> = {};

      oldDims.forEach((dim, index) => {
        dimValues[dim] = parts[index];
      });

      const newKey = dimensions.map((d) => dimValues[d]).join('|') + '|' + measure;
      result.set(newKey, value);
    });

    return result;
  }

  /**
   * Query cube with MDQL-like syntax
   */
  query(cubeName: string, query: SliceQuery): Array<Record<string, any>> {
    const cube = this.cubes.get(cubeName);
    if (!cube) return [];

    const results: Array<Record<string, any>> = [];
    const dims = Array.from(cube.dimensions.keys());

    // Generate all combinations
    const combinations = this.generateCombinations(query.dimensions);

    combinations.forEach((combo) => {
      const dataKey = Object.keys(combo)
        .sort()
        .map((d) => combo[d])
        .join('|');

      const row: Record<string, any> = {...combo};

      query.measures.forEach((measure) => {
        const valueKey = `${dataKey}|${measure}`;
        row[measure] = cube.data.get(valueKey) || 0;
      });

      results.push(row);
    });

    return results;
  }

  /**
   * Generate dimension combinations
   */
  private generateCombinations(dimensions: Record<string, string[]>): Array<Record<string, string>> {
    const keys = Object.keys(dimensions);
    const results: Array<Record<string, string>> = [{}];

    keys.forEach((key) => {
      const newResults: Array<Record<string, string>> = [];

      dimensions[key].forEach((value) => {
        results.forEach((result) => {
          newResults.push({...result, [key]: value});
        });
      });

      results.length = 0;
      results.push(...newResults);
    });

    return results;
  }

  /**
   * Get member properties
   */
  getMemberProperties(cubeName: string, dimension: string, member: string): Record<string, any> {
    const cube = this.cubes.get(cubeName);
    if (!cube) return {};

    const dim = cube.dimensions.get(dimension);
    if (!dim) return {};

    return dim.members.get(member) || {};
  }

  /**
   * Get hierarchy levels
   */
  getHierarchyLevels(cubeName: string, dimension: string): string[] {
    const cube = this.cubes.get(cubeName);
    if (!cube) return [];

    const dim = cube.dimensions.get(dimension);
    return dim?.hierarchy || [];
  }

  /**
   * Calculate calculated member
   */
  addCalculatedMember(
    cubeName: string,
    name: string,
    expression: (cube: Cube) => Map<string, number>
  ): void {
    const cube = this.cubes.get(cubeName);
    if (!cube) return;

    const calculated = expression(cube);
    calculated.forEach((value, key) => {
      cube.data.set(key + '|' + name, value);
    });
  }

  /**
   * Get cube info
   */
  getCubeInfo(cubeName: string): {dimensions: string[]; measures: string[]; cellCount: number} | null {
    const cube = this.cubes.get(cubeName);
    if (!cube) return null;

    return {
      dimensions: Array.from(cube.dimensions.keys()),
      measures: Array.from(cube.measures.keys()),
      cellCount: cube.size,
    };
  }

  /**
   * List all cubes
   */
  listCubes(): string[] {
    return Array.from(this.cubes.keys());
  }

  /**
   * Delete cube
   */
  deleteCube(cubeName: string): boolean {
    return this.cubes.delete(cubeName);
  }
}

export default new OLAPCubeService();
