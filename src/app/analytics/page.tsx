'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { TrendingUp, BarChart3, PieChart, Activity, DollarSign, Target, Calendar, Play, Wifi, WifiOff } from 'lucide-react';
import { useRealTimePositions } from '@/hooks/useRealTimePositions';
import { useActivityFeed } from '@/hooks/useActivityFeed';

// Dynamic import to prevent SSR hydration mismatch
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => ({ default: mod.WalletMultiButton })),
  {
    ssr: false,
    loading: () => (
      <button className="bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-lg font-medium">
        Loading Wallet...
      </button>
    ),
  }
);

interface ChartData {
  date: string;
  portfolioValue: number;
  feesEarned: number;
  hodlValue: number;
}

interface StrategyResult {
  strategy: string;
  estimatedPnL: number;
  timeframe: string;
  successRate: number;
  maxDrawdown: number;
}

const mockChartData: ChartData[] = [
  { date: 'Jan', portfolioValue: 10000, feesEarned: 120, hodlValue: 9800 },
  { date: 'Feb', portfolioValue: 10500, feesEarned: 180, hodlValue: 10200 },
  { date: 'Mar', portfolioValue: 11200, feesEarned: 250, hodlValue: 10800 },
  { date: 'Apr', portfolioValue: 10800, feesEarned: 320, hodlValue: 10500 },
  { date: 'May', portfolioValue: 11800, feesEarned: 420, hodlValue: 11200 },
  { date: 'Jun', portfolioValue: 12100, feesEarned: 480, hodlValue: 11600 },
  { date: 'Jul', portfolioValue: 12345, feesEarned: 520, hodlValue: 11800 }
];

const mockStrategies = [
  'Conservative Range',
  'Narrow Bins',
  'Wide Range',
  'Dynamic Rebalancing',
  'Trend Following'
];

