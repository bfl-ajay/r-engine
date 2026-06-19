/**
 * Anomaly Detection Service
 * Identifies unusual patterns and outliers in data
 */

export interface Anomaly {
  index: number;
  value: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  reason: string;
  context?: Record<string, any>;
}

export interface AnomalyDetectionResult {
  anomalies: Anomaly[];
  method: string;
  threshold: number;
  detectionRate: number;
}

/**
 * AnomalyDetectionService - Detect anomalies in data
 */
class AnomalyDetectionService {
  /**
   * Detect anomalies using IQR method
   */
  detectAnomaliesIQR(data: number[]): AnomalyDetectionResult {
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = this.getPercentile(sorted, 25);
    const q3 = this.getPercentile(sorted, 75);
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const anomalies: Anomaly[] = [];

    data.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        const distance = value < lowerBound ? lowerBound - value : value - upperBound;
        const severity = this.calculateSeverity(distance / iqr);

        anomalies.push({
          index,
          value,
          severity,
          score: Math.min(1, distance / (iqr * 3)),
          reason: `Value ${value} is ${value < lowerBound ? 'below' : 'above'} normal range [${lowerBound}, ${upperBound}]`,
        });
      }
    });

    return {
      anomalies,
      method: 'IQR',
      threshold: 1.5,
      detectionRate: (anomalies.length / data.length) * 100,
    };
  }

  /**
   * Detect anomalies using Z-score method
   */
  detectAnomaliesZScore(data: number[], threshold: number = 3): AnomalyDetectionResult {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    const anomalies: Anomaly[] = [];

    if (stdDev === 0) {
      return {anomalies, method: 'Z-SCORE', threshold, detectionRate: 0};
    }

    data.forEach((value, index) => {
      const zScore = (value - mean) / stdDev;

      if (Math.abs(zScore) > threshold) {
        const severity = this.calculateSeverity(Math.abs(zScore) / threshold);

        anomalies.push({
          index,
          value,
          severity,
          score: Math.min(1, Math.abs(zScore) / (threshold * 2)),
          reason: `Z-score of ${zScore.toFixed(2)} exceeds threshold of ${threshold}`,
        });
      }
    });

    return {
      anomalies,
      method: 'Z-SCORE',
      threshold,
      detectionRate: (anomalies.length / data.length) * 100,
    };
  }

  /**
   * Detect anomalies using isolation forest
   */
  detectAnomaliesIsolationForest(
    data: Array<Record<string, number>>,
    contamination: number = 0.1
  ): AnomalyDetectionResult {
    const anomalies: Anomaly[] = [];
    const numAnomalies = Math.ceil(data.length * contamination);

    // Simple approach: use combined distance metric
    const anomalyScores = data.map((row, index) => {
      const distance = this.calculateMultivariateDistance(row, data);
      return {index, distance, row};
    });

    // Sort by distance and mark top contamination% as anomalies
    anomalyScores
      .sort((a, b) => b.distance - a.distance)
      .slice(0, numAnomalies)
      .forEach(({index, distance, row}) => {
        const severity = this.calculateSeverity(Math.min(1, distance / 10));

        anomalies.push({
          index,
          value: distance,
          severity,
          score: Math.min(1, distance / 10),
          reason: `Isolation score ${distance.toFixed(2)} indicates anomalous pattern`,
          context: row,
        });
      });

    return {
      anomalies,
      method: 'ISOLATION_FOREST',
      threshold: contamination,
      detectionRate: (anomalies.length / data.length) * 100,
    };
  }

  /**
   * Detect time series anomalies
   */
  detectTimeSeriesAnomalies(
    data: Array<{timestamp: number; value: number}>,
    windowSize: number = 7
  ): AnomalyDetectionResult {
    const values = data.map((d) => d.value);
    const anomalies: Anomaly[] = [];

    for (let i = windowSize; i < values.length; i++) {
      const window = values.slice(i - windowSize, i);
      const mean = window.reduce((a, b) => a + b, 0) / window.length;
      const variance = window.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / window.length;
      const stdDev = Math.sqrt(variance);

      // Check if next value is anomalous
      const nextValue = values[i];
      const zscore = stdDev === 0 ? 0 : (nextValue - mean) / stdDev;

      if (Math.abs(zscore) > 2.5) {
        const severity = this.calculateSeverity(Math.abs(zscore) / 2.5);

        anomalies.push({
          index: i,
          value: nextValue,
          severity,
          score: Math.min(1, Math.abs(zscore) / 5),
          reason: `Unexpected change in time series (z-score: ${zscore.toFixed(2)})`,
          context: {expectedRange: [mean - 2 * stdDev, mean + 2 * stdDev]},
        });
      }
    }

    return {
      anomalies,
      method: 'TIME_SERIES',
      threshold: 2.5,
      detectionRate: (anomalies.length / values.length) * 100,
    };
  }

  /**
   * Detect collective anomalies
   */
  detectCollectiveAnomalies(
    data: number[],
    sequenceLength: number = 5
  ): AnomalyDetectionResult {
    const anomalies: Anomaly[] = [];
    const mean = data.reduce((a, b) => a + b, 0) / data.length;

    for (let i = 0; i <= data.length - sequenceLength; i++) {
      const sequence = data.slice(i, i + sequenceLength);
      const seqMean = sequence.reduce((a, b) => a + b, 0) / sequence.length;
      const deviation = Math.abs(seqMean - mean);

      if (deviation > mean * 0.3) {
        // More than 30% deviation
        const severity = this.calculateSeverity(Math.min(1, deviation / (mean * 0.5)));

        anomalies.push({
          index: i,
          value: seqMean,
          severity,
          score: Math.min(1, deviation / (mean * 0.5)),
          reason: `Collective anomaly: sequence average ${seqMean.toFixed(2)} deviates significantly from overall average ${mean.toFixed(2)}`,
        });
      }
    }

    return {
      anomalies,
      method: 'COLLECTIVE',
      threshold: 0.3,
      detectionRate: (anomalies.length / data.length) * 100,
    };
  }

  /**
   * Calculate severity level
   */
  private calculateSeverity(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score < 0.3) return 'LOW';
    if (score < 0.6) return 'MEDIUM';
    if (score < 0.8) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Get percentile
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
   * Calculate multivariate distance
   */
  private calculateMultivariateDistance(
    row: Record<string, number>,
    allData: Array<Record<string, number>>
  ): number {
    const keys = Object.keys(row);
    let distance = 0;

    keys.forEach((key) => {
      const values = allData.map((r) => r[key]).filter((v) => v !== undefined);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev > 0) {
        const zscore = (row[key] - mean) / stdDev;
        distance += Math.pow(zscore, 2);
      }
    });

    return Math.sqrt(distance);
  }

  /**
   * Compare anomaly detection methods
   */
  compareMethods(data: number[]): {method: string; anomalyCount: number; rate: number}[] {
    const iqr = this.detectAnomaliesIQR(data);
    const zscore = this.detectAnomaliesZScore(data);

    return [
      {method: 'IQR', anomalyCount: iqr.anomalies.length, rate: iqr.detectionRate},
      {method: 'Z-SCORE', anomalyCount: zscore.anomalies.length, rate: zscore.detectionRate},
    ];
  }

  /**
   * Generate anomaly report
   */
  generateReport(result: AnomalyDetectionResult): string {
    const lines = [
      `Anomaly Detection Report (Method: ${result.method})`,
      `================================`,
      `Total Anomalies Found: ${result.anomalies.length}`,
      `Detection Rate: ${result.detectionRate.toFixed(2)}%`,
      `Threshold: ${result.threshold}`,
      ``,
      `Critical: ${result.anomalies.filter((a) => a.severity === 'CRITICAL').length}`,
      `High: ${result.anomalies.filter((a) => a.severity === 'HIGH').length}`,
      `Medium: ${result.anomalies.filter((a) => a.severity === 'MEDIUM').length}`,
      `Low: ${result.anomalies.filter((a) => a.severity === 'LOW').length}`,
    ];

    return lines.join('\n');
  }
}

export default new AnomalyDetectionService();
