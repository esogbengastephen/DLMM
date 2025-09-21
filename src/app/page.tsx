'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { TrendingUp, TrendingDown, DollarSign, Activity, Zap, BarChart3, Wifi, WifiOff } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { PortfolioSnapshot } from '@/components/dashboard/PortfolioSnapshot';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { PortfolioChart } from '@/components/dashboard/PortfolioChart';
import { WalletDashboard } from '@/components/WalletDashboard';
import { useDLMM } from '@/hooks/useDLMM';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import { useRealTimePositions } from '@/hooks/useRealTimePositions';
import { useActivityFeed } from '@/hooks/useActivityFeed';



export default function Dashboard() {
  const { connected } = useWallet();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // DLMM hooks
  const { positions, pools, loading, error, refreshPositions } = useDLMM();

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
    totalLiquidityUSD,
    feesEarnedUSD,
    activePositionsCount,
    loading: portfolioLoading,
    error: portfolioError,
    refresh: refreshPortfolio
  } = usePortfolioValue();

  // Update timestamp when real-time data changes
  useEffect(() => {
    if (updates.length > 0 || activities.length > 0) {
      setLastUpdated(new Date());
    }
  }, [updates, activities]);

  if (!connected) {
    return (
      <Layout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-text-secondary">
              Your real-time overview of DLMM liquidity and earnings.
            </p>
          </div>
          
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="bg-card-background rounded-lg border border-border p-8 text-center max-w-md">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-text-secondary mb-6">
                Connect your Solana wallet to view your DLMM positions and manage liquidity.
              </p>
              <div className="text-sm text-text-secondary">
                Use the "Connect Wallet" button in the navigation above.
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-text-secondary">
                Welcome to your DLMM trading cockpit
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
          {(error || portfolioError) && (
            <div className="mt-2 text-error text-sm">
              Error: {error || portfolioError}
            </div>
          )}
        </div>

        {/* Real-time Wallet Data */}
        <WalletDashboard />

        <PortfolioSnapshot
          totalLiquidity={portfolioLoading ? "Loading..." : totalLiquidityFormatted}
          feesEarned={portfolioLoading ? "Loading..." : feesEarnedFormatted}
          positionsCount={portfolioLoading ? 0 : activePositionsCount}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RecentActivity activities={activities} />
            <PortfolioChart 
              currentValue={parseFloat(totalLiquidityFormatted.replace(/[$,]/g, '')) || 0}
              loading={loading || portfolioLoading}
            />
          </div>
      </div>
    </Layout>
  );
}
