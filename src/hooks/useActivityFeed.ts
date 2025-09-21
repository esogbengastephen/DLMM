import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useRealTimePositions } from './useRealTimePositions';
import { getTokenService } from '@/services/tokenService';

export interface ActivityItem {
  id: string;
  event: string;
  pool: string;
  amount: string;
  time: string;
  status: 'success' | 'pending' | 'failed';
  signature?: string;
  timestamp: Date;
}

interface ActivityFeedState {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
}

export const useActivityFeed = (maxItems: number = 50) => {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { updates, connectionStatus } = useRealTimePositions();
  const [state, setState] = useState<ActivityFeedState>({
    activities: [],
    loading: false,
    error: null,
  });

  // Format time ago
  const formatTimeAgo = useCallback((timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }, []);

  // Convert WebSocket updates to activity items
  const convertUpdateToActivity = useCallback(async (update: any): Promise<ActivityItem | null> => {
    try {
      const tokenService = getTokenService(connection);
      
      switch (update.type) {
        case 'position': {
          // Position account change
          const positionData = update.data;
          
          return {
            id: `position-${positionData.positionId}-${update.timestamp.getTime()}`,
            event: 'Position Updated',
            pool: 'DLMM Pool', // Would need to decode actual pool info
            amount: 'N/A', // Would need to calculate from position data
            time: formatTimeAgo(update.timestamp),
            status: 'success',
            timestamp: update.timestamp,
          };
        }
        
        case 'wallet': {
          // Wallet account change (token balance change)
          return {
            id: `wallet-${update.timestamp.getTime()}`,
            event: 'Balance Updated',
            pool: 'Wallet',
            amount: 'Token Balance',
            time: formatTimeAgo(update.timestamp),
            status: 'success',
            timestamp: update.timestamp,
          };
        }
        
        case 'transaction': {
          // Transaction confirmation
          const txData = update.data;
          
          return {
            id: `tx-${txData.signature}`,
            event: txData.status === 'failed' ? 'Transaction Failed' : 'Transaction Confirmed',
            pool: 'Network',
            amount: 'N/A',
            time: formatTimeAgo(update.timestamp),
            status: txData.status === 'failed' ? 'failed' : 'success',
            signature: txData.signature,
            timestamp: update.timestamp,
          };
        }
        
        default:
          return null;
      }
    } catch (error) {
      console.error('Error converting update to activity:', error);
      return null;
    }
  }, [formatTimeAgo]);

  // Process new updates
  useEffect(() => {
    if (!connected || updates.length === 0) return;

    const processUpdates = async () => {
      setState(prev => ({ ...prev, loading: true }));
      
      try {
        // Get the latest updates that haven't been processed
        const newUpdates = updates.slice(0, 10); // Process last 10 updates
        const newActivities: ActivityItem[] = [];
        
        for (const update of newUpdates) {
          const activity = await convertUpdateToActivity(update);
          if (activity) {
            // Check if this activity already exists
            const exists = state.activities.some(existing => existing.id === activity.id);
            if (!exists) {
              newActivities.push(activity);
            }
          }
        }
        
        if (newActivities.length > 0) {
          setState(prev => ({
            ...prev,
            activities: [...newActivities, ...prev.activities].slice(0, maxItems),
            loading: false,
          }));
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Error processing updates:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to process updates',
        }));
      }
    };

    processUpdates();
  }, [updates, connected, convertUpdateToActivity, maxItems, state.activities]);

  // Update time strings periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        activities: prev.activities.map(activity => ({
          ...activity,
          time: formatTimeAgo(activity.timestamp),
        })),
      }));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [formatTimeAgo]);

  // Add mock activities when no real data is available (for demo purposes)
  useEffect(() => {
    if (!connected || state.activities.length > 0) return;

    const mockActivities: ActivityItem[] = [
      {
        id: 'mock-1',
        event: 'Position Created',
        pool: 'SOL/USDC',
        amount: '1,000 USDC',
        time: '5 mins ago',
        status: 'success',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        id: 'mock-2',
        event: 'Fees Collected',
        pool: 'WBTC/USDC',
        amount: '0.001 WBTC',
        time: '15 mins ago',
        status: 'success',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        id: 'mock-3',
        event: 'Rebalance',
        pool: 'WETH/USDT',
        amount: '2 WETH',
        time: '1 hour ago',
        status: 'success',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
      },
    ];

    setState(prev => ({
      ...prev,
      activities: mockActivities,
    }));
  }, [connected, state.activities.length]);

  // Clear activities when disconnected
  useEffect(() => {
    if (!connected) {
      setState({
        activities: [],
        loading: false,
        error: null,
      });
    }
  }, [connected]);

  const clearActivities = useCallback(() => {
    setState(prev => ({ ...prev, activities: [] }));
  }, []);

  const addActivity = useCallback((activity: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    const newActivity: ActivityItem = {
      ...activity,
      id: `manual-${Date.now()}`,
      timestamp: new Date(),
    };
    
    setState(prev => ({
      ...prev,
      activities: [newActivity, ...prev.activities].slice(0, maxItems),
    }));
  }, [maxItems]);

  return {
    ...state,
    clearActivities,
    addActivity,
    isConnected: connectionStatus.isConnected,
    hasRealTimeData: updates.length > 0,
  };
};