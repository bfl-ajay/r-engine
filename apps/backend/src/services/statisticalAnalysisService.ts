/**
 * Statistical Analysis Service
 * Provides statistical analysis functions for report data
 */

export interface StatisticalMeasures {
  mean: number;
  median: number;
  mode: number[];
  stdDev: number;
  variance: number;
  range: {min: number; max: number};
  quartiles: {q1: number; q2: number; q3: number};
  iqr: number;
  skewness: number;
  kurtosis: number;
  sum: number;
  count: number;
  min: number;
  max: number;
}

export interface Distribution {
  type: 'NORMAL' | 'SKEWED' | 'UNIFORM' | 'BIMODAL' | 'UNKNOWN';
  confidence: number;
}

export interface Correlation {
  field1: string;
  field2: string;
  pearson: number;
  spearman: number;
  kendall: number;
  significant: boolean;
}

/**
 * StatisticalAnalysisService - Statistical computations
 */
class StatisticalAnalysisService {
  /**
   * Calculate all statistical measures
   */
  calculateMeasures(data: number[]): StatisticalMeasures {
    if (data.length === 0) {
      return this.emptyMeasures();
    }

    const sorted = [...data].sort((a, b) => a - b);
    const mean = this.calculateMean(data);
    const variance = this.calculateVariance(data, mean);

    return {
      mean,
      median: this.calculateMedian(sorted),
      mode: this.calculateMode(sorted),
      stdDev: Math.sqrt(variance),
      variance,
      range: {min: sorted[0], max: sorted[sorted.length - 1]},
      quartiles: this.calculateQuartiles(sorted),
      iqr: this.calculateIQR(sorted),
      skewness: this.calculateSkewness(data, mean, Math.sqrt(variance)),
      kurtosis: this.calculateKurtosis(data, mean, Math.sqrt(variance)),
      sum: data.reduce((a, b) => a + b, 0),
      count: data.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  /**
   * Calculate mean
   */
  private calculateMean(data: number[]): number {
    if (data.length === 0) return 0;
    return data.reduce((a, b) => a + b, 0) / data.length;
  }

  /**
   * Calculate median
   */
  private calculateMedian(sorted: number[]): number {
    if (sorted.length === 0) return 0;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Calculate mode (most frequent values)
   */
  private calculateMode(data: number[]): number[] {
    const frequency: Map<number, number> = new Map();
    data.forEach((num) => {
      frequency.set(num, (frequency.get(num) || 0) + 1);
    });

    const maxFreq = Math.max(...frequency.values());
    return Array.from(frequency.entries())
      .filter(([_, freq]) => freq === maxFreq)
      .map(([val]) => val);
  }

  /**
   * Calculate variance
   */
  private calculateVariance(data: number[], mean: number): number {
    if (data.length === 0) return 0;
    const sumSq = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
    return sumSq / data.length;
  }

  /**
   * Calculate quartiles
   */
  private calculateQuartiles(sorted: number[]): {q1: number; q2: number; q3: number} {
    const len = sorted.length;
    return {
      q1: this.getPercentile(sorted, 25),
      q2: this.getPercentile(sorted, 50), // median
      q3: this.getPercentile(sorted, 75),
    };
  }

  /**
   * Calculate percentile
   */
  private getPercentile(sorted: number[], percentile: number): number {
    const index = (percentile / 100) * sorted.length;
    const lower = Math.floor(index - 1);
    const upper = Math.ceil(index - 1);
    const weight = index % 1;

    if (upper >= sorted.length) return sorted[sorted.length - 1];
    if (lower < 0) return sorted[0];

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Calculate IQR
   */
  private calculateIQR(sorted: number[]): number {
    const q1 = this.getPercentile(sorted, 25);
    const q3 = this.getPercentile(sorted, 75);
    return q3 - q1;
  }

  /**
   * Calculate skewness
   */
  private calculateSkewness(data: number[], mean: number, stdDev: number): number {
    if (stdDev === 0 || data.length < 3) return 0;

    const n = data.length;
    const sum = data.reduce((acc, val) => {
      const z = (val - mean) / stdDev;
      return acc + Math.pow(z, 3);
    }, 0);

    return sum / n;
  }

  /**
   * Calculate kurtosis
   */
  private calculateKurtosis(data: number[], mean: number, stdDev: number): number {
    if (stdDev === 0 || data.length < 4) return 0;

    const n = data.length;
    const sum = data.reduce((acc, val) => {
      const z = (val - mean) / stdDev;
      return acc + Math.pow(z, 4);
    }, 0);

    return sum / n - 3; // Excess kurtosis
  }

  /**
   * Detect distribution type
   */
  detectDistribution(measures: StatisticalMeasures): Distribution {
    const {skewness, kurtosis} = measures;
    let confidence = 0.5;

    // Check for normal distribution
    if (Math.abs(skewness) < 0.5 && Math.abs(kurtosis) < 1) {
      return {type: 'NORMAL', confidence: 0.8};
    }

    // Check for skewed distribution
    if (skewness > 1 || skewness < -1) {
      return {type: 'SKEWED', confidence: 0.7};
    }

    // Check for uniform distribution
    if (Math.abs(kurtosis) > 1) {
      return {type: 'UNIFORM', confidence: 0.6};
    }

    return {type: 'UNKNOWN', confidence};
  }

  /**
   * Calculate Z-scores
   */
  calculateZScores(data: number[]): number[] {
    const mean = this.calculateMean(data);
    const stdDev = Math.sqrt(this.calculateVariance(data, mean));

    if (stdDev === 0) return data.map(() => 0);

    return data.map((val) => (val - mean) / stdDev);
  }

  /**
   * Identify outliers using IQR method
   */
  identifyOutliersIQR(data: number[]): {outliers: number[]; bounds: {lower: number; upper: number}} {
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = this.getPercentile(sorted, 25);
    const q3 = this.getPercentile(sorted, 75);
    const iqr = q3 - q1;

    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;

    const outliers = data.filter((val) => val < lower || val > upper);

    return {outliers, bounds: {lower, upper}};
  }

  /**
   * Identify outliers using Z-score method
   */
  identifyOutliersZScore(data: number[], threshold: number = 3): number[] {
    const zScores = this.calculateZScores(data);
    return data.filter((_, i) => Math.abs(zScores[i]) > threshold);
  }

  /**
   * Calculate correlation between two datasets
   */
  calculateCorrelation(x: number[], y: number[]): Correlation {
    const len = Math.min(x.length, y.length);
    if (len < 2) {
      return {
        field1: 'x',
        field2: 'y',
        pearson: 0,
        spearman: 0,
        kendall: 0,
        significant: false,
      };
    }

    const xData = x.slice(0, len);
    const yData = y.slice(0, len);

    return {
      field1: 'x',
      field2: 'y',
      pearson: this.calculatePearson(xData, yData),
      spearman: this.calculateSpearman(xData, yData),
      kendall: this.calculateKendall(xData, yData),
      significant: false, // Would need p-value calculation
    };
  }

  /**
   * Calculate Pearson correlation
   */
  private calculatePearson(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = this.calculateMean(x);
    const meanY = this.calculateMean(y);

    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      sumXY += dx * dy;
      sumX2 += dx * dx;
      sumY2 += dy * dy;
    }

    const denominator = Math.sqrt(sumX2 * sumY2);
    return denominator === 0 ? 0 : sumXY / denominator;
  }

  /**
   * Calculate Spearman correlation
   */
  private calculateSpearman(x: number[], y: number[]): number {
    const xRanks = this.rankData(x);
    const yRanks = this.rankData(y);
    return this.calculatePearson(xRanks, yRanks);
  }

  /**
   * Calculate Kendall correlation
   */
  private calculateKendall(x: number[], y: number[]): number {
    const n = x.length;
    let concordant = 0;
    let discordant = 0;

    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const xSign = Math.sign(x[j] - x[i]);
        const ySign = Math.sign(y[j] - y[i]);

        if (xSign * ySign > 0) concordant++;
        else if (xSign * ySign < 0) discordant++;
      }
    }

    const total = concordant + discordant;
    return total === 0 ? 0 : (concordant - discordant) / total;
  }

  /**
   * Rank data for non-parametric tests
   */
  private rankData(data: number[]): number[] {
    const indexed = data.map((val, idx) => ({val, idx}));
    indexed.sort((a, b) => a.val - b.val);

    const ranks = new Array(data.length);
    for (let i = 0; i < indexed.length; ) {
      let j = i;
      let sum = 0;

      while (j < indexed.length && indexed[j].val === indexed[i].val) {
        sum += j + 1;
        j++;
      }

      const rank = sum / (j - i);
      for (let k = i; k < j; k++) {
        ranks[indexed[k].idx] = rank;
      }

      i = j;
    }

    return ranks;
  }

  /**
   * Perform t-test
   */
  performTTest(x: number[], y: number[]): {tStatistic: number; pValue: number; significant: boolean} {
    const meanX = this.calculateMean(x);
    const meanY = this.calculateMean(y);
    const varX = this.calculateVariance(x, meanX);
    const varY = this.calculateVariance(y, meanY);

    const n1 = x.length;
    const n2 = y.length;
    const pooledVar = ((n1 - 1) * varX + (n2 - 1) * varY) / (n1 + n2 - 2);
    const se = Math.sqrt(pooledVar * (1 / n1 + 1 / n2));

    const tStatistic = se === 0 ? 0 : (meanX - meanY) / se;

    return {
      tStatistic,
      pValue: 0.05, // Simplified - would need actual p-value lookup
      significant: Math.abs(tStatistic) > 1.96,
    };
  }

  /**
   * Empty measures object
   */
  private emptyMeasures(): StatisticalMeasures {
    return {
      mean: 0,
      median: 0,
      mode: [],
      stdDev: 0,
      variance: 0,
      range: {min: 0, max: 0},
      quartiles: {q1: 0, q2: 0, q3: 0},
      iqr: 0,
      skewness: 0,
      kurtosis: 0,
      sum: 0,
      count: 0,
      min: 0,
      max: 0,
    };
  }
}

export default new StatisticalAnalysisService();
