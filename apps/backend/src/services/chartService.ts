/**
 * Chart Service
 * Generates chart configurations for multiple chart types
 */

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  yAxisID?: string;
}

export interface ChartConfig {
  type: 'LINE' | 'BAR' | 'PIE' | 'DOUGHNUT' | 'SCATTER' | 'BUBBLE' | 'RADAR' | 'POLAR' | 'AREA';
  labels: string[];
  datasets: ChartDataset[];
  options?: Record<string, any>;
  title?: string;
  subtitle?: string;
}

/**
 * ChartService - Create chart configurations
 */
class ChartService {
  /**
   * Create line chart
   */
  createLineChart(
    labels: string[],
    datasets: Array<{label: string; data: number[]; color?: string; tension?: number}>,
    title?: string
  ): ChartConfig {
    return {
      type: 'LINE',
      labels,
      datasets: datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.color || this.getDefaultColor(),
        backgroundColor: (ds.color || this.getDefaultColor()) + '20',
        tension: ds.tension ?? 0.4,
        fill: true,
      })),
      title,
      options: {
        responsive: true,
        plugins: {
          legend: {position: 'top' as const},
        },
        scales: {
          y: {beginAtZero: true},
        },
      },
    };
  }

  /**
   * Create bar chart
   */
  createBarChart(
    labels: string[],
    datasets: Array<{label: string; data: number[]; color?: string}>,
    title?: string,
    horizontal: boolean = false
  ): ChartConfig {
    return {
      type: 'BAR',
      labels,
      datasets: datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.color || this.getDefaultColor(),
        borderColor: (ds.color || this.getDefaultColor()).replace(')', ', 1)'),
        borderWidth: 1,
      })),
      title,
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        plugins: {
          legend: {position: 'top' as const},
        },
      },
    };
  }

  /**
   * Create pie chart
   */
  createPieChart(
    labels: string[],
    data: number[],
    colors?: string[],
    title?: string
  ): ChartConfig {
    return {
      type: 'PIE',
      labels,
      datasets: [
        {
          label: 'Distribution',
          data,
          backgroundColor: colors || this.getDefaultColors(labels.length),
          borderColor: '#fff',
          borderWidth: 2,
        },
      ],
      title,
      options: {
        responsive: true,
        plugins: {
          legend: {position: 'right' as const},
          tooltip: {
            callbacks: {
              label: function (context: any) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const sum = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / sum) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    };
  }

  /**
   * Create doughnut chart
   */
  createDoughnutChart(
    labels: string[],
    data: number[],
    colors?: string[],
    title?: string
  ): ChartConfig {
    return {
      type: 'DOUGHNUT',
      labels,
      datasets: [
        {
          label: 'Distribution',
          data,
          backgroundColor: colors || this.getDefaultColors(labels.length),
          borderColor: '#fff',
          borderWidth: 2,
        },
      ],
      title,
      options: {
        responsive: true,
        plugins: {
          legend: {position: 'bottom' as const},
        },
      },
    };
  }

  /**
   * Create scatter chart
   */
  createScatterChart(
    datasets: Array<{
      label: string;
      data: Array<{x: number; y: number}>;
      color?: string;
      size?: number;
    }>,
    title?: string
  ): ChartConfig {
    return {
      type: 'SCATTER',
      labels: [],
      datasets: datasets.map((ds) => ({
        label: ds.label,
        data: ds.data as any[],
        backgroundColor: ds.color || this.getDefaultColor(),
        borderColor: (ds.color || this.getDefaultColor()).replace(')', ', 1)'),
        borderWidth: 1,
        pointRadius: ds.size ?? 5,
      })),
      title,
      options: {
        responsive: true,
        plugins: {
          legend: {position: 'top' as const},
        },
        scales: {
          x: {type: 'linear' as const, position: 'bottom' as const},
        },
      },
    };
  }

  /**
   * Create area chart
   */
  createAreaChart(
    labels: string[],
    datasets: Array<{label: string; data: number[]; color?: string}>,
    title?: string
  ): ChartConfig {
    return {
      type: 'AREA',
      labels,
      datasets: datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: (ds.color || this.getDefaultColor()) + '40',
        borderColor: ds.color || this.getDefaultColor(),
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      })),
      title,
      options: {
        responsive: true,
        plugins: {
          legend: {position: 'top' as const},
        },
        scales: {
          y: {beginAtZero: true},
        },
      },
    };
  }

  /**
   * Create radar chart
   */
  createRadarChart(
    labels: string[],
    datasets: Array<{label: string; data: number[]; color?: string}>,
    title?: string
  ): ChartConfig {
    return {
      type: 'RADAR',
      labels,
      datasets: datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: (ds.color || this.getDefaultColor()) + '20',
        borderColor: ds.color || this.getDefaultColor(),
        borderWidth: 2,
        fill: true,
      })),
      title,
      options: {
        responsive: true,
        plugins: {
          legend: {position: 'top' as const},
        },
        scales: {
          r: {beginAtZero: true},
        },
      },
    };
  }

  /**
   * Create combo chart
   */
  createComboChart(
    labels: string[],
    lineDatasets: Array<{label: string; data: number[]; color?: string}>,
    barDatasets: Array<{label: string; data: number[]; color?: string}>,
    title?: string
  ): ChartConfig {
    return {
      type: 'BAR',
      labels,
      datasets: [
        ...barDatasets.map((ds) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.color || this.getDefaultColor(),
          type: 'bar' as const,
        })),
        ...lineDatasets.map((ds) => ({
          label: ds.label,
          data: ds.data,
          borderColor: ds.color || this.getDefaultColor(),
          backgroundColor: (ds.color || this.getDefaultColor()) + '20',
          type: 'line' as const,
          tension: 0.4,
          borderWidth: 2,
        })),
      ] as ChartDataset[],
      title,
      options: {
        responsive: true,
        plugins: {
          legend: {position: 'top' as const},
        },
      },
    };
  }

  /**
   * Get default color palette
   */
  private getDefaultColor(): string {
    return 'rgba(75, 192, 192, 1)';
  }

  /**
   * Get default color palette for multiple colors
   */
  private getDefaultColors(count: number): string[] {
    const colors = [
      'rgba(255, 99, 132, 1)',
      'rgba(54, 162, 235, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(75, 192, 192, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 159, 64, 1)',
      'rgba(199, 199, 199, 1)',
      'rgba(83, 102, 255, 1)',
    ];

    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  }

  /**
   * Add tooltip configuration
   */
  addTooltip(
    config: ChartConfig,
    formatter: (context: any) => string
  ): ChartConfig {
    return {
      ...config,
      options: {
        ...config.options,
        plugins: {
          ...config.options?.plugins,
          tooltip: {
            callbacks: {
              label: formatter,
            },
          },
        },
      },
    };
  }

  /**
   * Add legend configuration
   */
  addLegend(config: ChartConfig, position: 'top' | 'bottom' | 'left' | 'right'): ChartConfig {
    return {
      ...config,
      options: {
        ...config.options,
        plugins: {
          ...config.options?.plugins,
          legend: {
            position,
            labels: {
              padding: 15,
              font: {size: 12},
            },
          },
        },
      },
    };
  }

  /**
   * Export chart as image (placeholder)
   */
  async exportAsImage(config: ChartConfig, format: 'png' | 'jpg'): Promise<string> {
    // In production, would use chart library to render and export
    return `data:image/${format};base64,iVBORw0KGg...`;
  }

  /**
   * Validate chart configuration
   */
  validateConfig(config: ChartConfig): {valid: boolean; errors: string[]} {
    const errors: string[] = [];

    if (!config.type) errors.push('Chart type is required');
    if (!config.datasets || config.datasets.length === 0) errors.push('At least one dataset is required');
    if (!config.labels || config.labels.length === 0) errors.push('Labels are required');

    return {valid: errors.length === 0, errors};
  }
}

export default new ChartService();
