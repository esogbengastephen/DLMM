import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { getDLMMService, DLMMPosition, DLMMPool } from '../services/dlmmService';
import { getSarosDLMMService, SarosDLMMPosition, SarosDLMMPool } from '../services/sarosDLMMService';
import { getTokenService, SolanaToken } from '../services/tokenService';

export interface CreatePositionParams {
  poolAddress: string;
  tokenX: SolanaToken;
  tokenY: SolanaToken;
  amountX: number;
  amountY: number;
  minPrice: number;
  maxPrice: number;
  slippage?: number;
}

export interface RebalanceParams {
  positionId: string;
  newMinPrice: number;
  newMaxPrice: number;
  slippage?: number;
}

export interface UseDLMMReturn {
  // State
  positions: DLMMPosition[];
  pools: DLMMPool[];
  sarosPositions: SarosDLMMPosition[];
  sarosPools: SarosDLMMPool[];
  tokens: SolanaToken[];
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshPositions: () => Promise<void>;
  refreshPools: () => Promise<void>;
  refreshSarosData: () => Promise<void>;
  createPosition: (
    poolPublicKey: string,
    tokenXAmount: number,
    tokenYAmount: number,
    binId: number
  ) => Promise<string | null>;
  createSarosPosition: (params: CreatePositionParams) => Promise<any>;
  rebalancePosition: (params: RebalanceParams) => Promise<any>;
  getPoolInfo: (poolPublicKey: string) => Promise<DLMMPool | null>;
  calculateFees: (
    poolPublicKey: string,
    positionPublicKey: string
  ) => Promise<{ tokenX: string; tokenY: string } | null>;
  clearError: () => void;
}

export const useDLMM = (): UseDLMMReturn => {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  // State
  const [positions, setPositions] = useState<DLMMPosition[]>([]);
  const [pools, setPools] = useState<DLMMPool[]>([]);
  const [sarosPositions, setSarosPositions] = useState<SarosDLMMPosition[]>([]);
  const [sarosPools, setSarosPools] = useState<SarosDLMMPool[]>([]);
  const [tokens, setTokens] = useState<SolanaToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get service instances
  const dlmmService = getDLMMService(connection);
  const sarosService = getSarosDLMMService(connection);
  const tokenService = getTokenService(connection);
  
  // Update wallet in services when wallet changes
  useEffect(() => {
    dlmmService.setWallet(wallet);
    sarosService.setWallet(wallet);
  }, [wallet, dlmmService, sarosService]);
  
  // Refresh user positions
  const refreshPositions = useCallback(async () => {
    if (!wallet.publicKey) {
      setPositions([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const userPositions = await dlmmService.getUserPositions(wallet.publicKey);
      setPositions(userPositions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch positions';
      setError(errorMessage);
      console.error('Error refreshing positions:', err);
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, dlmmService]);
  
  // Refresh available pools
  const refreshPools = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const allPools = await dlmmService.getAllPools();
      setPools(allPools);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pools';
      setError(errorMessage);
      console.error('Error refreshing pools:', err);
    } finally {
      setLoading(false);
    }
  }, [dlmmService]);
  
  // Create new position
  const createPosition = useCallback(async (
    poolPublicKey: string,
    tokenXAmount: number,
    tokenYAmount: number,
    binId: number
  ): Promise<string | null> => {
    if (!wallet.publicKey) {
      setError('Wallet not connected');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const signature = await dlmmService.createPosition(
        poolPublicKey,
        tokenXAmount,
        tokenYAmount,
        binId
      );
      
      if (signature) {
        // Refresh positions after successful creation
        await refreshPositions();
      }
      
      return signature;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create position';
      setError(errorMessage);
      console.error('Error creating position:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, dlmmService, refreshPositions]);
  
  // Get pool information
  const getPoolInfo = useCallback(async (poolPublicKey: string): Promise<DLMMPool | null> => {
    setError(null);
    
    try {
      return await dlmmService.getPoolInfo(poolPublicKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pool info';
      setError(errorMessage);
      console.error('Error fetching pool info:', err);
      return null;
    }
  }, [dlmmService]);
  
  // Calculate fees for a position
  const calculateFees = useCallback(async (
    poolPublicKey: string,
    positionPublicKey: string
  ): Promise<{ tokenX: string; tokenY: string } | null> => {
    setError(null);
    
    try {
      return await dlmmService.calculateEstimatedFees(poolPublicKey, positionPublicKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate fees';
      setError(errorMessage);
      console.error('Error calculating fees:', err);
      return null;
    }
  }, [dlmmService]);

  // Refresh Saros data
  const refreshSarosData = useCallback(async () => {
    if (!wallet.publicKey) {
      setSarosPositions([]);
      setSarosPools([]);
      setTokens([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
       const [positions, pools, popularTokens] = await Promise.all([
         sarosService.getUserPositions(wallet.publicKey),
         sarosService.getAllPools(),
         Promise.resolve(tokenService.getPopularTokens())
       ]);
      
      setSarosPositions(positions);
       setSarosPools(pools);
       setTokens(popularTokens);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Saros data';
      setError(errorMessage);
      console.error('Error refreshing Saros data:', err);
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, sarosService, tokenService]);

  // Create Saros position
  const createSarosPosition = useCallback(async (params: CreatePositionParams) => {
    if (!wallet.publicKey) {
      setError('Wallet not connected');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
       const createParams = {
         poolPublicKey: params.poolAddress,
         tokenXAmount: params.amountX,
         tokenYAmount: params.amountY,
         binIds: [0], // Default bin ID, should be calculated based on price range
         slippageTolerance: params.slippage || 0.5
       };
       const result = await sarosService.createPosition(createParams);
      
      // Refresh data after creation
      await refreshSarosData();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create Saros position';
      setError(errorMessage);
      console.error('Error creating Saros position:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, sarosService, refreshSarosData]);

  // Rebalance position
  const rebalancePosition = useCallback(async (params: RebalanceParams) => {
    if (!wallet.publicKey) {
      setError('Wallet not connected');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
       const rebalanceParams = {
         positionId: params.positionId,
         newBinIds: [0], // Default bin IDs, should be calculated based on price range
         slippageTolerance: params.slippage || 0.5
       };
       const result = await sarosService.rebalancePosition(rebalanceParams);
      
      // Refresh data after rebalancing
      await refreshSarosData();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rebalance position';
      setError(errorMessage);
      console.error('Error rebalancing position:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, sarosService, refreshSarosData]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Auto-refresh positions when wallet connects
  useEffect(() => {
    if (wallet.publicKey) {
      refreshPositions();
      refreshSarosData();
    }
  }, [wallet.publicKey, refreshPositions, refreshSarosData]);
  
  // Auto-refresh pools on mount
  useEffect(() => {
    refreshPools();
  }, [refreshPools]);
  
  return {
    // State
    positions,
    pools,
    sarosPositions,
    sarosPools,
    tokens,
    loading,
    error,
    
    // Actions
    refreshPositions,
    refreshPools,
    refreshSarosData,
    createPosition,
    createSarosPosition,
    rebalancePosition,
    getPoolInfo,
    calculateFees,
    clearError,
  };
};