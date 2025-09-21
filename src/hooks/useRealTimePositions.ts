import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useDLMM } from './useDLMM';
import { getWebSocketService, WebSocketService } from '@/services/websocketService';

interface RealTimeUpdate {
  type: 'position' | 'wallet' | 'transaction';
  timestamp: Date;
  data: any;
}

interface ConnectionStatus {
  isConnected: boolean;
  subscriptionCount: number;
  reconnectAttempts: number;
  lastUpdate: Date | null;
}

export const useRealTimePositions = () => {
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();
  const { positions, refreshPositions } = useDLMM();
  const [updates, setUpdates] = useState<RealTimeUpdate[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    subscriptionCount: 0,
    reconnectAttempts: 0,
    lastUpdate: null,
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const websocketServiceRef = useRef<WebSocketService | null>(null);
  const unsubscribeFunctionsRef = useRef<(() => void)[]>([]);

  // Initialize WebSocket service
  useEffect(() => {
    if (connection && !websocketServiceRef.current) {
      try {
        websocketServiceRef.current = getWebSocketService(connection);
        
        // Set up event listeners
        const service = websocketServiceRef.current;
        
        service.on('connected', () => {
          setConnectionStatus(prev => ({ ...prev, isConnected: true }));
        });
        
        service.on('disconnected', (error) => {
          console.warn('WebSocket disconnected:', error);
          setConnectionStatus(prev => ({ ...prev, isConnected: false }));
        });
        
        service.on('reconnected', () => {
          console.log('WebSocket reconnected');
          setConnectionStatus(prev => ({ ...prev, isConnected: true }));
        });
        
        service.on('reconnection-failed', () => {
          console.error('WebSocket reconnection failed');
          setConnectionStatus(prev => ({ ...prev, isConnected: false }));
        });
        
        service.on('account-change', (data) => {
          const update: RealTimeUpdate = {
            type: 'position',
            timestamp: data.timestamp,
            data: {
              publicKey: data.publicKey.toString(),
              accountInfo: data.accountInfo,
              context: data.context
            }
          };
          
          setUpdates(prev => [update, ...prev.slice(0, 99)]); // Keep last 100 updates
          setConnectionStatus(prev => ({ ...prev, lastUpdate: new Date() }));
          
          // Trigger position refresh when position accounts change
          refreshPositions();
        });
        
        service.on('transaction-update', (data) => {
          const update: RealTimeUpdate = {
            type: 'transaction',
            timestamp: data.timestamp,
            data
          };
          
          setUpdates(prev => [update, ...prev.slice(0, 99)]);
          setConnectionStatus(prev => ({ ...prev, lastUpdate: new Date() }));
        });
        
      } catch (error) {
        console.error('Failed to initialize WebSocket service:', error);
      }
    }
  }, [connection, refreshPositions]);

  // Subscribe to position updates
  const subscribeToPositions = useCallback(async () => {
    if (!websocketServiceRef.current || !connected || !publicKey || positions.length === 0) {
      return;
    }

    try {
      // Clear existing subscriptions
      unsubscribeFunctionsRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribeFunctionsRef.current = [];

      const service = websocketServiceRef.current;
      
      // Subscribe to wallet account
      const walletUnsubscribe = await service.subscribeToWallet(
        publicKey,
        (walletUpdate) => {
          const update: RealTimeUpdate = {
            type: 'wallet',
            timestamp: walletUpdate.timestamp,
            data: walletUpdate
          };
          setUpdates(prev => [update, ...prev.slice(0, 99)]);
          setConnectionStatus(prev => ({ ...prev, lastUpdate: new Date() }));
        }
      );
      unsubscribeFunctionsRef.current.push(walletUnsubscribe);

      // Subscribe to position accounts
      const activePositions = positions.filter(p => p.isActive);
      const positionAccounts = activePositions
        .map(p => {
          try {
            return new PublicKey(p.publicKey);
          } catch {
            return null;
          }
        })
        .filter((pk): pk is PublicKey => pk !== null);

      if (positionAccounts.length > 0) {
        const positionsUnsubscribe = await service.subscribeToPositions(
          positionAccounts,
          (positionUpdate) => {
            const update: RealTimeUpdate = {
              type: 'position',
              timestamp: positionUpdate.timestamp,
              data: positionUpdate
            };
            setUpdates(prev => [update, ...prev.slice(0, 99)]);
            setConnectionStatus(prev => ({ ...prev, lastUpdate: new Date() }));
          }
        );
        unsubscribeFunctionsRef.current.push(positionsUnsubscribe);
      }

      // Update connection status
      const status = service.getConnectionStatus();
      setConnectionStatus(prev => ({
        ...prev,
        subscriptionCount: status.subscriptionCount,
        reconnectAttempts: status.reconnectAttempts
      }));
      
      setIsSubscribed(true);
      console.log(`Subscribed to ${positionAccounts.length} position accounts`);
      
    } catch (error) {
      console.error('Failed to subscribe to positions:', error);
      setIsSubscribed(false);
    }
  }, [connected, publicKey, positions]);

  // Subscribe when positions change
  useEffect(() => {
    if (connected && positions.length > 0) {
      subscribeToPositions();
    } else {
      // Unsubscribe when disconnected or no positions
      unsubscribeFunctionsRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribeFunctionsRef.current = [];
      setIsSubscribed(false);
    }
  }, [connected, positions, subscribeToPositions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFunctionsRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribeFunctionsRef.current = [];
    };
  }, []);

  // Subscribe to transaction signature
  const subscribeToTransaction = useCallback(async (signature: string) => {
    if (!websocketServiceRef.current) return () => {};

    try {
      return await websocketServiceRef.current.subscribeToSignature(
        signature,
        (transactionUpdate) => {
          const update: RealTimeUpdate = {
            type: 'transaction',
            timestamp: transactionUpdate.timestamp,
            data: transactionUpdate
          };
          setUpdates(prev => [update, ...prev.slice(0, 99)]);
          setConnectionStatus(prev => ({ ...prev, lastUpdate: new Date() }));
        }
      );
    } catch (error) {
      console.error('Failed to subscribe to transaction:', signature, error);
      return () => {};
    }
  }, []);

  // Clear updates
  const clearUpdates = useCallback(() => {
    setUpdates([]);
  }, []);

  // Manual refresh
  const refresh = useCallback(() => {
    refreshPositions();
    subscribeToPositions();
  }, [refreshPositions, subscribeToPositions]);

  return {
    updates,
    connectionStatus,
    isSubscribed,
    subscribeToTransaction,
    clearUpdates,
    refresh,
    // Utility functions
    getRecentUpdates: (count: number = 10) => updates.slice(0, count),
    getUpdatesByType: (type: RealTimeUpdate['type']) => updates.filter(u => u.type === type),
  };
};