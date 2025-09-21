import { DLMMBinData, DLMMPoolData } from './DLMMChart';
import { PortfolioDataPoint } from './PortfolioChart';

// Color palette for charts
export const CHART_COLORS = {
  primary: '#00d4aa',
  secondary: '#4f46e5',
  accent: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  neutral: '#6b7280',
  background: '#1f2937',
  surface: '#2a2b33',
  border: '#374151',
  text: {
    primary: '#ffffff',
    secondary: '#9ca3af',
    muted: '#6b7280',
  },
} as const;

// Chart theme configuration
export const CHART_THEME = {
  grid: {
    stroke: CHART_COLORS.border,
    strokeDasharray: '3 3',
    opacity: 0.3,
  },
  axis: {
    stroke: CHART_COLORS.text.secondary,
    fontSize: 12,
    tickLine: false,
    axisLine: false,
  },
  tooltip: {
    backgroundColor: CHART_COLORS.surface,
    border: `1px solid ${CHART_COLORS.border}`,
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
} as const;

// Formatting utilities
export const formatters = {
  currency: (value: number, decimals: number = 2): string => {
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(1)}B`;
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}K`;
    }
    return `$${value.toFixed(decimals)}`;
  },

  price: (price: number): string => {
    if (price >= 1) {
      return `$${price.toFixed(4)}`;
    } else if (price >= 0.0001) {
      return `$${price.toFixed(6)}`;
    }
    return `$${price.toFixed(8)}`;
  },

  percentage: (value: number, decimals: number = 2): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
  },

  number: (value: number, decimals: number = 2): string => {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)}B`;
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toFixed(decimals);
  },

  date: (dateStr: string, timeframe?: string): string => {
    const date = new Date(dateStr);
    
    switch (timeframe) {
      case '1D':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      case '7D':
      case '30D':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      case '90D':
      case '1Y':
      case 'ALL':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          year: '2-digit' 
        });
      default:
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
    }
  },

  fullDate: (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
};

// Chart data generators for testing/demo purposes
export const generateMockData = {
  portfolioData: (days: number = 30): PortfolioDataPoint[] => {
    const data: PortfolioDataPoint[] = [];
    const startValue = 10000;
    let currentValue = startValue;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      // Simulate price movement
      const change = (Math.random() - 0.5) * 0.1; // ±5% daily change
      currentValue *= (1 + change);
      
      const changePercent = ((currentValue - startValue) / startValue) * 100;
      
      data.push({
        timestamp: date.toISOString(),
        date: date.toISOString().split('T')[0],
        value: currentValue,
        change: changePercent,
        volume: Math.random() * 1000000 + 500000,
      });
    }
    
    return data;
  },

  dlmmBinData: (binCount: number = 20): DLMMBinData[] => {
    const data: DLMMBinData[] = [];
    const basePrice = 100;
    const activeBinIndex = Math.floor(binCount / 2);
    
    for (let i = 0; i < binCount; i++) {
      const priceMultiplier = 0.95 + (i / binCount) * 0.1; // Price range from 95% to 105% of base
      const price = basePrice * priceMultiplier;
      
      // Higher liquidity near active bin
      const distanceFromActive = Math.abs(i - activeBinIndex);
      const liquidityMultiplier = Math.exp(-distanceFromActive * 0.3);
      const baseLiquidity = 50000 + Math.random() * 100000;
      
      data.push({
        binId: i,
        price,
        liquidity: baseLiquidity * liquidityMultiplier,
        volume24h: Math.random() * 10000 + 1000,
        fees24h: Math.random() * 500 + 50,
        isActive: i === activeBinIndex,
        tokenXAmount: Math.random() * 1000,
        tokenYAmount: Math.random() * 1000,
      });
    }
    
    return data;
  },

  dlmmPoolData: (days: number = 30): DLMMPoolData[] => {
    const data: DLMMPoolData[] = [];
    let currentPrice = 100;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      // Simulate price movement
      const priceChange = (Math.random() - 0.5) * 0.05; // ±2.5% daily change
      currentPrice *= (1 + priceChange);
      
      data.push({
        timestamp: date.toISOString(),
        price: currentPrice,
        volume: Math.random() * 500000 + 100000,
        tvl: Math.random() * 2000000 + 1000000,
        fees: Math.random() * 5000 + 1000,
        apr: Math.random() * 50 + 10, // 10-60% APR
      });
    }
    
    return data;
  },
};

// Chart configuration helpers
export const getChartConfig = (type: 'portfolio' | 'dlmm' | 'bins') => {
  const baseConfig = {
    margin: { top: 5, right: 5, left: 5, bottom: 5 },
    ...CHART_THEME,
  };

  switch (type) {
    case 'portfolio':
      return {
        ...baseConfig,
        colors: {
          positive: CHART_COLORS.success,
          negative: CHART_COLORS.error,
          neutral: CHART_COLORS.primary,
        },
      };
    
    case 'dlmm':
      return {
        ...baseConfig,
        colors: {
          primary: CHART_COLORS.primary,
          secondary: CHART_COLORS.secondary,
          volume: CHART_COLORS.accent,
        },
      };
    
    case 'bins':
      return {
        ...baseConfig,
        colors: {
          active: CHART_COLORS.primary,
          inactive: CHART_COLORS.secondary,
          highlight: CHART_COLORS.accent,
        },
      };
    
    default:
      return baseConfig;
  }
};

// Gradient definitions for charts
export const CHART_GRADIENTS = {
  portfolio: {
    positive: {
      id: 'portfolioPositive',
      stops: [
        { offset: '5%', color: CHART_COLORS.success, opacity: 0.3 },
        { offset: '95%', color: CHART_COLORS.success, opacity: 0.05 },
      ],
    },
    negative: {
      id: 'portfolioNegative',
      stops: [
        { offset: '5%', color: CHART_COLORS.error, opacity: 0.3 },
        { offset: '95%', color: CHART_COLORS.error, opacity: 0.05 },
      ],
    },
  },
  dlmm: {
    liquidity: {
      id: 'dlmmLiquidity',
      stops: [
        { offset: '5%', color: CHART_COLORS.primary, opacity: 0.4 },
        { offset: '95%', color: CHART_COLORS.primary, opacity: 0.1 },
      ],
    },
  },
};

// Animation configurations
export const CHART_ANIMATIONS = {
  duration: 300,
  easing: 'ease-in-out',
  stagger: 50,
};

// Responsive breakpoints for charts
export const CHART_BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
};

// Chart height presets
export const CHART_HEIGHTS = {
  small: 200,
  medium: 300,
  large: 400,
  xlarge: 500,
};