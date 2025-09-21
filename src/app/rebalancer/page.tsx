'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { RefreshCw, Settings, CheckCircle, Clock, AlertTriangle, BarChart3, Zap, TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';
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

interface RebalanceHistory {
  id: string;
  timestamp: string;
  pair: string;
  type: 'manual' | 'auto';
  status: 'completed' | 'pending' | 'failed';
  oldRange: string;
  newRange: string;
  gasUsed: number;
}

interface RebalanceRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  enabled: boolean;
}

const mockHistory: RebalanceHistory[] = [
  {
    id: '1',
    timestamp: '2024-01-15 14:30:00',
    pair: 'SOL/USDC',
    type: 'auto',
    status: 'completed',
    oldRange: '95.2 - 98.7',
    newRange: '96.1 - 99.5',
    gasUsed: 0.002
  },
  {
    id: '2',
    timestamp: '2024-01-15 10:15:00',
    pair: 'WBTC/USDC',
    type: 'manual',
    status: 'completed',
    oldRange: '41.8k - 43.2k',
    newRange: '42.1k - 44.0k',
    gasUsed: 0.003
  },
  {
    id: '3',
    timestamp: '2024-01-14 16:45:00',
    pair: 'WETH/USDC',
    type: 'auto',
    status: 'failed',
    oldRange: '2.4k - 2.6k',
    newRange: '2.5k - 2.7k',
    gasUsed: 0.001
  }
];

const mockRules: RebalanceRule[] = [
  {
    id: '1',
    name: 'Price Deviation',
    condition: 'When price moves outside range',
    threshold: 80,
    enabled: true
  },
  {
    id: '2',
    name: 'Time-based',
    condition: 'Every 24 hours',
    threshold: 24,
    enabled: false
  },
  {
    id: '3',
    name: 'Impermanent Loss',
    condition: 'When IL exceeds threshold',
    threshold: 5,
    enabled: true
  }
];

const RebalancerPage: React.FC = () => {
  const { connected } = useWallet();
  const [autoRebalanceEnabled, setAutoRebalanceEnabled] = useState(true);
  const [history] = useState<RebalanceHistory[]>(mockHistory);
  const [rules, setRules] = useState<RebalanceRule[]>(mockRules);
  const [isRebalancing, setIsRebalancing] = useState(false);
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

  const handleManualRebalance = () => {
    setIsRebalancing(true);
    // Simulate rebalancing process
    setTimeout(() => {
      setIsRebalancing(false);
    }, 3000);
  };

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const getStatusIcon = (status: RebalanceHistory['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: RebalanceHistory['status']) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-500/20 text-green-500`;
      case 'pending':
        return `${baseClasses} bg-yellow-500/20 text-yellow-500`;
      case 'failed':
        return `${baseClasses} bg-red-500/20 text-red-500`;
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold mb-4">Rebalancer</h1>
            <p className="text-text-secondary mb-8">
              Connect your wallet to access rebalancing features
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
              <h1 className="text-3xl font-bold mb-2">Auto Rebalancer</h1>
              <p className="text-text-secondary">
                Automated portfolio rebalancing for optimal returns
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Rebalancing Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Manual Rebalance */}
            <div className="bg-card-background border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <RefreshCw className="w-5 h-5 mr-2 text-accent" />
                Manual Rebalance
              </h2>
              
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Rebalance Your Positions</h3>
                  <p className="text-text-secondary max-w-md mx-auto">
                    Rebalance your position to optimize your returns based on current market conditions
                  </p>
                </div>
                
                <button
                  onClick={handleManualRebalance}
                  disabled={isRebalancing}
                  className="bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center mx-auto"
                >
                  {isRebalancing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Rebalancing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Rebalance Now
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Auto-Rebalancer Settings */}
            <div className="bg-card-background border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-accent" />
                  Auto-Rebalancer
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-text-secondary">Demo Mode</span>
                  <button
                    onClick={() => setAutoRebalanceEnabled(!autoRebalanceEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoRebalanceEnabled ? 'bg-accent' : 'bg-background border border-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoRebalanceEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="bg-background border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{rule.name}</h3>
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          rule.enabled ? 'bg-accent' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            rule.enabled ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-sm text-text-secondary mb-2">{rule.condition}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-text-secondary">Threshold:</span>
                      <span className="text-xs font-medium">{rule.threshold}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Rebalancing History */}
            <div className="bg-card-background border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-accent" />
                Recent Rebalancing
              </h2>

              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="bg-background border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(item.status)}
                        <span className="font-medium">{item.pair}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.type === 'auto' ? 'bg-accent/20 text-accent' : 'bg-blue-500/20 text-blue-500'
                        }`}>
                          {item.type.toUpperCase()}
                        </span>
                      </div>
                      <span className={getStatusBadge(item.status)}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-text-secondary">Old Range:</span>
                        <div className="font-medium">{item.oldRange}</div>
                      </div>
                      <div>
                        <span className="text-text-secondary">New Range:</span>
                        <div className="font-medium">{item.newRange}</div>
                      </div>
                      <div>
                        <span className="text-text-secondary">Gas Used:</span>
                        <div className="font-medium">{item.gasUsed} SOL</div>
                      </div>
                      <div>
                        <span className="text-text-secondary">Time:</span>
                        <div className="font-medium">{new Date(item.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rebalancing Stats */}
            <div className="bg-card-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Rebalancing Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total Rebalances</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Success Rate</span>
                  <span className="font-medium text-green-500">91.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Gas Saved</span>
                  <span className="font-medium text-accent">0.045 SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Avg Time</span>
                  <span className="font-medium">2.3s</span>
                </div>
              </div>
            </div>

            {/* Strategy Performance */}
            <div className="bg-card-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Strategy Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-text-secondary">Efficiency Score</span>
                    <span className="font-medium text-accent">8.7/10</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div className="bg-accent h-2 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-sm text-text-secondary mb-2">Optimization Suggestions:</p>
                  <ul className="text-xs text-text-secondary space-y-1">
                    <li>• Consider tighter ranges for SOL/USDC</li>
                    <li>• Enable time-based rebalancing</li>
                    <li>• Adjust IL threshold to 3%</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-background hover:bg-background/80 border border-border text-foreground py-2 rounded-lg text-sm transition-colors">
                  View All History
                </button>
                <button className="w-full bg-background hover:bg-background/80 border border-border text-foreground py-2 rounded-lg text-sm transition-colors">
                  Export Report
                </button>
                <button className="w-full bg-background hover:bg-background/80 border border-border text-foreground py-2 rounded-lg text-sm transition-colors">
                  Strategy Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RebalancerPage;