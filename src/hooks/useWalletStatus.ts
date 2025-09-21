'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

export interface WalletStatus {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  balance: number | null;
  balanceLoading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  copyAddress: () => Promise<void>;
  openExplorer: () => void;
  formatAddress: (address: string) => string;
}

export const useWalletStatus = (): WalletStatus => {
  const { connected, connecting, publicKey, disconnect } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = useCallback(async () => {
    if (!connected || !publicKey) {
      setBalance(null);
      return;
    }

    try {
      setBalanceLoading(true);
      setError(null);
      const balanceInLamports = await connection.getBalance(publicKey);
      setBalance(balanceInLamports / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to fetch balance');
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, [connected, publicKey, connection]);

  const copyAddress = useCallback(async () => {
    if (publicKey) {
      try {
        await navigator.clipboard.writeText(publicKey.toString());
      } catch (err) {
        console.error('Failed to copy address:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = publicKey.toString();
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  }, [publicKey]);

  const openExplorer = useCallback(() => {
    if (publicKey) {
      const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta' ? '' : '?cluster=devnet';
      window.open(`https://explorer.solana.com/address/${publicKey.toString()}${network}`, '_blank');
    }
  }, [publicKey]);

  const formatAddress = useCallback((address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, []);

  // Auto-refresh balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      refreshBalance();
      
      // Set up interval to refresh balance every 30 seconds
      const interval = setInterval(refreshBalance, 30000);
      return () => clearInterval(interval);
    } else {
      setBalance(null);
      setError(null);
    }
  }, [connected, publicKey, refreshBalance]);

  // Clear error when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setError(null);
      setBalance(null);
    }
  }, [connected]);

  return {
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
  };
};