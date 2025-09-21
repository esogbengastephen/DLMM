'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { Wallet, Copy, ExternalLink, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useWalletStatus } from '@/hooks/useWalletStatus';
import { useWalletData } from '@/hooks/useWalletData';

// Dynamically import WalletMultiButton to prevent SSR hydration mismatch
const DynamicWalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => ({ default: mod.WalletMultiButton })),
  { 
    ssr: false,
    loading: () => (
      <button className="!bg-accent !text-black !font-medium !px-4 !py-2 !rounded-lg !text-sm hover:!bg-accent/90 !transition-colors !border-none">
        Loading...
      </button>
    )
  }
);

export const WalletConnection: React.FC = () => {
  const { disconnect } = useWallet();
  const {
    connected,
    connecting,
    publicKey,
    balance,
    balanceLoading,
    error,
    refreshBalance,
    copyAddress,
    openExplorer,
    formatAddress,
  } = useWalletStatus();
  
  const {
    portfolioData,
    isLoading: portfolioLoading,
    error: portfolioError,
    autoRefreshEnabled,
  } = useWalletData();
  
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');

  const handleCopyAddress = async () => {
    try {
      await copyAddress();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleRefreshBalance = async () => {
    try {
      await refreshBalance();
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    }
  };

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      setConnectionStatus(navigator.onLine ? 'online' : 'offline');
    };

    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    checkConnection();

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  if (!connected) {
    return (
      <div className="flex items-center space-x-3">
        <DynamicWalletMultiButton className="!bg-accent !text-black !font-medium !px-4 !py-2 !rounded-lg !text-sm hover:!bg-accent/90 !transition-colors !border-none" />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Wallet Info Card */}
      <div className="bg-card-background border border-border rounded-lg px-3 py-2 flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            connectionStatus === 'online' && connected ? 'bg-success' : 'bg-error'
          }`}></div>
          <Wallet className="w-4 h-4 text-accent" />
          {connectionStatus === 'offline' && (
            <div title="No internet connection">
              <WifiOff className="w-3 h-3 text-error" />
            </div>
          )}
          {autoRefreshEnabled && connectionStatus === 'online' && (
            <div title="Auto-refresh enabled">
              <Wifi className="w-3 h-3 text-success" />
            </div>
          )}
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className="text-foreground text-sm font-medium">
              {publicKey ? formatAddress(publicKey.toString()) : 'Unknown'}
            </span>
            <button
              onClick={handleCopyAddress}
              className="text-text-secondary hover:text-foreground transition-colors"
              title="Copy address"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={openExplorer}
              className="text-text-secondary hover:text-foreground transition-colors"
              title="View on Solana Explorer"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={handleRefreshBalance}
              className="text-text-secondary hover:text-foreground transition-colors"
              title="Refresh balance"
              disabled={balanceLoading}
            >
              <RefreshCw className={`w-3 h-3 ${balanceLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              {balanceLoading || portfolioLoading ? (
                <span className="text-text-secondary text-xs">Loading...</span>
              ) : error || portfolioError ? (
                <div className="flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 text-error" />
                  <span className="text-error text-xs">
                    {error || portfolioError || 'Connection error'}
                  </span>
                </div>
              ) : (
                <span className="text-accent text-xs font-medium">
                  {balance !== null ? `${balance.toFixed(4)} SOL` : '0.0000 SOL'}
                </span>
              )}
            </div>
            
            {/* Portfolio Value */}
            {portfolioData && portfolioData.totalValue > 0 && !portfolioLoading && (
              <div className="text-xs text-text-secondary">
                Portfolio: ${portfolioData.totalValue.toFixed(2)}
                {portfolioData.totalChangePercent24h !== 0 && (
                  <span className={`ml-1 ${
                    portfolioData.totalChangePercent24h >= 0 ? 'text-success' : 'text-error'
                  }`}>
                    ({portfolioData.totalChangePercent24h >= 0 ? '+' : ''}{portfolioData.totalChangePercent24h.toFixed(1)}%)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disconnect Button */}
      <button
        onClick={disconnect}
        className="bg-error hover:bg-error/90 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        title="Disconnect wallet"
      >
        Disconnect
      </button>

      {/* Copy Feedback */}
      {copied && (
        <div className="absolute top-16 right-4 bg-success text-white px-3 py-1 rounded-lg text-sm animate-fade-in-out">
          Address copied!
        </div>
      )}
    </div>
  );
};