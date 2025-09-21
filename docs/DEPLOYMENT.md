# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Solana wallet (Phantom, Solflare, etc.)
- Access to Solana RPC endpoints

## Environment Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/esogbengastephen/DLMM.git
   cd dlmm-cockpit
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:
   ```env
   # Solana Network Configuration
   NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   
   # Premium RPC (recommended for production)
   NEXT_PUBLIC_ALCHEMY_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY
   NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
   ```

## Development Deployment

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Access the application:**
   - Open http://localhost:3000 in your browser
   - Connect your Solana wallet
   - Start monitoring your DLMM positions

## Production Deployment

### Vercel (Recommended)

1. **Deploy to Vercel:**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Configure environment variables in Vercel dashboard:**
   - Add all variables from `.env.local`
   - Ensure RPC URLs are production-ready

### Docker Deployment

1. **Build Docker image:**
   ```bash
   docker build -t dlmm-cockpit .
   ```

2. **Run container:**
   ```bash
   docker run -p 3000:3000 --env-file .env.local dlmm-cockpit
   ```

### Manual Server Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

## Configuration Options

### RPC Endpoints
- **Public RPC**: Free but rate-limited
- **Premium RPC**: Recommended for production (Alchemy, Helius, QuickNode)

### WebSocket Configuration
- Automatic fallback to polling if WebSocket fails
- Configurable reconnection intervals
- Real-time data synchronization

### Performance Optimization
- Enable Turbopack for faster builds: `npm run dev --turbo`
- Use premium RPC endpoints for better reliability
- Configure proper caching headers

## Monitoring and Maintenance

### Health Checks
- Monitor WebSocket connection status
- Check RPC endpoint availability
- Verify real-time data updates

### Troubleshooting
- Check browser console for errors
- Verify wallet connection
- Ensure RPC endpoints are accessible
- Check network connectivity

## Security Considerations

- Never commit private keys or sensitive data
- Use environment variables for all configuration
- Implement proper CORS policies
- Regular dependency updates
- Monitor for security vulnerabilities