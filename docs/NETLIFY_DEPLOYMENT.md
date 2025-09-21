# Netlify Deployment Guide

## Quick Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/esogbengastephen/DLMM)

## Manual Deployment Steps

### 1. Prerequisites
- GitHub account with the DLMM repository
- Netlify account (free tier available)
- Solana RPC endpoints (optional but recommended)

### 2. Connect Repository to Netlify

1. **Login to Netlify**: Go to [netlify.com](https://netlify.com) and sign in
2. **New Site**: Click "New site from Git"
3. **Connect to GitHub**: Authorize Netlify to access your GitHub account
4. **Select Repository**: Choose `esogbengastephen/DLMM`
5. **Configure Build Settings**:
   - **Base directory**: `dlmm-cockpit`
   - **Build command**: `npm run build`
   - **Publish directory**: `dlmm-cockpit/out`

### 3. Environment Variables Setup

In your Netlify dashboard, go to **Site settings > Environment variables** and add:

#### Required Variables
```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

#### Recommended Premium RPC (for better performance)
```env
# Alchemy (recommended)
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Helius (alternative)
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY

# QuickNode (alternative)
NEXT_PUBLIC_QUICKNODE_RPC_URL=https://your-endpoint.solana-mainnet.quiknode.pro/YOUR_API_KEY/

# GenesysGo (alternative)
NEXT_PUBLIC_GENESYSGO_RPC_URL=https://ssc-dao.genesysgo.net/
```

#### Optional Configuration
```env
# Analytics (if using)
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id

# Custom WebSocket endpoint
NEXT_PUBLIC_WS_ENDPOINT=wss://your-websocket-endpoint

# Development mode (set to 'true' for debugging)
NEXT_PUBLIC_DEBUG_MODE=false
```

### 4. Build Configuration

The project includes a `netlify.toml` file with optimized settings:

```toml
[build]
  publish = "out"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--production=false"
```

### 5. Deploy

1. **Trigger Deploy**: Click "Deploy site" or push changes to your main branch
2. **Monitor Build**: Watch the build logs in Netlify dashboard
3. **Access Site**: Once deployed, you'll get a unique URL like `https://amazing-app-123456.netlify.app`

### 6. Custom Domain (Optional)

1. **Add Domain**: In Site settings > Domain management
2. **Configure DNS**: Point your domain to Netlify's servers
3. **SSL Certificate**: Netlify automatically provides HTTPS

## Build Optimization

### Performance Tips
- The app uses static export for optimal performance
- All assets are pre-built and cached
- WebSocket connections work seamlessly with static hosting

### Bundle Analysis
- Main bundle: ~432 kB (includes Solana Web3.js)
- Individual pages: 7-96 kB
- Shared chunks optimized for caching

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check Node.js version (requires 18+)
   - Verify all dependencies are installed
   - Review build logs for specific errors

2. **Environment Variables Not Working**
   - Ensure variables start with `NEXT_PUBLIC_`
   - Redeploy after adding new variables
   - Check variable names for typos

3. **RPC Connection Issues**
   - Verify RPC URLs are accessible
   - Check rate limits on free RPC endpoints
   - Consider upgrading to premium RPC for production

4. **WebSocket Connection Problems**
   - Ensure WSS (secure WebSocket) is used in production
   - Check browser console for connection errors
   - Verify CORS settings if using custom endpoints

### Debug Mode

Enable debug mode by setting:
```env
NEXT_PUBLIC_DEBUG_MODE=true
```

This will show additional logging in the browser console.

## Monitoring

### Performance Monitoring
- Use Netlify Analytics for traffic insights
- Monitor Core Web Vitals in production
- Set up uptime monitoring for critical functionality

### Error Tracking
- Browser console logs for client-side errors
- Network tab for API/RPC connection issues
- Netlify function logs (if using serverless functions)

## Security

### Best Practices
- Never expose private keys in environment variables
- Use HTTPS-only RPC endpoints in production
- Implement proper Content Security Policy
- Regular dependency updates

### Environment Security
- Netlify encrypts environment variables
- Variables are only accessible during build time
- Client-side variables are public (prefixed with `NEXT_PUBLIC_`)

## Scaling

### Traffic Handling
- Netlify CDN handles global distribution
- Static assets cached at edge locations
- Automatic scaling for traffic spikes

### Performance Optimization
- Enable Netlify's asset optimization
- Use premium RPC endpoints for better reliability
- Consider implementing service worker for offline functionality

## Support

### Resources
- [Netlify Documentation](https://docs.netlify.com/)
- [Next.js Static Export Guide](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)

### Getting Help
- Check Netlify community forums
- Review GitHub issues in the repository
- Contact support through Netlify dashboard