# API Documentation

## Architecture Overview

The DLMM Cockpit follows a modular architecture with clear separation of concerns:

- **Services**: Handle external API calls and data fetching
- **Hooks**: Manage state and provide React integration
- **Components**: UI components with real-time data binding
- **Utils**: Utility functions and helpers

## Services

### DLMMService (`src/services/dlmmService.ts`)

Handles DLMM pool data and position management.

```typescript
interface DLMMService {
  // Get all DLMM pools
  getPools(): Promise<DLMMPool[]>
  
  // Get user positions
  getUserPositions(walletAddress: string): Promise<Position[]>
  
  // Get pool details
  getPoolDetails(poolAddress: string): Promise<PoolDetails>
  
  // Get historical data
  getHistoricalData(poolAddress: string, timeframe: string): Promise<HistoricalData[]>
}
```

### WebSocketService (`src/services/websocketService.ts`)

Manages real-time data connections and subscriptions.

```typescript
interface WebSocketService {
  // Connect to WebSocket
  connect(): Promise<void>
  
  // Subscribe to pool updates
  subscribeToPool(poolAddress: string, callback: (data: PoolUpdate) => void): void
  
  // Subscribe to position updates
  subscribeToPositions(walletAddress: string, callback: (data: Position[]) => void): void
  
  // Get connection status
  getConnectionStatus(): ConnectionStatus
}
```

### TokenService (`src/services/tokenService.ts`)

Handles SPL token information and metadata.

```typescript
interface TokenService {
  // Get token metadata
  getTokenMetadata(mintAddress: string): Promise<TokenMetadata>
  
  // Get supported tokens
  getSupportedTokens(): Promise<Token[]>
  
  // Get token price
  getTokenPrice(mintAddress: string): Promise<number>
}
```

### PriceService (`src/services/priceService.ts`)

Manages price feeds and market data.

```typescript
interface PriceService {
  // Get current prices
  getCurrentPrices(tokens: string[]): Promise<PriceData[]>
  
  // Subscribe to price updates
  subscribeToPrices(tokens: string[], callback: (prices: PriceData[]) => void): void
  
  // Get historical prices
  getHistoricalPrices(token: string, timeframe: string): Promise<HistoricalPrice[]>
}
```

## React Hooks

### useDLMM (`src/hooks/useDLMM.ts`)

Main hook for DLMM data management.

```typescript
interface UseDLMMReturn {
  pools: DLMMPool[]
  positions: Position[]
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
  subscribeToUpdates: (poolAddress: string) => void
}

const useDLMM = (walletAddress?: string): UseDLMMReturn
```

### useRealTimePositions (`src/hooks/useRealTimePositions.ts`)

Manages real-time position updates.

```typescript
interface UseRealTimePositionsReturn {
  positions: Position[]
  totalValue: number
  pnl: number
  loading: boolean
  connectionStatus: ConnectionStatus
}

const useRealTimePositions = (walletAddress: string): UseRealTimePositionsReturn
```

### usePortfolioValue (`src/hooks/usePortfolioValue.ts`)

Tracks portfolio value and performance metrics.

```typescript
interface UsePortfolioValueReturn {
  totalValue: number
  dailyChange: number
  dailyChangePercent: number
  positions: PositionValue[]
  loading: boolean
}

const usePortfolioValue = (walletAddress: string): UsePortfolioValueReturn
```

### useWalletStatus (`src/hooks/useWalletStatus.ts`)

Manages wallet connection and status.

```typescript
interface UseWalletStatusReturn {
  connected: boolean
  connecting: boolean
  publicKey: PublicKey | null
  balance: number
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

const useWalletStatus = (): UseWalletStatusReturn
```

### useActivityFeed (`src/hooks/useActivityFeed.ts`)

Provides real-time activity feed.

```typescript
interface UseActivityFeedReturn {
  activities: Activity[]
  loading: boolean
  markAsRead: (activityId: string) => void
  clearAll: () => void
}

const useActivityFeed = (walletAddress: string): UseActivityFeedReturn
```

## Data Types

### Core Types

```typescript
interface DLMMPool {
  address: string
  tokenA: Token
  tokenB: Token
  tvl: number
  volume24h: number
  fees24h: number
  apr: number
  binStep: number
}

interface Position {
  id: string
  poolAddress: string
  tokenA: TokenAmount
  tokenB: TokenAmount
  value: number
  pnl: number
  pnlPercent: number
  createdAt: Date
  updatedAt: Date
}

interface Token {
  mint: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

interface TokenAmount {
  token: Token
  amount: number
  uiAmount: number
}
```

### WebSocket Types

```typescript
interface PoolUpdate {
  poolAddress: string
  price: number
  volume: number
  tvl: number
  timestamp: Date
}

interface ConnectionStatus {
  connected: boolean
  reconnecting: boolean
  lastConnected?: Date
  error?: string
}
```

## Error Handling

All services implement consistent error handling:

```typescript
interface APIError {
  code: string
  message: string
  details?: any
}

// Usage in hooks
const { data, error, loading } = useDLMM(walletAddress)

if (error) {
  // Handle error state
  console.error('DLMM Error:', error)
}
```

## Rate Limiting

Services implement automatic rate limiting and retry logic:

- **Retry attempts**: 3 with exponential backoff
- **Rate limits**: Respect RPC provider limits
- **Fallback**: Automatic fallback to alternative endpoints

## Caching Strategy

- **Memory cache**: Short-term data (1-5 minutes)
- **Local storage**: User preferences and settings
- **Session storage**: Temporary data during session

## Real-time Updates

The application uses WebSocket connections for real-time updates:

1. **Connection management**: Automatic reconnection on failure
2. **Subscription management**: Efficient subscription handling
3. **Data synchronization**: Consistent state across components
4. **Fallback polling**: Automatic fallback if WebSocket fails

## Performance Optimization

- **Lazy loading**: Components and data loaded on demand
- **Memoization**: Expensive calculations cached
- **Debouncing**: User input debounced to reduce API calls
- **Virtual scrolling**: Large lists virtualized for performance