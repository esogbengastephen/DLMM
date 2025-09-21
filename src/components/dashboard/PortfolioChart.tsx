import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface PortfolioDataPoint {
  timestamp: string;
  value: number;
  formattedTime: string;
  date: Date;
}

interface PortfolioChartProps {
  currentValue: number;
  loading?: boolean;
  timeRange?: '1H' | '24H' | '7D' | '30D';
}

export const PortfolioChart: React.FC<PortfolioChartProps> = ({
  currentValue,
  loading = false,
  timeRange = '24H'
}) => {
  const [data, setData] = useState<PortfolioDataPoint[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  // Generate mock historical data based on current value
  const generateMockData = (range: string, currentVal: number): PortfolioDataPoint[] => {
    const now = new Date();
    const points: PortfolioDataPoint[] = [];
    let intervals: number;
    let stepMs: number;

    switch (range) {
      case '1H':
        intervals = 12; // 5-minute intervals
        stepMs = 5 * 60 * 1000;
        break;
      case '24H':
        intervals = 24; // 1-hour intervals
        stepMs = 60 * 60 * 1000;
        break;
      case '7D':
        intervals = 14; // 12-hour intervals
        stepMs = 12 * 60 * 60 * 1000;
        break;
      case '30D':
        intervals = 30; // 1-day intervals
        stepMs = 24 * 60 * 60 * 1000;
        break;
      default:
        intervals = 24;
        stepMs = 60 * 60 * 1000;
    }

    // Generate data points with some realistic variation
    for (let i = intervals; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * stepMs));
      
      // Create some realistic price movement
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const trendFactor = (intervals - i) / intervals * 0.05; // Slight upward trend
      const value = currentVal * (1 + variation + trendFactor);
      
      points.push({
        timestamp: timestamp.toISOString(),
        value: Math.max(0, value),
        formattedTime: formatTimeForRange(timestamp, range),
        date: timestamp
      });
    }

    return points;
  };

  const formatTimeForRange = (date: Date, range: string): string => {
    switch (range) {
      case '1H':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      case '24H':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      case '7D':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      case '30D':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      default:
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
    }
  };

  // Update data when currentValue or timeRange changes
  useEffect(() => {
    if (currentValue > 0) {
      const newData = generateMockData(selectedTimeRange, currentValue);
      setData(newData);
    }
  }, [currentValue, selectedTimeRange]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm">{data.formattedTime}</p>
          <p className="text-white font-semibold">
            ${payload[0].value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate percentage change
  const getPercentageChange = (): { change: number; isPositive: boolean } => {
    if (data.length < 2) return { change: 0, isPositive: true };
    
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const change = ((lastValue - firstValue) / firstValue) * 100;
    
    return {
      change: Math.abs(change),
      isPositive: change >= 0
    };
  };

  const { change, isPositive } = getPercentageChange();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-text-secondary">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Portfolio Value</CardTitle>
            <div className="mt-2">
              <div className="text-2xl font-bold text-white">
                ${currentValue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
              <div className={`text-sm flex items-center gap-1 ${
                isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
                <span>{isPositive ? '↗' : '↘'}</span>
                <span>{change.toFixed(2)}% ({selectedTimeRange})</span>
              </div>
            </div>
          </div>
          
          {/* Time range selector */}
          <div className="flex gap-1">
            {['1H', '24H', '7D', '30D'].map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range as any)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  selectedTimeRange === range
                    ? 'bg-[#00d4aa] text-black'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="formattedTime"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#00d4aa"
                  strokeWidth={2}
                  fill="url(#portfolioGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#00d4aa' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-text-secondary">
              No data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};