/**
 * Wallet Security Utilities
 * Provides secure validation and sanitization for wallet-related data
 */

import { PublicKey } from '@solana/web3.js';

/**
 * Validates if a string is a valid Solana public key
 */
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    // Check basic format
    if (!address || typeof address !== 'string') {
      return false;
    }
    
    // Check length (base58 encoded public keys are typically 32-44 characters)
    if (address.length < 32 || address.length > 44) {
      return false;
    }
    
    // Check character set (base58)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(address)) {
      return false;
    }
    
    // Try to create PublicKey instance
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitizes wallet address for display
 */
export const sanitizeWalletAddress = (address: string): string => {
  if (!isValidSolanaAddress(address)) {
    throw new Error('Invalid wallet address format');
  }
  
  // Remove any potential XSS characters
  return address.replace(/[<>"'&]/g, '');
};

/**
 * Validates token mint address
 */
export const isValidTokenMint = (mint: string): boolean => {
  return isValidSolanaAddress(mint);
};

/**
 * Validates numerical values for token amounts and balances
 */
export const validateTokenAmount = (amount: unknown): number => {
  if (typeof amount !== 'number') {
    throw new Error('Token amount must be a number');
  }
  
  if (!Number.isFinite(amount)) {
    throw new Error('Token amount must be finite');
  }
  
  if (amount < 0) {
    throw new Error('Token amount cannot be negative');
  }
  
  if (amount > Number.MAX_SAFE_INTEGER) {
    throw new Error('Token amount exceeds maximum safe value');
  }
  
  return amount;
};

/**
 * Validates price data
 */
export const validatePrice = (price: unknown): number => {
  if (typeof price !== 'number') {
    throw new Error('Price must be a number');
  }
  
  if (!Number.isFinite(price)) {
    throw new Error('Price must be finite');
  }
  
  if (price < 0) {
    throw new Error('Price cannot be negative');
  }
  
  return price;
};

/**
 * Sanitizes token metadata
 */
export const sanitizeTokenMetadata = (metadata: any): any => {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  
  const sanitized: any = {};
  
  // Sanitize name
  if (typeof metadata.name === 'string') {
    sanitized.name = metadata.name.replace(/[<>"'&]/g, '').substring(0, 100);
  }
  
  // Sanitize symbol
  if (typeof metadata.symbol === 'string') {
    sanitized.symbol = metadata.symbol.replace(/[<>"'&]/g, '').substring(0, 20);
  }
  
  // Validate and sanitize logoURI
  if (typeof metadata.logoURI === 'string') {
    try {
      const url = new URL(metadata.logoURI);
      // Only allow https URLs
      if (url.protocol === 'https:') {
        sanitized.logoURI = metadata.logoURI;
      }
    } catch {
      // Invalid URL, skip
    }
  }
  
  // Validate decimals
  if (typeof metadata.decimals === 'number' && 
      Number.isInteger(metadata.decimals) && 
      metadata.decimals >= 0 && 
      metadata.decimals <= 18) {
    sanitized.decimals = metadata.decimals;
  }
  
  return sanitized;
};

/**
 * Rate limiting for API calls
 */
class RateLimiter {
  private calls: number[] = [];
  private maxCalls: number;
  private timeWindow: number;
  
  constructor(maxCalls: number = 100, timeWindowMs: number = 60000) {
    this.maxCalls = maxCalls;
    this.timeWindow = timeWindowMs;
  }
  
  canMakeCall(): boolean {
    const now = Date.now();
    
    // Remove old calls outside the time window
    this.calls = this.calls.filter(callTime => now - callTime < this.timeWindow);
    
    // Check if we can make a new call
    if (this.calls.length < this.maxCalls) {
      this.calls.push(now);
      return true;
    }
    
    return false;
  }
  
  getRemainingCalls(): number {
    const now = Date.now();
    this.calls = this.calls.filter(callTime => now - callTime < this.timeWindow);
    return Math.max(0, this.maxCalls - this.calls.length);
  }
  
  getResetTime(): number {
    if (this.calls.length === 0) return 0;
    return this.calls[0] + this.timeWindow;
  }
}

// Global rate limiter instance
export const apiRateLimiter = new RateLimiter(100, 60000); // 100 calls per minute

/**
 * Secure data storage utilities
 */
export const secureStorage = {
  /**
   * Stores sensitive data with encryption (mock implementation)
   */
  setItem: (key: string, value: string): void => {
    try {
      // In a real implementation, you would encrypt the value
      sessionStorage.setItem(`secure_${key}`, value);
    } catch (error) {
      console.warn('Failed to store secure data:', error);
    }
  },
  
  /**
   * Retrieves and decrypts sensitive data (mock implementation)
   */
  getItem: (key: string): string | null => {
    try {
      // In a real implementation, you would decrypt the value
      return sessionStorage.getItem(`secure_${key}`);
    } catch (error) {
      console.warn('Failed to retrieve secure data:', error);
      return null;
    }
  },
  
  /**
   * Removes sensitive data
   */
  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(`secure_${key}`);
    } catch (error) {
      console.warn('Failed to remove secure data:', error);
    }
  },
  
  /**
   * Clears all secure storage
   */
  clear: (): void => {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('secure_')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear secure storage:', error);
    }
  }
};

/**
 * Validates and sanitizes portfolio data
 */
export const validatePortfolioData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid portfolio data format');
  }
  
  const validated: any = {};
  
  // Validate total value
  if ('totalValue' in data) {
    validated.totalValue = validateTokenAmount(data.totalValue);
  }
  
  // Validate change values
  if ('totalChange24h' in data) {
    validated.totalChange24h = validatePrice(data.totalChange24h);
  }
  
  if ('totalChangePercent24h' in data) {
    validated.totalChangePercent24h = validatePrice(data.totalChangePercent24h);
  }
  
  // Validate timestamp
  if ('lastUpdated' in data) {
    if (data.lastUpdated instanceof Date) {
      validated.lastUpdated = data.lastUpdated;
    } else {
      throw new Error('Invalid lastUpdated timestamp');
    }
  }
  
  // Validate token balances array
  if ('tokenBalances' in data && Array.isArray(data.tokenBalances)) {
    validated.tokenBalances = data.tokenBalances.map((token: any) => {
      if (!token || typeof token !== 'object') {
        throw new Error('Invalid token balance format');
      }
      
      return {
        mint: isValidTokenMint(token.mint) ? token.mint : (() => { throw new Error('Invalid token mint'); })(),
        balance: validateTokenAmount(token.balance),
        uiAmount: validateTokenAmount(token.uiAmount),
        decimals: typeof token.decimals === 'number' ? token.decimals : 0,
        price: token.price ? validatePrice(token.price) : undefined,
        priceChange24h: token.priceChange24h ? validatePrice(token.priceChange24h) : undefined,
        value: token.value ? validateTokenAmount(token.value) : 0,
        logoURI: typeof token.logoURI === 'string' ? token.logoURI : undefined,
      };
    });
  }
  
  return validated;
};