/**
 * Forecasting Service
 * Time-series analysis and forecasting
 */

export interface TimeSeriesData {
  timestamp: number | Date;
  value: number;
  actual?: number;
  forecast?: number;
  confidence?: {lower: number; upper: number};
}

export interface ForecastModel {
  type: 'LINEAR' | 'EXPONENTIAL' | 'ARIMA' | 'POLYNOMIAL' | 'MOVING_AVERAGE';
  parameters: Record<string, number>;
  rmse: number;
  mae: number;
  r2: number;
}

export interface Forecast {
  model: ForecastModel;
  predictions: TimeSeriesData[];
  accuracy: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
}

/**
 * ForecastingService - Time-series forecasting
 */
class ForecastingService {
  /**
   * Forecast using linear regression
   */
  forecastLinear(data: TimeSeriesData[], periods: number = 12): Forecast {
    const values = data.map((d) => d.value);
    const n = values.length;

    // Calculate linear regression parameters
    const x = Array.from({length: n}, (_, i) => i);
    const slope = this.calculateSlope(x, values);
    const intercept = this.calculateIntercept(x, values, slope);

    // Generate predictions
    const predictions: TimeSeriesData[] = [];
    for (let i = 0; i < periods; i++) {
      const forecastX = n + i;
      const forecastValue = slope * forecastX + intercept;
      predictions.push({
        timestamp: this.getNextTimestamp(data[data.length - 1].timestamp, i + 1),
        value: 0,
        forecast: Math.round(forecastValue * 100) / 100,
      });
    }

    // Calculate model metrics
    const fitted = x.map((xi) => slope * xi + intercept);
    const rmse = this.calculateRMSE(values, fitted);
    const mae = this.calculateMAE(values, fitted);
    const r2 = this.calculateR2(values, fitted);
    const trend = this.detectTrend(values);

    return {
      model: {
        type: 'LINEAR',
        parameters: {slope, intercept},
        rmse,
        mae,
        r2,
      },
      predictions,
      accuracy: r2 * 100,
      trend,
    };
  }

  /**
   * Forecast using exponential smoothing
   */
  forecastExponential(data: TimeSeriesData[], periods: number = 12, alpha: number = 0.3): Forecast {
    const values = data.map((d) => d.value);
    const n = values.length;

    // Calculate exponential smoothing
    let smoothed = values[0];
    const smoothedValues = [smoothed];

    for (let i = 1; i < n; i++) {
      smoothed = alpha * values[i] + (1 - alpha) * smoothed;
      smoothedValues.push(smoothed);
    }

    // Generate predictions
    const predictions: TimeSeriesData[] = [];
    let forecast = smoothed;

    for (let i = 0; i < periods; i++) {
      predictions.push({
        timestamp: this.getNextTimestamp(data[data.length - 1].timestamp, i + 1),
        value: 0,
        forecast: Math.round(forecast * 100) / 100,
      });
    }

    const rmse = this.calculateRMSE(values, smoothedValues);
    const mae = this.calculateMAE(values, smoothedValues);
    const r2 = this.calculateR2(values, smoothedValues);
    const trend = this.detectTrend(values);

    return {
      model: {
        type: 'EXPONENTIAL',
        parameters: {alpha},
        rmse,
        mae,
        r2,
      },
      predictions,
      accuracy: r2 * 100,
      trend,
    };
  }

  /**
   * Forecast using moving average
   */
  forecastMovingAverage(data: TimeSeriesData[], periods: number = 12, window: number = 3): Forecast {
    const values = data.map((d) => d.value);
    const n = values.length;

    // Calculate moving averages
    const ma = [];
    for (let i = window - 1; i < n; i++) {
      const avg = values.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0) / window;
      ma.push(avg);
    }

    // Generate predictions
    const predictions: TimeSeriesData[] = [];
    const lastMA = ma[ma.length - 1];

    for (let i = 0; i < periods; i++) {
      predictions.push({
        timestamp: this.getNextTimestamp(data[data.length - 1].timestamp, i + 1),
        value: 0,
        forecast: Math.round(lastMA * 100) / 100,
      });
    }

    const rmse = this.calculateRMSE(values.slice(window - 1), ma);
    const mae = this.calculateMAE(values.slice(window - 1), ma);
    const r2 = this.calculateR2(values.slice(window - 1), ma);
    const trend = this.detectTrend(values);

