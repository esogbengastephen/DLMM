import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { fetchJSON, FetchError } from '@/utils/fetchWithFallback';

export interface SolanaToken {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  verified: boolean;
  popular: boolean;
  chainId: 101; // Solana mainnet
}

export interface TokenBalance {
  mint: string;
  symbol: string;
  balance: string;
  uiAmount: number;
  decimals: number;
}

export interface TokenPrice {
  mint: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: Date;
}

export class TokenService {
  private connection: Connection;
  private tokenCache: Map<string, SolanaToken> = new Map();
  private priceCache: Map<string, TokenPrice> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  constructor(connection: Connection) {
    this.connection = connection;
    this.initializeTokenList();
  }

  /**
   * Initialize with popular Solana tokens
   */
  private initializeTokenList() {
    const popularTokens: SolanaToken[] = [
      {
        mint: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        verified: true,
        popular: true,
        chainId: 101,
      },
      {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        verified: true,
        popular: true,
        chainId: 101,
      },
      {
        mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
        verified: true,
        popular: true,
        chainId: 101,
      },
      {
        mint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        decimals: 8,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png',
        verified: true,
        popular: true,
        chainId: 101,
      },
      {
        mint: '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk',
        symbol: 'WETH',
        name: 'Wrapped Ethereum',
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk/logo.png',
        verified: true,
        popular: true,
        chainId: 101,
      },
      {
        mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
        symbol: 'mSOL',
        name: 'Marinade staked SOL',
        decimals: 9,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png',
        verified: true,
        popular: true,
        chainId: 101,
      },
      {
        mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
        symbol: 'jitoSOL',
        name: 'Jito Staked SOL',
        decimals: 9,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn/logo.png',
        verified: true,
        popular: true,
        chainId: 101,
      },
      {
        mint: 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',
        symbol: 'bSOL',
        name: 'BlazeStake Staked SOL',
        decimals: 9,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1/logo.png',
        verified: true,
        popular: false,
        chainId: 101,
      },
      {
        mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
        symbol: 'PYTH',
        name: 'Pyth Network',
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3/logo.png',
        verified: true,
        popular: false,
        chainId: 101,
      },
      {
        mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
        symbol: 'JUP',
        name: 'Jupiter',
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN/logo.png',
        verified: true,
        popular: false,
        chainId: 101,
      },
    ];

    // Cache popular tokens
    popularTokens.forEach(token => {
      this.tokenCache.set(token.mint, token);
    });
  }

  /**
   * Get token information by mint address
   */
  async getTokenInfo(mint: string): Promise<SolanaToken | null> {
    try {
      // Check cache first
      if (this.tokenCache.has(mint)) {
        return this.tokenCache.get(mint)!;
      }

      // Fetch from Solana token list or Jupiter API
      const tokenInfo = await this.fetchTokenFromRegistry(mint);
      if (tokenInfo) {
        this.tokenCache.set(mint, tokenInfo);
        return tokenInfo;
      }

      return null;
    } catch (error) {
      console.error('Error fetching token info:', error);
      return null;
    }
  }

  /**
   * Get all popular Solana tokens
   */
  getPopularTokens(): SolanaToken[] {
    return Array.from(this.tokenCache.values()).filter(token => token.popular);
  }

  /**
   * Get all verified Solana tokens
   */
  getVerifiedTokens(): SolanaToken[] {
    return Array.from(this.tokenCache.values()).filter(token => token.verified);
  }

  /**
   * Get user's token balances
   */
  async getUserTokenBalances(userPublicKey: PublicKey): Promise<TokenBalance[]> {
    try {
      const balances: TokenBalance[] = [];

      // Get SOL balance
      const solBalance = await this.connection.getBalance(userPublicKey);
      const solToken = this.tokenCache.get('So11111111111111111111111111111111111111112')!;
      balances.push({
        mint: solToken.mint,
        symbol: solToken.symbol,
        balance: solBalance.toString(),
        uiAmount: solBalance / Math.pow(10, solToken.decimals),
        decimals: solToken.decimals,
      });

      // Get SPL token balances
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        userPublicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      for (const tokenAccount of tokenAccounts.value) {
        const accountData = tokenAccount.account.data.parsed.info;
        const mint = accountData.mint;
        const balance = accountData.tokenAmount.amount;
        const decimals = accountData.tokenAmount.decimals;
        const uiAmount = accountData.tokenAmount.uiAmount || 0;

        const tokenInfo = await this.getTokenInfo(mint);
        if (tokenInfo && parseFloat(balance) > 0) {
          balances.push({
            mint,
            symbol: tokenInfo.symbol,
            balance,
            uiAmount,
            decimals,
          });
        }
      }

      return balances;
    } catch (error) {
      console.error('Error fetching user token balances:', error);
      return [];
    }
  }

