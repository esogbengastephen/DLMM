'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { Star, Lock, TrendingUp, TrendingDown, Award, Target, DollarSign, Activity, Wifi, WifiOff } from 'lucide-react';
import { useRealTimePositions } from '@/hooks/useRealTimePositions';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';

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

interface Position {
  id: string;
  pair: string;
  liquidity: number;
  currentBinRange: string;
  apr: number;
  feesEarned: number;
  isFavorite: boolean;
  isLocked: boolean;
  status: 'active' | 'inactive';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  icon: string;
}

const mockPositions: Position[] = [
  {
    id: '1',
    pair: 'SOL/USDC',
    liquidity: 5420.30,
    currentBinRange: '95.2 - 98.7',
    apr: 12.5,
    feesEarned: 45.20,
    isFavorite: true,
    isLocked: false,
    status: 'active'
  },
  {
    id: '2',
    pair: 'BONK/SOL',
    liquidity: 8750.00,
    currentBinRange: '0.000025 - 0.000028',
    apr: 18.9,
    feesEarned: 78.50,
    isFavorite: true,
    isLocked: false,
    status: 'active'
  },
  {
    id: '3',
    pair: 'RAY/USDC',
    liquidity: 3200.15,
    currentBinRange: '1.85 - 2.15',
    apr: 22.3,
    feesEarned: 32.10,
    isFavorite: false,
    isLocked: true,
    status: 'active'
  }
];

const mockAchievements: Achievement[] = [
  { id: '1', title: 'First LP', description: 'Created your first liquidity position', earned: true, icon: '🎯' },
  { id: '2', title: 'Fee Hunter', description: 'Earned over $100 in fees', earned: true, icon: '💰' },
  { id: '3', title: 'Diamond Hands', description: 'Held position for 30+ days', earned: true, icon: '💎' },
  { id: '4', title: 'Diversified', description: 'Active in 5+ pairs', earned: false, icon: '🌟' },
  { id: '5', title: 'High Roller', description: 'Provided $10k+ liquidity', earned: true, icon: '🚀' },
  { id: '6', title: 'Rebalancer', description: 'Completed 10+ rebalances', earned: false, icon: '⚖️' }
];

