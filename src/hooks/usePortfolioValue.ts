import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useDLMM } from './useDLMM';
import { getPriceService } from '../services/priceService';
import { getTokenService } from '../services/tokenService';

interface PortfolioMetrics {
  totalLiquidityUSD: number;
  feesEarnedUSD: number;
  activePositionsCount: number;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const usePortfolioValue = () => {
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();
  const { positions, loading: dlmmLoading, error: dlmmError } = useDLMM();
  const [metrics, setMetrics] = useState<PortfolioMetrics>({
    totalLiquidityUSD: 0,
    feesEarnedUSD: 0,
    activePositionsCount: 0,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const calculatePortfolioValue = useCallback(async () => {
    if (!connected || !publicKey || positions.length === 0) {
      setMetrics(prev => ({
        ...prev,
        totalLiquidityUSD: 0,
        feesEarnedUSD: 0,
        activePositionsCount: 0,
        loading: false,
        lastUpdated: new Date(),
      }));
      return;
    }

    setMetrics(prev => ({ ...prev, loading: true, error: null }));

    try {
      const priceService = getPriceService(connection);
      const tokenService = getTokenService(connection);
      
      let totalLiquidityUSD = 0;
      let feesEarnedUSD = 0;
      const activePositions = positions.filter(p => p.liquidity && parseFloat(p.liquidity) > 0);

      // Get unique token addresses from all positions
      const tokenAddresses = new Set<string>();
      activePositions.forEach(position => {
        // Extract token mints from pair string (format: "TOKEN1/TOKEN2")
        if (position.pair && typeof position.pair === 'string') {
          const [tokenX, tokenY] = position.pair.split('/');
          // Map common token symbols to their mint addresses
          const tokenMintMap: { [key: string]: string } = {
            'SOL': 'So11111111111111111111111111111111111111112',
            'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
            'WBTC': '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
            'WETH': '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk',
          };
          if (tokenMintMap[tokenX]) tokenAddresses.add(tokenMintMap[tokenX]);
          if (tokenMintMap[tokenY]) tokenAddresses.add(tokenMintMap[tokenY]);
        }
      });

      // Fetch current prices for all tokens
      const tokenPrices = await priceService.getPrices(Array.from(tokenAddresses));

      // Calculate portfolio value
      for (const position of activePositions) {
        try {
          // Parse liquidity value (assuming it's a string representation)
          const liquidityValue = parseFloat(position.liquidity) || 0;
          
          // For now, use a simple estimation based on liquidity
          // In a real implementation, you'd need to fetch actual position data from the DLMM program
          totalLiquidityUSD += liquidityValue * 0.001; // Rough estimation
          
          // Estimate fees (typically 0.1-1% of liquidity)
          feesEarnedUSD += liquidityValue * 0.0001;
          
        } catch (positionError) {
          console.warn('Error calculating value for position:', position.publicKey, positionError);
        }
      }

      setMetrics({
        totalLiquidityUSD,
        feesEarnedUSD,
        activePositionsCount: activePositions.length,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });

    } catch (error) {
      console.error('Error calculating portfolio value:', error);
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to calculate portfolio value',
      }));
    }
  }, [connected, publicKey, positions]);

  // Calculate portfolio value when dependencies change
  useEffect(() => {
    if (!dlmmLoading && !dlmmError) {
      calculatePortfolioValue();
    }
  }, [calculatePortfolioValue, dlmmLoading, dlmmError]);

  // Set up real-time price updates
  useEffect(() => {
    if (!connected || positions.length === 0) return;

    const priceService = getPriceService(connection);
    
    // Get unique token addresses
    const tokenAddresses = new Set<string>();
    positions.forEach(position => {
      // Extract token mints from pair string (format: "TOKEN1/TOKEN2")
      if (position.pair && typeof position.pair === 'string') {
        const [tokenX, tokenY] = position.pair.split('/');
        // Map common token symbols to their mint addresses
        const tokenMintMap: { [key: string]: string } = {
          'SOL': 'So11111111111111111111111111111111111111112',
          'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
          'WBTC': '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
          'WETH': '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk',
        };
        if (tokenMintMap[tokenX]) tokenAddresses.add(tokenMintMap[tokenX]);
        if (tokenMintMap[tokenY]) tokenAddresses.add(tokenMintMap[tokenY]);
      }
    });

    // Subscribe to price updates
    const unsubscribeFunctions: (() => void)[] = [];
    
    Array.from(tokenAddresses).forEach(tokenAddress => {
      const unsubscribe = priceService.subscribe(
        tokenAddress,
        () => {
          // Recalculate portfolio value when prices update
          calculatePortfolioValue();
        }
      );
      unsubscribeFunctions.push(unsubscribe);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [connected, positions, calculatePortfolioValue]);

  // Refresh function for manual updates
  const refresh = useCallback(() => {
    calculatePortfolioValue();
  }, [calculatePortfolioValue]);

  return {
    ...metrics,
    refresh,
    // Formatted values for display
    totalLiquidityFormatted: `$${metrics.totalLiquidityUSD.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`,
    feesEarnedFormatted: `$${metrics.feesEarnedUSD.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`,
  };
};