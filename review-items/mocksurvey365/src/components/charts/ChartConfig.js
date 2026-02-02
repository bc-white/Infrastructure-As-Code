// Chart.js configuration for consistent styling across the dashboard
export const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
          family: 'Inter, sans-serif'
        }
      }
    },
    title: {
      display: true,
      font: {
        size: 16,
        weight: 'bold',
        family: 'Inter, sans-serif'
      },
      color: '#374151'
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      intersect: false,
      mode: 'index'
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 11,
          family: 'Inter, sans-serif'
        },
        color: '#6b7280'
      }
    },
    y: {
      grid: {
        color: '#f3f4f6',
        drawBorder: false
      },
      ticks: {
        font: {
          size: 11,
          family: 'Inter, sans-serif'
        },
        color: '#6b7280'
      }
    }
  },
  elements: {
    bar: {
      borderRadius: 4,
      borderSkipped: false
    },
    point: {
      radius: 4,
      hoverRadius: 6
    },
    line: {
      tension: 0.4,
      borderWidth: 2
    }
  }
};

// Color palettes for different chart types
export const colorPalettes = {
  primary: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
  quality: ['#ef4444', '#f97316', '#eab308', '#dc2626', '#22c55e'],
  compliance: ['#dc2626', '#f97316', '#eab308', '#22c55e'],
  satisfaction: ['#3b82f6', '#8b5cf6'],
  risk: ['#dc2626', '#eab308', '#22c55e'],
  star: ['#22c55e', '#3b82f6', '#eab308', '#f97316', '#dc2626'],
  staffing: ['#3b82f6', '#8b5cf6', '#06b6d4']
};

// Chart-specific configurations
export const chartConfigs = {
  doughnut: {
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15
        }
      }
    }
  },
  
  bar: {
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6'
        }
      }
    }
  },

  line: {
    scales: {
      y: {
        beginAtZero: true
      }
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 5
      }
    }
  },

  radar: {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20
        }
      }
    }
  }
};

// Helper function to generate chart data with consistent styling
export const createChartData = (type, labels, data, colors, options = {}) => {
  const baseConfig = {
    labels,
    datasets: [{
      data,
      backgroundColor: colors,
      borderColor: colors.map(color => color.replace('0.8', '1')),
      borderWidth: 2,
      ...options
    }]
  };

  return baseConfig;
};

// Helper function to merge chart options
export const mergeChartOptions = (chartType, customOptions = {}) => {
  const baseOptions = { ...chartDefaults, ...chartConfigs[chartType] };
  return {
    ...baseOptions,
    ...customOptions,
    plugins: {
      ...baseOptions.plugins,
      ...customOptions.plugins
    }
  };
};
