'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Filter, Search, Wifi, WifiOff, Plus } from 'lucide-react';
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

interface Order {
  id: string;
  pair: string;
  type: 'limit' | 'stop';
  side: 'buy' | 'sell';
  amount: number;
  triggerPrice: number;
  status: 'pending' | 'filled' | 'cancelled';
  createdAt: string;
}

const mockOrders: Order[] = [
  {
    id: '1',
    pair: 'SOL/USDC',
    type: 'limit',
    side: 'buy',
    amount: 10,
    triggerPrice: 95.50,
    status: 'pending',
    createdAt: '2024-01-15 10:30'
  },
  {
    id: '2',
    pair: 'WBTC/USDC',
    type: 'stop',
    side: 'sell',
    amount: 0.5,
    triggerPrice: 42000,
    status: 'filled',
    createdAt: '2024-01-14 15:45'
  }
];

const OrdersPage: React.FC = () => {
  const { connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'limit' | 'stop'>('limit');
  const [orders] = useState<Order[]>(mockOrders);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'filled' | 'pending' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
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

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'filled':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-500/20 text-yellow-500`;
      case 'filled':
        return `${baseClasses} bg-green-500/20 text-green-500`;
      case 'cancelled':
        return `${baseClasses} bg-red-500/20 text-red-500`;
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold mb-4">Orders Management</h1>
            <p className="text-text-secondary mb-8">
              Connect your wallet to view and manage your orders
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
              <h1 className="text-3xl font-bold mb-2">Order Management</h1>
              <p className="text-text-secondary">
                Create and manage your trading orders
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
          {/* Create Order Section */}
          <div className="lg:col-span-1">
            <div className="bg-card-background border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-accent" />
                Create Order
              </h2>

              {/* Order Type Tabs */}
              <div className="flex mb-6 bg-background rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('limit')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'limit'
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:text-foreground'
                  }`}
                >
                  Limit Order
                </button>
                <button
                  onClick={() => setActiveTab('stop')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'stop'
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:text-foreground'
                  }`}
                >
                  Stop Order
                </button>
              </div>

              {/* Order Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Token Pair</label>
                  <select className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground">
                    <option>SOL/USDC</option>
                    <option>BTC/USDC</option>
                    <option>ETH/USDC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Trigger Price</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  </div>
                </div>

                <button className="w-full bg-accent hover:bg-accent/90 text-white py-3 rounded-lg font-medium transition-colors">
                  Create {activeTab === 'limit' ? 'Limit' : 'Stop'} Order
                </button>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="lg:col-span-2">
            <div className="bg-card-background border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Active Orders</h2>

              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-background border border-border rounded-lg p-4 hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {order.side === 'buy' ? (
                          <TrendingUp className="w-5 h-5 text-green-500" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-500" />
                        )}
                        <span className="font-semibold">{order.pair}</span>
                        <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                          {order.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span className={getStatusBadge(order.status)}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-text-secondary">Amount:</span>
                        <div className="font-medium">{order.amount}</div>
                      </div>
                      <div>
                        <span className="text-text-secondary">Trigger Price:</span>
                        <div className="font-medium">${order.triggerPrice.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-text-secondary">Side:</span>
                        <div className={`font-medium ${
                          order.side === 'buy' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {order.side.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <span className="text-text-secondary">Created:</span>
                        <div className="font-medium">{order.createdAt}</div>
                      </div>
                    </div>

                    {order.status === 'pending' && (
                      <div className="flex space-x-2 mt-4">
                        <button className="px-3 py-1 bg-accent/20 text-accent rounded text-sm hover:bg-accent/30 transition-colors">
                          Edit
                        </button>
                        <button className="px-3 py-1 bg-red-500/20 text-red-500 rounded text-sm hover:bg-red-500/30 transition-colors">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {orders.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-text-secondary">No orders found</p>
                  <p className="text-sm text-text-secondary mt-1">
                    Create your first order to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;