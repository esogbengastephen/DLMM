'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

export interface PortfolioDataPoint {
  timestamp: string;
  date: string;
  value: number;
  change: number;
  volume?: number;
}

interface PortfolioChartProps {
  data: PortfolioDataPoint[];
  height?: number;
  showArea?: boolean;
  showVolume?: boolean;
  timeframe?: '1D' | '7D' | '30D' | '90D' | '1Y' | 'ALL';
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({
  data,
  height = 300,
  showArea = true,
  showVolume = false,
  timeframe = '30D',
}) => {
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
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
          day: 'numeric' 
        });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const value = payload[0].value;
      const change = data.change;
      
      return (
        <div className="bg-[#2a2b33] border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-1">
            {new Date(label).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p className="text-white font-semibold text-lg">
            {formatValue(value)}
          </p>
          <p className={`text-sm ${
            change >= 0 ? 'text-[#00d4aa]' : 'text-red-400'
          }`}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </p>
          {showVolume && data.volume && (
            <p className="text-gray-400 text-sm mt-1">
              Volume: {formatValue(data.volume)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const isPositive = data.length > 0 && data[data.length - 1].value > data[0].value;

  if (showArea) {
    return (
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={isPositive ? '#00d4aa' : '#ff4444'} 
                  stopOpacity={0.3}
                />
                <stop 
                  offset="95%" 
                  stopColor={isPositive ? '#00d4aa' : '#ff4444'} 
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              opacity={0.3}
            />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={formatDate}
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tickFormatter={formatValue}
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? '#00d4aa' : '#ff4444'}
              strokeWidth={2}
              fill="url(#portfolioGradient)"
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: isPositive ? '#00d4aa' : '#ff4444',
                strokeWidth: 0
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#374151" 
            opacity={0.3}
          />
          <XAxis 
            dataKey="timestamp"
            tickFormatter={formatDate}
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tickFormatter={formatValue}
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={isPositive ? '#00d4aa' : '#ff4444'}
            strokeWidth={2}
            dot={false}
            activeDot={{ 
              r: 4, 
              fill: isPositive ? '#00d4aa' : '#ff4444',
              strokeWidth: 0
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PortfolioChart;