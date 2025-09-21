import { Connection, PublicKey, AccountChangeCallback } from '@solana/web3.js';
import { EventEmitter } from 'events';

interface AccountSubscription {
  id: number;
  publicKey: PublicKey;
  callback: AccountChangeCallback;
  unsubscribe: () => void;
}

interface PositionUpdate {
  positionId: string;
  account: PublicKey;
  data: any;
  timestamp: Date;
}

interface TransactionUpdate {
  signature: string;
  status: 'confirmed' | 'finalized' | 'failed';
  timestamp: Date;
  accounts: PublicKey[];
}

export class WebSocketService extends EventEmitter {
  private connection: Connection;
  private subscriptions: Map<string, AccountSubscription> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second

  constructor(connection: Connection) {
    super();
    this.connection = connection;
    this.setupConnectionMonitoring();
  }

  private setupConnectionMonitoring() {
    // Monitor connection health
    setInterval(async () => {
      try {
        await this.connection.getSlot();
        if (!this.isConnected) {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
        }
      } catch (error) {
        if (this.isConnected) {
          this.isConnected = false;
          this.emit('disconnected', error);
          this.handleReconnection();
        }
      }
    }, 5000); // Check every 5 seconds
  }

  private async handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('reconnection-failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(async () => {
      try {
        // Resubscribe to all accounts
        const subscriptionsToRestore = Array.from(this.subscriptions.values());
        this.subscriptions.clear();
        
        for (const sub of subscriptionsToRestore) {
          await this.subscribeToAccount(sub.publicKey, sub.callback);
        }
        
        this.emit('reconnected');
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.handleReconnection();
      }
    }, delay);
  }

  /**
   * Subscribe to account changes
   */
  async subscribeToAccount(
    publicKey: PublicKey,
    callback: AccountChangeCallback,
    commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed'
  ): Promise<() => void> {
    try {
      const subscriptionId = await this.connection.onAccountChange(
        publicKey,
        (accountInfo, context) => {
          callback(accountInfo, context);
          this.emit('account-change', {
            publicKey,
            accountInfo,
            context,
            timestamp: new Date()
          });
        },
        commitment
      );

      const unsubscribe = () => {
        this.connection.removeAccountChangeListener(subscriptionId);
        this.subscriptions.delete(publicKey.toString());
      };

      const subscription: AccountSubscription = {
        id: subscriptionId,
        publicKey,
        callback,
        unsubscribe
      };

      this.subscriptions.set(publicKey.toString(), subscription);
      
      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to account:', publicKey.toString(), error);
      throw error;
    }
  }

  /**
   * Subscribe to multiple DLMM position accounts
   */
  async subscribeToPositions(
    positionAccounts: PublicKey[],
    onPositionUpdate: (update: PositionUpdate) => void
  ): Promise<() => void> {
    const unsubscribeFunctions: (() => void)[] = [];

    for (const positionAccount of positionAccounts) {
      try {
        const unsubscribe = await this.subscribeToAccount(
          positionAccount,
          (accountInfo, context) => {
            if (accountInfo) {
              const update: PositionUpdate = {
                positionId: positionAccount.toString(),
                account: positionAccount,
                data: accountInfo.data,
                timestamp: new Date()
              };
              onPositionUpdate(update);
            }
          }
        );
        unsubscribeFunctions.push(unsubscribe);
      } catch (error) {
        console.error('Failed to subscribe to position:', positionAccount.toString(), error);
      }
    }

    // Return function to unsubscribe from all positions
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Subscribe to wallet account changes (token accounts)
   */
  async subscribeToWallet(
    walletPublicKey: PublicKey,
    onWalletUpdate: (accountInfo: any) => void
  ): Promise<() => void> {
    return this.subscribeToAccount(
      walletPublicKey,
      (accountInfo, context) => {
        onWalletUpdate({ accountInfo, context, timestamp: new Date() });
      }
    );
  }

  /**
   * Subscribe to transaction confirmations
   */
  async subscribeToSignature(
    signature: string,
    onUpdate: (update: TransactionUpdate) => void
  ): Promise<() => void> {
    try {
      const subscriptionId = await this.connection.onSignature(
        signature,
        (result, context) => {
          const update: TransactionUpdate = {
            signature,
            status: result.err ? 'failed' : 'confirmed',
            timestamp: new Date(),
            accounts: [] // Would need to parse from transaction
          };
          onUpdate(update);
          this.emit('transaction-update', update);
        },
        'confirmed'
      );

      return () => {
        this.connection.removeSignatureListener(subscriptionId);
      };
    } catch (error) {
      console.error('Failed to subscribe to signature:', signature, error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    subscriptionCount: number;
    reconnectAttempts: number;
  } {
    return {
      isConnected: this.isConnected,
      subscriptionCount: this.subscriptions.size,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Unsubscribe from all accounts
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }

  /**
   * Cleanup and close all connections
   */
  destroy(): void {
    this.unsubscribeAll();
    this.removeAllListeners();
  }
}

// Singleton instance
let websocketServiceInstance: WebSocketService | null = null;

export const getWebSocketService = (connection?: Connection): WebSocketService => {
  if (!websocketServiceInstance && connection) {
    websocketServiceInstance = new WebSocketService(connection);
  }
  
  if (!websocketServiceInstance) {
    throw new Error('WebSocketService not initialized. Please provide a connection.');
  }
  
  return websocketServiceInstance;
};

export const destroyWebSocketService = (): void => {
  if (websocketServiceInstance) {
    websocketServiceInstance.destroy();
    websocketServiceInstance = null;
  }
};