  /**
   * Get token prices from Jupiter API
   */
  async getTokenPrices(mints: string[]): Promise<Map<string, TokenPrice>> {
    try {
      const prices = new Map<string, TokenPrice>();
      
      // Check cache first
      const uncachedMints = mints.filter(mint => {
        const cached = this.priceCache.get(mint);
        if (cached && Date.now() - cached.lastUpdated.getTime() < this.cacheExpiry) {
          prices.set(mint, cached);
          return false;
        }
        return true;
      });

      if (uncachedMints.length === 0) {
        return prices;
      }

      // Fetch from Jupiter Price API v2 using enhanced fetch utility
      const data = await fetchJSON(
        `https://lite-api.jup.ag/price/v2?ids=${uncachedMints.join(',')}`,
        {
          timeout: 10000,
          retries: 2,
          retryDelay: 1000,
        }
      );

      for (const mint of uncachedMints) {
        const priceData = data.data?.[mint];
        if (priceData) {
          const tokenPrice: TokenPrice = {
            mint,
            price: parseFloat(priceData.price),
            priceChange24h: 0, // v2 API doesn't provide 24h change in basic call
            volume24h: 0, // v2 API doesn't provide volume in basic call
            marketCap: 0, // v2 API doesn't provide market cap in basic call
            lastUpdated: new Date(),
          };
          
          prices.set(mint, tokenPrice);
          this.priceCache.set(mint, tokenPrice);
        }
      }

      return prices;
    } catch (error) {
      console.error('Error fetching token prices:', error);
      
      // Log more detailed error information
      if (error instanceof FetchError) {
        console.error('Fetch Error Details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url,
        });
      } else if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Return cached prices if available, otherwise empty map
      const cachedPrices = new Map<string, TokenPrice>();
      for (const mint of mints) {
        const cached = this.priceCache.get(mint);
        if (cached && Date.now() - cached.lastUpdated.getTime() < this.cacheExpiry * 2) {
          // Use cached data even if slightly expired during errors
          cachedPrices.set(mint, cached);
        }
      }
      
      return cachedPrices;
    }
  }

  /**
   * Validate if a token is Solana-based
   */
  async validateSolanaToken(mint: string): Promise<boolean> {
    try {
      const publicKey = new PublicKey(mint);
      const accountInfo = await this.connection.getAccountInfo(publicKey);
      
      // Check if it's a valid SPL token mint
      return accountInfo !== null && accountInfo.owner.equals(TOKEN_PROGRAM_ID);
    } catch (error) {
      console.error('Error validating Solana token:', error);
      return false;
    }
  }

  /**
   * Get token pairs suitable for DLMM
   */
  getDLMMTokenPairs(): Array<{ tokenA: SolanaToken; tokenB: SolanaToken }> {
    const popularTokens = this.getPopularTokens();
    const pairs: Array<{ tokenA: SolanaToken; tokenB: SolanaToken }> = [];

    // Create pairs with SOL and USDC as base tokens
    const baseTokens = popularTokens.filter(token => 
      ['SOL', 'USDC'].includes(token.symbol)
    );
    
    const otherTokens = popularTokens.filter(token => 
      !['SOL', 'USDC'].includes(token.symbol)
    );

    // SOL pairs
    const solToken = baseTokens.find(token => token.symbol === 'SOL')!;
    otherTokens.forEach(token => {
      if (token.symbol !== 'SOL') {
        pairs.push({ tokenA: solToken, tokenB: token });
      }
    });

    // USDC pairs
    const usdcToken = baseTokens.find(token => token.symbol === 'USDC')!;
    otherTokens.forEach(token => {
      if (token.symbol !== 'USDC' && token.symbol !== 'USDT') {
        pairs.push({ tokenA: usdcToken, tokenB: token });
      }
    });

    // Add USDC/USDT pair
    const usdtToken = popularTokens.find(token => token.symbol === 'USDT');
    if (usdtToken) {
      pairs.push({ tokenA: usdcToken, tokenB: usdtToken });
    }

    return pairs;
  }

  /**
   * Fetch token from registry (Jupiter or Solana token list)
   */
  private async fetchTokenFromRegistry(mint: string): Promise<SolanaToken | null> {
    try {
      // Try Jupiter token list first
      const response = await fetch('https://token.jup.ag/all');
      const tokens = await response.json();
      
      const token = tokens.find((t: any) => t.address === mint);
      if (token) {
        return {
          mint: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          logoURI: token.logoURI || '',
          verified: token.verified || false,
          popular: false,
          chainId: 101,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching from token registry:', error);
      return null;
    }
  }
}

// Singleton instance
let tokenServiceInstance: TokenService | null = null;

export const getTokenService = (connection: Connection): TokenService => {
  if (!tokenServiceInstance) {
    tokenServiceInstance = new TokenService(connection);
  }
  return tokenServiceInstance;
};