const PortfolioPage: React.FC = () => {
  const { connected } = useWallet();
  const [positions] = useState<Position[]>(mockPositions);
  const [achievements] = useState<Achievement[]>(mockAchievements);
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

  const {
    totalLiquidityFormatted,
    feesEarnedFormatted,
    activePositionsCount,
    loading: portfolioLoading,
    error: portfolioError,
    lastUpdated: portfolioLastUpdated,
    refresh: refreshPortfolio
  } = usePortfolioValue();

  // Update timestamp when real-time data changes
  useEffect(() => {
    if (updates.length > 0 || activities.length > 0 || portfolioLastUpdated) {
      setLastUpdated(portfolioLastUpdated || new Date());
    }
  }, [updates, activities, portfolioLastUpdated]);

  const totalLiquidity = positions.reduce((sum, pos) => sum + pos.liquidity, 0);
  const totalFees = positions.reduce((sum, pos) => sum + pos.feesEarned, 0);
  const avgAPR = positions.reduce((sum, pos) => sum + pos.apr, 0) / positions.length;
  const activePositions = positions.filter(pos => pos.status === 'active').length;

  if (!connected) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold mb-4">Portfolio Overview</h1>
            <p className="text-text-secondary mb-8">
              Connect your wallet to view your liquidity positions
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
              <h1 className="text-3xl font-bold mb-2">Portfolio Overview</h1>
              <p className="text-text-secondary">
                Monitor and manage your liquidity positions
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

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Total Liquidity</h3>
              <DollarSign className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl font-bold">
              {portfolioLoading ? "Loading..." : totalLiquidityFormatted}
            </p>
            <p className="text-sm text-green-500 mt-1">+5.2% this week</p>
          </div>

          <div className="bg-card-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Fees Earned</h3>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">
              {portfolioLoading ? "Loading..." : feesEarnedFormatted}
            </p>
            <p className="text-sm text-green-500 mt-1">+12.3% this month</p>
          </div>

          <div className="bg-card-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Active Positions</h3>
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl font-bold">
              {portfolioLoading ? 0 : activePositionsCount}
            </p>
            <p className="text-sm text-text-secondary mt-1">Across {positions.length} pairs</p>
          </div>

          <div className="bg-card-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Avg APR</h3>
              <Target className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl font-bold">{avgAPR.toFixed(1)}%</p>
            <p className="text-sm text-green-500 mt-1">Above market avg</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Positions Table */}
          <div className="lg:col-span-2">
            <div className="bg-card-background border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Liquidity Positions</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-sm font-medium text-text-secondary">PAIR</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-text-secondary">LIQUIDITY</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-text-secondary">BIN RANGE</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-text-secondary">APR</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-text-secondary">FEES EARNED</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-text-secondary">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((position) => (
                      <tr key={position.id} className="border-b border-border/50 hover:bg-background/50">
                        <td className="py-4 px-2">
                          <div className="flex items-center space-x-2">
                            <button className={`${position.isFavorite ? 'text-yellow-500' : 'text-text-secondary'} hover:text-yellow-500`}>
                              <Star className="w-4 h-4" fill={position.isFavorite ? 'currentColor' : 'none'} />
                            </button>
                            <span className="font-medium">{position.pair}</span>
                            {position.isLocked && <Lock className="w-4 h-4 text-text-secondary" />}
                          </div>
                        </td>
                        <td className="py-4 px-2 font-medium">${position.liquidity.toLocaleString()}</td>
                        <td className="py-4 px-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            position.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
                          }`}>
                            {position.currentBinRange}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <span className="text-green-500 font-medium">{position.apr}%</span>
                        </td>
                        <td className="py-4 px-2 font-medium">${position.feesEarned.toFixed(2)}</td>
                        <td className="py-4 px-2">
                          <div className="flex space-x-2">
                            <button className="px-3 py-1 bg-accent/20 text-accent rounded text-sm hover:bg-accent/30 transition-colors">
                              Manage
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Position Insights */}
            <div className="bg-card-background border border-border rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Position Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-text-secondary">Impermanent Loss</p>
                  <p className="text-xl font-bold text-red-400">-2.5%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-text-secondary">Current Value</p>
                  <p className="text-xl font-bold text-foreground">${totalLiquidity.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-text-secondary">Initial Investment</p>
                  <p className="text-xl font-bold text-text-secondary">$14,800.00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Achievements */}
            <div className="bg-card-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-accent" />
                Your Achievements
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`aspect-square rounded-lg flex items-center justify-center text-2xl ${
                      achievement.earned
                        ? 'bg-accent/20 border-2 border-accent'
                        : 'bg-background border border-border opacity-50'
                    }`}
                    title={`${achievement.title}: ${achievement.description}`}
                  >
                    {achievement.icon}
                  </div>
                ))}
              </div>
              <p className="text-sm text-text-secondary mt-3">
                {achievements.filter(a => a.earned).length} of {achievements.length} achievements unlocked
              </p>
            </div>

            {/* Performance Metrics */}
            <div className="bg-card-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total Fees Earned</span>
                  <span className="font-medium text-green-500">${totalFees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Net Profit</span>
                  <span className="font-medium text-green-500">+$95.75</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Active Positions</span>
                  <span className="font-medium">{activePositions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Max APR Achieved</span>
                  <span className="font-medium text-accent">15.8%</span>
                </div>
              </div>
            </div>

            {/* Overall Health */}
            <div className="bg-card-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Overall Health</h3>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-text-secondary">Portfolio Health</span>
                  <span className="font-medium text-green-500">Good</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <button className="w-full bg-accent hover:bg-accent/90 text-white py-2 rounded-lg font-medium transition-colors">
                Boost Liquidity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;