const AnalyticsPage: React.FC = () => {
  const { connected } = useWallet();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedStrategy, setSelectedStrategy] = useState('Narrow Bins');
  const [simulationResult, setSimulationResult] = useState<StrategyResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Real-time hooks
  const {
    connectionStatus,
    isSubscribed,
    updates,
    getRecentUpdates
  } = useRealTimePositions();
  
  const {
    activities,
    loading: activityLoading,
    error: activityError,
    isConnected: activityConnected,
    hasRealTimeData
  } = useActivityFeed();

  // Update timestamp when real-time data changes
  useEffect(() => {
    if (updates.length > 0 || activities.length > 0) {
      setLastUpdated(new Date());
    }
  }, [updates, activities]);

  const currentData = mockChartData[mockChartData.length - 1];
  const previousData = mockChartData[mockChartData.length - 2];
  const portfolioChange = ((currentData.portfolioValue - previousData.portfolioValue) / previousData.portfolioValue) * 100;
  const feesChange = ((currentData.feesEarned - previousData.feesEarned) / previousData.feesEarned) * 100;

  const runSimulation = () => {
    setIsSimulating(true);
    // Simulate API call
    setTimeout(() => {
      setSimulationResult({
        strategy: selectedStrategy,
        estimatedPnL: 1234,
        timeframe: '30 days',
        successRate: 78.5,
        maxDrawdown: -5.2
      });
      setIsSimulating(false);
    }, 2000);
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold mb-4">Analytics</h1>
            <p className="text-text-secondary mb-8">
              Connect your wallet to view detailed analytics and performance metrics
            </p>
            <WalletMultiButton className="!bg-accent hover:!bg-accent/90" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Analytics</h1>
              <p className="text-text-secondary">
                Comprehensive performance analysis and strategy simulation
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className={connectionStatus.isConnected ? 'text-green-400' : 'text-red-400'}>
                  {connectionStatus.isConnected ? 'Live' : 'Disconnected'}
                </span>
                {isSubscribed && (
                  <span className="text-text-secondary">
                    ({connectionStatus.subscriptionCount} subscriptions)
                  </span>
                )}
              </div>
              <span className="text-text-secondary">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Portfolio Value</h3>
              <DollarSign className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl font-bold">${currentData.portfolioValue.toLocaleString()}</p>
            <p className={`text-sm mt-1 ${
              portfolioChange >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {portfolioChange >= 0 ? '+' : ''}{portfolioChange.toFixed(1)}% this month
            </p>
          </div>

          <div className="bg-card-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Fees Earned</h3>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">${currentData.feesEarned}</p>
            <p className={`text-sm mt-1 ${
              feesChange >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              +{feesChange.toFixed(1)}% vs HODL
            </p>
          </div>

          <div className="bg-card-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Success Rate</h3>
              <Target className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl font-bold">87.3%</p>
            <p className="text-sm text-green-500 mt-1">Above average</p>
          </div>

          <div className="bg-card-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Sharpe Ratio</h3>
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl font-bold">2.14</p>
            <p className="text-sm text-green-500 mt-1">Excellent</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Value Chart */}
            <div className="bg-card-background border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-accent" />
                  Portfolio Performance
                </h2>
                <div className="flex space-x-2">
                  {(['7d', '30d', '90d', '1y'] as const).map((timeframe) => (
                    <button
                      key={timeframe}
                      onClick={() => setSelectedTimeframe(timeframe)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        selectedTimeframe === timeframe
                          ? 'bg-accent text-white'
                          : 'text-text-secondary hover:text-foreground'
                      }`}
                    >
                      {timeframe}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simplified Chart Placeholder */}
              <div className="h-64 bg-background rounded-lg p-4 flex items-end justify-between">
                {mockChartData.map((data, index) => (
                  <div key={data.date} className="flex flex-col items-center">
                    <div
                      className="bg-gradient-to-t from-accent to-accent/50 rounded-t w-8 mb-2"
                      style={{
                        height: `${(data.portfolioValue / 15000) * 200}px`
                      }}
                    ></div>
                    <span className="text-xs text-text-secondary">{data.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fees vs HODL Comparison */}
            <div className="bg-card-background border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-accent" />
                Fees Earned vs. HODL Baseline
              </h2>

              <div className="h-48 bg-background rounded-lg p-4 flex items-end justify-between">
                {mockChartData.map((data, index) => (
                  <div key={data.date} className="flex flex-col items-center space-y-1">
                    <div className="flex flex-col items-center">
                      <div
                        className="bg-accent rounded-t w-6"
                        style={{
                          height: `${(data.feesEarned / 600) * 120}px`
                        }}
                      ></div>
                      <div
                        className="bg-text-secondary/30 rounded-t w-6"
                        style={{
                          height: `${((data.portfolioValue - data.hodlValue) / 600) * 120}px`
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-text-secondary">{data.date}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center space-x-6 mt-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-accent rounded mr-2"></div>
                  <span className="text-sm text-text-secondary">Fees Earned</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-text-secondary/30 rounded mr-2"></div>
                  <span className="text-sm text-text-secondary">vs HODL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Strategy Simulator */}
            <div className="bg-card-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-accent" />
                Strategy Simulator
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Strategy</label>
                  <select
                    value={selectedStrategy}
                    onChange={(e) => setSelectedStrategy(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                  >
                    {mockStrategies.map((strategy) => (
                      <option key={strategy} value={strategy}>
                        {strategy}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={runSimulation}
                  disabled={isSimulating}
                  className="w-full bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {isSimulating ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-pulse" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Simulation
                    </>
                  )}
                </button>

                {simulationResult && (
                  <div className="bg-background border border-border rounded-lg p-4 mt-4">
                    <h4 className="font-medium mb-3">Simulation Results</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Strategy:</span>
                        <span className="font-medium">{simulationResult.strategy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Estimated PnL:</span>
                        <span className="font-medium text-green-500">${simulationResult.estimatedPnL}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Timeframe:</span>
                        <span className="font-medium">{simulationResult.timeframe}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Success Rate:</span>
                        <span className="font-medium">{simulationResult.successRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Max Drawdown:</span>
                        <span className="font-medium text-red-400">{simulationResult.maxDrawdown}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Risk Metrics */}
            <div className="bg-card-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Risk Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Max Drawdown</span>
                  <span className="font-medium text-red-400">-8.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Volatility</span>
                  <span className="font-medium">12.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Beta</span>
                  <span className="font-medium">0.85</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">VaR (95%)</span>
                  <span className="font-medium text-red-400">-$245</span>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-card-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total Return</span>
                  <span className="font-medium text-green-500">+23.45%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Annualized Return</span>
                  <span className="font-medium text-green-500">+18.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Win Rate</span>
                  <span className="font-medium">73.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Avg Trade</span>
                  <span className="font-medium text-green-500">+$12.50</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-background hover:bg-background/80 border border-border text-foreground py-2 rounded-lg text-sm transition-colors">
                  Export Report
                </button>
                <button className="w-full bg-background hover:bg-background/80 border border-border text-foreground py-2 rounded-lg text-sm transition-colors">
                  Compare Strategies
                </button>
                <button className="w-full bg-background hover:bg-background/80 border border-border text-foreground py-2 rounded-lg text-sm transition-colors">
                  Set Alerts
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;