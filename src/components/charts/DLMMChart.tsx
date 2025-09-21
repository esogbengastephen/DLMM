'use client';

import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Cell,
} from 'recharts';

export interface DLMMBinData {
  binId: number;
  price: number;
  liquidity: number;
  volume24h: number;
  fees24h: number;
  isActive?: boolean;
  tokenXAmount?: number;
  tokenYAmount?: number;
}

export interface DLMMPoolData {
  timestamp: string;
  price: number;
  volume: number;
  tvl: number;
  fees: number;
  apr: number;
}

interface DLMMChartProps {
  type: 'liquidity' | 'performance' | 'bins';
  data: DLMMBinData[] | DLMMPoolData[];
  height?: number;
  activePrice?: number;
  priceRange?: [number, number];
}

const DLMMChart: React.FC<DLMMChartProps> = ({
  type,
  data,
  height = 300,
  activePrice,
  priceRange,
}) => {
  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toFixed(4)}`;
    }
    return `$${price.toFixed(8)}`;
  };

  const formatLiquidity = (liquidity: number) => {
    if (liquidity >= 1000000) {
      return `$${(liquidity / 1000000).toFixed(1)}M`;
    } else if (liquidity >= 1000) {
      return `$${(liquidity / 1000).toFixed(1)}K`;
    }
    return `$${liquidity.toFixed(0)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`;
    }
    return `$${volume.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    if (type === 'bins') {
      return (
        <div className="bg-[#2a2b33] border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-1">
            Bin ID: {data.binId}
          </p>
          <p className="text-white font-semibold">
            Price: {formatPrice(data.price)}
          </p>
          <p className="text-[#00d4aa] text-sm">
            Liquidity: {formatLiquidity(data.liquidity)}
          </p>
          <p className="text-blue-400 text-sm">
            Volume 24h: {formatVolume(data.volume24h)}
          </p>
          <p className="text-yellow-400 text-sm">
            Fees 24h: {formatVolume(data.fees24h)}
          </p>
          {data.isActive && (
            <p className="text-green-400 text-xs mt-1 font-semibold">
              ● Active Bin
            </p>
          )}
        </div>
      );
    }

    if (type === 'performance') {
      return (
        <div className="bg-[#2a2b33] border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-1">
            {new Date(label).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p className="text-white font-semibold">
            Price: {formatPrice(data.price)}
          </p>
          <p className="text-[#00d4aa] text-sm">
            TVL: {formatLiquidity(data.tvl)}
          </p>
          <p className="text-blue-400 text-sm">
            Volume: {formatVolume(data.volume)}
          </p>
          <p className="text-yellow-400 text-sm">
            APR: {data.apr.toFixed(2)}%
          </p>
        </div>
      );
    }

    return null;
  };

  // Liquidity Distribution Chart (Bins)
  if (type === 'bins') {
    const binData = data as DLMMBinData[];
    
    return (
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={binData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="price"
              tickFormatter={formatPrice}
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tickFormatter={formatLiquidity}
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="liquidity" radius={[2, 2, 0, 0]}>
              {binData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isActive ? '#00d4aa' : '#4f46e5'}
                  opacity={entry.isActive ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Pool Performance Chart
  if (type === 'performance') {
    const poolData = data as DLMMPoolData[];
    
    return (
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={poolData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                });
              }}
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="left"
              tickFormatter={formatPrice}
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tickFormatter={formatVolume}
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              yAxisId="right"
              dataKey="volume" 
              fill="#4f46e5" 
              opacity={0.3}
              radius={[2, 2, 0, 0]}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="price"
              stroke="#00d4aa"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#00d4aa', strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Liquidity Overview Chart
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="price"
            tickFormatter={formatPrice}
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tickFormatter={formatLiquidity}
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="liquidity" 
            fill="#4f46e5" 
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DLMMChart;