    return {
      model: {
        type: 'MOVING_AVERAGE',
        parameters: {window},
        rmse,
        mae,
        r2,
      },
      predictions,
      accuracy: r2 * 100,
      trend,
    };
  }

  /**
   * Calculate slope for linear regression
   */
  private calculateSlope(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b) / n;
    const meanY = y.reduce((a, b) => a + b) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (x[i] - meanX) * (y[i] - meanY);
      denominator += (x[i] - meanX) * (x[i] - meanX);
    }

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate intercept for linear regression
   */
  private calculateIntercept(x: number[], y: number[], slope: number): number {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b) / n;
    const meanY = y.reduce((a, b) => a + b) / n;
    return meanY - slope * meanX;
  }

  /**
   * Calculate RMSE
   */
  private calculateRMSE(actual: number[], predicted: number[]): number {
    const n = Math.min(actual.length, predicted.length);
    if (n === 0) return 0;

    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += Math.pow(actual[i] - predicted[i], 2);
    }

    return Math.sqrt(sum / n);
  }

  /**
   * Calculate MAE
   */
  private calculateMAE(actual: number[], predicted: number[]): number {
    const n = Math.min(actual.length, predicted.length);
    if (n === 0) return 0;

    return (
      actual
        .slice(0, n)
        .reduce((sum, val, i) => sum + Math.abs(val - predicted[i]), 0) / n
    );
  }

  /**
   * Calculate R²
   */
  private calculateR2(actual: number[], predicted: number[]): number {
    const n = Math.min(actual.length, predicted.length);
    if (n === 0) return 0;

    const meanY = actual.slice(0, n).reduce((a, b) => a + b, 0) / n;
    let ssRes = 0;
    let ssTot = 0;

    for (let i = 0; i < n; i++) {
      ssRes += Math.pow(actual[i] - predicted[i], 2);
      ssTot += Math.pow(actual[i] - meanY, 2);
    }

    return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  }

  /**
   * Detect trend direction
   */
  private detectTrend(values: number[]): 'INCREASING' | 'DECREASING' | 'STABLE' {
    if (values.length < 2) return 'STABLE';

    const recent = values.slice(-5);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const avgEarlier = values
      .slice(0, Math.min(5, values.length - 5))
      .reduce((a, b) => a + b, 0) / Math.min(5, values.length - 5);

    const change = avgRecent - avgEarlier;
    const changePercent = Math.abs(change / avgEarlier);

    if (changePercent < 0.05) return 'STABLE';
    return change > 0 ? 'INCREASING' : 'DECREASING';
  }

  /**
   * Get next timestamp
   */
  private getNextTimestamp(lastTimestamp: number | Date, offset: number): number {
    const date = new Date(lastTimestamp);
    date.setMonth(date.getMonth() + offset);
    return date.getTime();
  }

  /**
   * Calculate seasonal decomposition
   */
  decomposeSeasonality(
    data: TimeSeriesData[],
    seasonLength: number = 12
  ): {trend: number[]; seasonal: number[]; residual: number[]} {
    const values = data.map((d) => d.value);

    // Simple moving average for trend
    const trend: number[] = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(seasonLength / 2));
      const end = Math.min(values.length, i + Math.floor(seasonLength / 2) + 1);
      const avg = values.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);
      trend.push(avg);
    }

    // Detrended values
    const detrended = values.map((v, i) => v - trend[i]);

    // Average seasonal pattern
    const seasonal: number[] = Array(values.length).fill(0);
    for (let i = 0; i < seasonLength; i++) {
      let sum = 0;
      let count = 0;
      for (let j = i; j < values.length; j += seasonLength) {
        sum += detrended[j];
        count++;
      }
      const avg = count > 0 ? sum / count : 0;

      for (let j = i; j < values.length; j += seasonLength) {
        seasonal[j] = avg;
      }
    }

    // Residual
    const residual = values.map((v, i) => v - trend[i] - seasonal[i]);

    return {trend, seasonal, residual};
  }

  /**
   * Predict with confidence intervals
   */
  predictWithConfidence(forecast: Forecast, confidenceLevel: number = 0.95): Forecast {
    // Calculate standard error from RMSE
    const se = forecast.model.rmse;
    const zScore = this.getZScore(confidenceLevel);

    const withConfidence = forecast.predictions.map((pred) => ({
      ...pred,
      confidence: {
        lower: Math.round((pred.forecast! - zScore * se) * 100) / 100,
        upper: Math.round((pred.forecast! + zScore * se) * 100) / 100,
      },
    }));

    return {...forecast, predictions: withConfidence};
  }

  /**
   * Get Z-score for confidence level
   */
  private getZScore(confidenceLevel: number): number {
    const scores: Record<number, number> = {
      0.9: 1.645,
      0.95: 1.96,
      0.99: 2.576,
    };
    return scores[confidenceLevel] || 1.96;
  }

  /**
   * Compare forecast models
   */
  compareModels(data: TimeSeriesData[]): ForecastModel[] {
    const linear = this.forecastLinear(data);
    const exponential = this.forecastExponential(data);
    const moving = this.forecastMovingAverage(data);

    return [linear.model, exponential.model, moving.model].sort((a, b) => b.r2 - a.r2);
  }
}

export default new ForecastingService();
