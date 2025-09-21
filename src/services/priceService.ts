import { Connection, PublicKey } from '@solana/web3.js';
import { PythHttpClient, getPythProgramKeyForCluster } from '@pythnetwork/client';

export interface PriceData {
  mint: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  confidence: number;
  lastUpdated: Date;
  source: 'jupiter' | 'pyth' | 'fallback';
}

export interface PriceSubscription {
  mint: string;
  callback: (price: PriceData) => void;
  interval?: number;
}

export class PriceService {
  private connection: Connection;
  private pythClient: PythHttpClient | null = null;
  private priceCache: Map<string, PriceData> = new Map();
  private subscriptions: Map<string, PriceSubscription[]> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private cacheExpiry: number = 30 * 1000; // 30 seconds
  private isInitialized: boolean = false;

  // Popular token mint addresses and their Pyth price feed IDs
  private readonly TOKEN_PYTH_MAPPING = {
    'So11111111111111111111111111111111111111112': {
      symbol: 'SOL',
      pythId: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d'
    },
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
      symbol: 'USDC',
      pythId: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a'
    },
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': {
      symbol: 'USDT',
      pythId: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b'
    },
    '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E': {
      symbol: 'WBTC',
      pythId: '0xe62df6c8b4c85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43'
    },
    '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk': {
      symbol: 'WETH',
      pythId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'
    }
  };

  constructor(connection: Connection) {
    this.connection = connection;
    this.initializePythConnection();
  }

  /**
   * Initialize Pyth connection for real-time price feeds
   */
  private async initializePythConnection() {
    try {
      const pythProgramKey = getPythProgramKeyForCluster('mainnet-beta');
      this.pythClient = new PythHttpClient(this.connection, pythProgramKey);
      this.isInitialized = true;
      console.log('Pyth HTTP client initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize Pyth HTTP client, falling back to Jupiter only:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Get current price for a single token
   */
  async getPrice(mint: string): Promise<PriceData | null> {
    // Check cache first
    const cached = this.priceCache.get(mint);
    if (cached && Date.now() - cached.lastUpdated.getTime() < this.cacheExpiry) {
      return cached;
    }

    // Try Pyth first for supported tokens
    const pythPrice = await this.getPythPrice(mint);
    if (pythPrice) {
      this.priceCache.set(mint, pythPrice);
      return pythPrice;
    }

    // Fallback to Jupiter
    const jupiterPrice = await this.getJupiterPrice(mint);
    if (jupiterPrice) {
      this.priceCache.set(mint, jupiterPrice);
      return jupiterPrice;
    }

    return null;
  }

  /**
   * Get prices for multiple tokens
   */
  async getPrices(mints: string[]): Promise<Map<string, PriceData>> {
    const prices = new Map<string, PriceData>();
    const uncachedMints: string[] = [];

    // Check cache first
    for (const mint of mints) {
      const cached = this.priceCache.get(mint);
      if (cached && Date.now() - cached.lastUpdated.getTime() < this.cacheExpiry) {
        prices.set(mint, cached);
      } else {
        uncachedMints.push(mint);
      }
    }

    if (uncachedMints.length === 0) {
      return prices;
    }

    // Fetch uncached prices
    const jupiterPrices = await this.getJupiterPrices(uncachedMints);
    
    for (const [mint, price] of jupiterPrices) {
      prices.set(mint, price);
      this.priceCache.set(mint, price);
    }

    return prices;
  }

  /**
   * Subscribe to real-time price updates
   */
  subscribe(mint: string, callback: (price: PriceData) => void, interval: number = 30000): () => void {
    const subscription: PriceSubscription = { mint, callback, interval };
    
    if (!this.subscriptions.has(mint)) {
      this.subscriptions.set(mint, []);
    }
    
    this.subscriptions.get(mint)!.push(subscription);

    // Start interval updates if not already running
    if (!this.updateIntervals.has(mint)) {
      const intervalId = setInterval(async () => {
        const price = await this.getPrice(mint);
        if (price) {
          const subs = this.subscriptions.get(mint) || [];
          subs.forEach(sub => sub.callback(price));
        }
      }, interval);
      
      this.updateIntervals.set(mint, intervalId);
    }

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(mint) || [];
      const index = subs.indexOf(subscription);
      if (index > -1) {
        subs.splice(index, 1);
      }
      
      // Clean up interval if no more subscriptions
      if (subs.length === 0) {
        const intervalId = this.updateIntervals.get(mint);
        if (intervalId) {
          clearInterval(intervalId);
          this.updateIntervals.delete(mint);
        }
        this.subscriptions.delete(mint);
      }
    };
  }

  /**
   * Get price from Pyth oracle
   */
  private async getPythPrice(mint: string): Promise<PriceData | null> {
    if (!this.pythClient || !this.isInitialized) {
      return null;
    }

    const tokenInfo = this.TOKEN_PYTH_MAPPING[mint as keyof typeof this.TOKEN_PYTH_MAPPING];
    if (!tokenInfo) {
      return null;
    }

    try {
      const data = await this.pythClient.getData();
      const priceData = data.productPrice.get(tokenInfo.symbol);
      
      if (!priceData || !priceData.price) {
        return null;
      }

      return {
        mint,
        symbol: tokenInfo.symbol,
        price: priceData.price,
        priceChange24h: 0, // Pyth doesn't provide 24h change directly
        volume24h: 0,
        marketCap: 0,
        confidence: priceData.confidence || 0,
        lastUpdated: new Date(),
        source: 'pyth'
      };
    } catch (error) {
      console.warn(`Failed to fetch Pyth price for ${mint}:`, error);
      return null;
    }
  }

  /**
   * Get price from Jupiter API
   */
  private async getJupiterPrice(mint: string): Promise<PriceData | null> {
    try {
      const response = await fetch(`https://lite-api.jup.ag/price/v2?ids=${mint}`);
      const data = await response.json();
      
      const priceData = data.data?.[mint];
      if (!priceData) {
        return null;
      }

      return {
        mint,
        symbol: this.TOKEN_PYTH_MAPPING[mint as keyof typeof this.TOKEN_PYTH_MAPPING]?.symbol || 'UNKNOWN',
        price: parseFloat(priceData.price),
        priceChange24h: 0, // v2 API doesn't provide 24h change in basic call
        volume24h: 0, // v2 API doesn't provide volume in basic call
        marketCap: 0, // v2 API doesn't provide market cap in basic call
        confidence: 1, // Jupiter prices are generally reliable
        lastUpdated: new Date(),
        source: 'jupiter'
      };
    } catch (error) {
      console.warn(`Failed to fetch Jupiter price for ${mint}:`, error);
      return null;
    }
  }

  /**
   * Get multiple prices from Jupiter API
   */
  private async getJupiterPrices(mints: string[]): Promise<Map<string, PriceData>> {
    const prices = new Map<string, PriceData>();
    
    try {
      const response = await fetch(
        `https://lite-api.jup.ag/price/v2?ids=${mints.join(',')}`
      );
      const data = await response.json();

      for (const mint of mints) {
        const priceData = data.data?.[mint];
        if (priceData) {
          prices.set(mint, {
            mint,
            symbol: this.TOKEN_PYTH_MAPPING[mint as keyof typeof this.TOKEN_PYTH_MAPPING]?.symbol || 'UNKNOWN',
            price: parseFloat(priceData.price),
            priceChange24h: 0, // v2 API doesn't provide 24h change in basic call
            volume24h: 0, // v2 API doesn't provide volume in basic call
            marketCap: 0, // v2 API doesn't provide market cap in basic call
            confidence: 1,
            lastUpdated: new Date(),
            source: 'jupiter'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching Jupiter prices:', error);
    }

    return prices;
  }

  /**
   * Clear all subscriptions and intervals
   */
  destroy() {
    // Clear all intervals
    for (const intervalId of this.updateIntervals.values()) {
      clearInterval(intervalId);
    }
    
    // Clear all data structures
    this.updateIntervals.clear();
    this.subscriptions.clear();
    this.priceCache.clear();
    
    // Close Pyth client (HTTP client doesn't need explicit cleanup)
    if (this.pythClient) {
      this.pythClient = null;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.priceCache.size,
      activeSubscriptions: Array.from(this.subscriptions.values()).reduce((sum, subs) => sum + subs.length, 0),
      activeIntervals: this.updateIntervals.size,
      pythConnected: this.isInitialized
    };
  }
}

// Singleton instance
let priceServiceInstance: PriceService | null = null;

export const getPriceService = (connection: Connection): PriceService => {
  if (!priceServiceInstance) {
    priceServiceInstance = new PriceService(connection);
  }
  return priceServiceInstance;
};

export default PriceService;