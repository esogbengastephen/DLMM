'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { getTokenService, TokenBalance, TokenPrice } from '@/services/tokenService';
import { 
  isValidSolanaAddress, 
  sanitizeWalletAddress, 
  validateTokenAmount, 
  validatePrice, 
  validatePortfolioData,
  apiRateLimiter,
  secureStorage
} from '@/utils/walletSecurity';

export interface WalletTokenData extends TokenBalance {
  price?: number;
  priceChange24h?: number;
  value?: number;
  logoURI?: string;
}

export interface WalletPortfolioData {
  totalValue: number;
  totalChange24h: number;
  totalChangePercent24h: number;
  tokens: WalletTokenData[];
  lastUpdated: Date;
}

export interface WalletDataStatus {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  solBalance: number | null;
  portfolioData: WalletPortfolioData | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  autoRefreshEnabled: boolean;
  toggleAutoRefresh: () => void;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
}

const DEFAULT_REFRESH_INTERVAL = 30000; // 30 seconds
const MIN_REFRESH_INTERVAL = 5000; // 5 seconds
const MAX_REFRESH_INTERVAL = 300000; // 5 minutes

export const useWalletData = (): WalletDataStatus => {
  const { connected, connecting, publicKey } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [portfolioData, setPortfolioData] = useState<WalletPortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshIntervalState] = useState(DEFAULT_REFRESH_INTERVAL);
  
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const tokenService = getTokenService(connection);

  const refreshData = useCallback(async (isRetry = false) => {
    if (!connected || !publicKey || isRefreshingRef.current) {
      return;
    }

    try {
      isRefreshingRef.current = true;
      setIsLoading(true);
      setError(null);

      // Validate and sanitize wallet address
      const walletAddress = publicKey.toString();
      if (!isValidSolanaAddress(walletAddress)) {
        throw new Error('Invalid wallet address format');
      }
      const sanitizedAddress = sanitizeWalletAddress(walletAddress);
      
      // Check rate limiting
      if (!apiRateLimiter.canMakeCall()) {
        throw new Error('Rate limit exceeded. Please wait before making more requests.');
      }

      // Get SOL balance with timeout
      const solBalancePromise = Promise.race([
        connection.getBalance(publicKey),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('SOL balance fetch timeout')), 10000)
        )
      ]);
      
      const solBalanceInLamports = await solBalancePromise;
      const solBalanceValue = solBalanceInLamports / LAMPORTS_PER_SOL;
      
      // Validate SOL balance
      const validatedSolBalance = validateTokenAmount(solBalanceValue);
      
      setSolBalance(validatedSolBalance);

      // Get all token balances with timeout
      const tokenBalancesPromise = Promise.race([
        tokenService.getUserTokenBalances(publicKey),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Token balances fetch timeout')), 15000)
        )
      ]);
      
      const rawTokenBalances = await tokenBalancesPromise;
      
      // Validate and sanitize token balances
      if (!Array.isArray(rawTokenBalances)) {
        throw new Error('Invalid token balances format');
      }
      
      const tokenBalances = rawTokenBalances.filter(token => {
        try {
          return token && 
                 typeof token === 'object' && 
                 isValidSolanaAddress(token.mint) &&
                 typeof token.uiAmount === 'number' &&
                 token.uiAmount >= 0;
        } catch {
          return false;
        }
      });
      
      if (tokenBalances.length === 0) {
        setPortfolioData({
          totalValue: 0,
          totalChange24h: 0,
          totalChangePercent24h: 0,
          tokens: [],
          lastUpdated: new Date(),
        });
        return;
      }

      // Get token prices with error handling
      const tokenMints = tokenBalances.map(token => token.mint).filter(mint => mint);
      let tokenPrices: Map<string, TokenPrice>;
      
      try {
        tokenPrices = await Promise.race([
          tokenService.getTokenPrices(tokenMints),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Token prices fetch timeout')), 20000)
          )
        ]);
      } catch (priceError) {
        console.warn('Failed to fetch token prices:', priceError);
        tokenPrices = new Map(); // Continue with empty prices
      }

      // Calculate portfolio data with error handling
      let totalValue = 0;
      let totalChange24h = 0;
      const enrichedTokens: WalletTokenData[] = [];

      for (const tokenBalance of tokenBalances) {
        try {
          // Validate token data
          const validatedAmount = validateTokenAmount(tokenBalance.uiAmount);
          const sanitizedMint = sanitizeWalletAddress(tokenBalance.mint);
          
          const price = tokenPrices.get(tokenBalance.mint);
          let tokenInfo;
          
          try {
            tokenInfo = await tokenService.getTokenInfo(tokenBalance.mint);
          } catch (infoError) {
            console.warn(`Failed to get info for token ${tokenBalance.mint}:`, infoError);
            tokenInfo = null;
          }
          
          const tokenValue = price ? validateTokenAmount(validatedAmount * validatePrice(price.price)) : 0;
          const tokenChange24h = price ? validatePrice(tokenValue * (validatePrice(price.priceChange24h) / 100)) : 0;
          
          totalValue += tokenValue;
          totalChange24h += tokenChange24h;

          enrichedTokens.push({
            ...tokenBalance,
            mint: sanitizedMint,
            uiAmount: validatedAmount,
            price: price?.price,
            priceChange24h: price?.priceChange24h,
            value: tokenValue,
            logoURI: tokenInfo?.logoURI,
          });
        } catch (tokenError) {
          console.warn(`Error processing token ${tokenBalance.mint}:`, tokenError);
          // Continue with next token
        }
      }

      // Sort tokens by value (highest first)
      enrichedTokens.sort((a, b) => (b.value || 0) - (a.value || 0));

      const totalChangePercent24h = totalValue > 0 ? (totalChange24h / (totalValue - totalChange24h)) * 100 : 0;

      // Validate final portfolio data
      const portfolioData = validatePortfolioData({
        totalValue,
        totalChange24h,
        totalChangePercent24h,
        tokens: enrichedTokens,
        lastUpdated: new Date(),
      });
      
      setPortfolioData(portfolioData);
      
      // Securely cache the data
      try {
        secureStorage.setItem('portfolio_cache', JSON.stringify({
          data: portfolioData,
          timestamp: Date.now(),
          address: sanitizedAddress
        }));
      } catch (cacheError) {
        console.warn('Failed to cache portfolio data:', cacheError);
      }

    } catch (err) {
      console.error('Error refreshing wallet data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallet data';
      const isConnectionError = errorMessage.includes('connection') || 
                               errorMessage.includes('network') ||
                               errorMessage.includes('timeout');
      
      setError(errorMessage);
      
      // Set empty portfolio data on error
      setPortfolioData({
        totalValue: 0,
        totalChange24h: 0,
        totalChangePercent24h: 0,
        tokens: [],
        lastUpdated: new Date(),
      });
      
      // Auto-retry logic for connection errors
      if (isConnectionError && !isRetry) {
        setTimeout(() => {
          refreshData(true);
        }, 2000); // Retry after 2 seconds
      }
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, [connected, publicKey, connection, tokenService]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => !prev);
  }, []);

  const setRefreshInterval = useCallback((interval: number) => {
    const clampedInterval = Math.max(MIN_REFRESH_INTERVAL, Math.min(MAX_REFRESH_INTERVAL, interval));
    setRefreshIntervalState(clampedInterval);
  }, []);

  // Auto-refresh logic
  useEffect(() => {
    if (!connected || !publicKey || !autoRefreshEnabled) {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      return;
    }

    // Initial data fetch
    refreshData();

    // Set up auto-refresh
    const scheduleNextRefresh = () => {
      refreshTimeoutRef.current = setTimeout(() => {
        refreshData().finally(() => {
          if (autoRefreshEnabled && connected && publicKey) {
            scheduleNextRefresh();
          }
        });
      }, refreshInterval);
    };

    scheduleNextRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [connected, publicKey, autoRefreshEnabled, refreshInterval, refreshData]);

  // Clear data when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setSolBalance(null);
      setPortfolioData(null);
      setError(null);
      isRefreshingRef.current = false;
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    }
  }, [connected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    connected,
    connecting,
    publicKey,
    solBalance,
    portfolioData,
    isLoading,
    error,
    refreshData,
    autoRefreshEnabled,
    toggleAutoRefresh,
    refreshInterval,
    setRefreshInterval,
  };
};