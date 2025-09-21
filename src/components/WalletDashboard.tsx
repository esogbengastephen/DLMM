'use client';

import React, { useState } from 'react';
import { useWalletData } from '@/hooks/useWalletData';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Settings, 
  Eye, 
  EyeOff,
  AlertCircle,
  Clock,
  DollarSign,
  Activity
} from 'lucide-react';

interface WalletDashboardProps {
  className?: string;
}

export const WalletDashboard: React.FC<WalletDashboardProps> = ({ className = '' }) => {
  const {
    connected,
    connecting,
    publicKey,
    portfolioData,
    isLoading,
    error,
    refreshData,
    autoRefreshEnabled,
    toggleAutoRefresh,
    refreshInterval,
    setRefreshInterval,
  } = useWalletData();

  const [showSettings, setShowSettings] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState(refreshInterval);

  const formatCurrency = (value: number) => {
    if (hideBalances) return '****';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatTokenAmount = (amount: number, decimals: number = 4) => {
    if (hideBalances) return '****';
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const handleIntervalChange = (newInterval: number) => {
    setSelectedInterval(newInterval);
    setRefreshInterval(newInterval);
  };

  if (!connected) {
    return (
      <div className={`bg-card-background border border-border rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center text-center">
          <div>
            <Wallet className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Wallet Not Connected</h3>
            <p className="text-text-secondary text-sm">
              Connect your wallet to view real-time portfolio data
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (connecting) {
    return (
      <div className={`bg-card-background border border-border rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-accent animate-spin mr-3" />
          <span className="text-foreground">Connecting wallet...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card-background border border-border rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
            <h2 className="text-xl font-bold text-foreground">Portfolio Overview</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setHideBalances(!hideBalances)}
              className="p-2 text-text-secondary hover:text-foreground transition-colors rounded-lg hover:bg-background"
              title={hideBalances ? 'Show balances' : 'Hide balances'}
            >
              {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="p-2 text-text-secondary hover:text-foreground transition-colors rounded-lg hover:bg-background disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-text-secondary hover:text-foreground transition-colors rounded-lg hover:bg-background"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-background rounded-lg border border-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Auto-refresh</span>
                <button
                  onClick={toggleAutoRefresh}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    autoRefreshEnabled
                      ? 'bg-success text-white'
                      : 'bg-text-secondary text-background'
                  }`}
                >
                  {autoRefreshEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              
              {autoRefreshEnabled && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Refresh interval
                  </label>
                  <select
                    value={selectedInterval}
                    onChange={(e) => handleIntervalChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value={5000}>5 seconds</option>
                    <option value={15000}>15 seconds</option>
                    <option value={30000}>30 seconds</option>
                    <option value={60000}>1 minute</option>
                    <option value={300000}>5 minutes</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 mx-6 mt-4 bg-error/10 border border-error/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-error" />
              <div>
                <span className="text-error text-sm font-medium">
                  {error.includes('timeout') || error.includes('connection') || error.includes('network') 
                    ? 'Connection Error' 
                    : error.includes('Invalid') 
                    ? 'Data Validation Error'
                    : 'Error Loading Portfolio Data'
                  }
                </span>
                <p className="text-error text-xs mt-1">{error}</p>
                {error.includes('timeout') && (
                  <p className="text-error/70 text-xs mt-1">
                    Network request timed out. Auto-retry in progress...
                  </p>
                )}
                {error.includes('Invalid') && (
                  <p className="text-error/70 text-xs mt-1">
                    Please check your wallet connection and try again.
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="px-3 py-1 bg-error/20 hover:bg-error/30 text-error rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Retrying...' : 'Retry'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Portfolio Summary */}
      {portfolioData && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Total Value */}
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-secondary text-sm">Total Value</span>
                <DollarSign className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {portfolioData ? formatCurrency(portfolioData.totalValue) : '$0.00'}
              </div>
            </div>

            {/* 24h Change */}
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-secondary text-sm">24h Change</span>
                <Activity className="w-4 h-4 text-accent" />
              </div>
              <div className="flex items-center space-x-2">
                <div className={`text-2xl font-bold ${
                  portfolioData && portfolioData.totalChange24h >= 0 ? 'text-success' : 'text-error'
                }`}>
                  {hideBalances ? '****' : portfolioData ? formatCurrency(portfolioData.totalChange24h) : '$0.00'}
                </div>
                <div className={`flex items-center text-sm ${
                  portfolioData && portfolioData.totalChangePercent24h >= 0 ? 'text-success' : 'text-error'
                }`}>
                  {portfolioData && portfolioData.totalChangePercent24h >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {portfolioData ? formatPercentage(portfolioData.totalChangePercent24h) : '0.00%'}
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-secondary text-sm">Last Updated</span>
                <Clock className="w-4 h-4 text-accent" />
              </div>
              <div className="text-sm text-foreground">
                {portfolioData ? portfolioData.lastUpdated.toLocaleTimeString() : '--:--:--'}
              </div>
              <div className="text-xs text-text-secondary">
                {portfolioData ? portfolioData.lastUpdated.toLocaleDateString() : '--/--/----'}
              </div>
            </div>
          </div>

          {/* Token Holdings */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Token Holdings</h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 text-accent animate-spin mr-3" />
                <span className="text-text-secondary">Loading token data...</span>
              </div>
            ) : !portfolioData || !portfolioData.tokens || portfolioData.tokens.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                <p className="text-text-secondary">No tokens found in this wallet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {portfolioData?.tokens?.map((token, index) => (
                  <div key={`${token.mint}-${index}`} className="bg-background rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {token.logoURI ? (
                          <img
                            src={token.logoURI}
                            alt={token.symbol}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                            <span className="text-accent text-xs font-bold">
                              {token.symbol.charAt(0)}
                            </span>
                          </div>
                        )}
                        
                        <div>
                          <div className="font-medium text-foreground">{token.symbol}</div>
                          <div className="text-xs text-text-secondary">
                            {formatTokenAmount(token.uiAmount, token.decimals <= 6 ? token.decimals : 6)} {token.symbol}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-medium text-foreground">
                          {token.value ? formatCurrency(token.value) : 'N/A'}
                        </div>
                        {token.price && (
                          <div className="text-xs text-text-secondary">
                            ${token.price.toFixed(token.price < 1 ? 6 : 2)}
                            {token.priceChange24h !== undefined && (
                              <span className={`ml-1 ${
                                token.priceChange24h >= 0 ? 'text-success' : 'text-error'
                              }`}>
                                ({formatPercentage(token.priceChange24h)})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};