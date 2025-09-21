# 🚀 DLMM Cockpit

A sophisticated **Dynamic Liquidity Market Maker (DLMM) trading dashboard** for Solana that provides real-time monitoring and management of liquidity positions with full SPL token support.

![DLMM Cockpit Dashboard](https://img.shields.io/badge/Next.js-15.5.3-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![Solana](https://img.shields.io/badge/Solana-SPL_Tokens-9945FF?style=for-the-badge&logo=solana)

## ✨ Features

### 🎯 **Core Functionality**
- **Real-time Portfolio Monitoring** - Live tracking of DLMM positions and performance
- **SPL Token Support** - Full integration with WBTC, WETH, SOL, and custom SPL tokens
- **WebSocket Integration** - Real-time data streaming with connection status indicators
- **Auto Rebalancing** - Intelligent portfolio optimization with customizable strategies
- **Order Management** - Complete order lifecycle tracking and execution

### 📊 **Dashboard Pages**
- **Main Dashboard** - Portfolio overview with key metrics and recent activity
- **Analytics** - Deep performance analysis with interactive charts
- **Portfolio** - Comprehensive position management and asset allocation
- **Orders** - Live order book and transaction history
- **Rebalancer** - Automated portfolio optimization controls

### 🔄 **Real-Time Features**
- Live connection status with visual indicators (🟢/🔴)
- Real-time subscription count monitoring
- Last updated timestamps across all components
- Automatic data refresh and synchronization
- WebSocket reconnection handling

## 🏗️ **Technology Stack**

### **Frontend**
- **Next.js 15.5.3** with Turbopack for ultra-fast development
- **React 18** with modern hooks and concurrent features
- **TypeScript** for type safety and better developer experience
- **Tailwind CSS** for responsive, utility-first styling

### **Real-Time Infrastructure**
- **WebSocket Services** for live data streaming
- **Custom React Hooks** for state management
- **Connection Health Monitoring** with automatic reconnection

### **Solana Integration**
- **SPL Token Support** with proper decimal handling
- **DLMM Pool Integration** via Meteora protocol
- **Wallet Security** with safe transaction handling
- **Multi-source Price Feeds** for accurate pricing

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn package manager
- Git for version control

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/esogbengastephen/DLMM.git
cd DLMM/dlmm-cockpit
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

4. **Start the development server**
```bash
npm run dev
# or
yarn dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 **Usage Guide**

### **Dashboard Navigation**
- **Dashboard** (`/`) - Main portfolio overview and metrics
- **Analytics** (`/analytics`) - Performance charts and detailed analysis
- **Portfolio** (`/portfolio`) - Position management and asset allocation
- **Orders** (`/orders`) - Order tracking and execution
- **Rebalancer** (`/rebalancer`) - Automated portfolio optimization

### **Real-Time Monitoring**
Each page displays:
- **Connection Status**: Green indicator for active WebSocket connection
- **Subscription Count**: Number of active real-time data streams
- **Last Updated**: Timestamp showing when data was last refreshed

### **SPL Token Trading**
Supported trading pairs:
- **WBTC/USDC** - Wrapped Bitcoin pairs
- **WETH/USDC** - Wrapped Ethereum pairs  
- **SOL/USDC** - Native Solana pairs
- **Custom SPL Tokens** - Extensible for any SPL token

## 🛠️ **Development**

### **Available Scripts**
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint for code quality
```

### **Project Structure**
```
dlmm-cockpit/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── page.tsx         # Dashboard
│   │   ├── analytics/       # Analytics page
│   │   ├── portfolio/       # Portfolio management
│   │   ├── orders/          # Order management
│   │   └── rebalancer/      # Auto rebalancer
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   │   ├── useRealTimePositions.ts
│   │   ├── useActivityFeed.ts
│   │   ├── usePortfolioValue.ts
│   │   └── useDLMM.ts
│   ├── services/            # API and external services
│   │   ├── priceService.ts
│   │   ├── tokenService.ts
│   │   └── websocketService.ts
│   ├── contexts/            # React context providers
│   └── utils/               # Utility functions
├── public/                  # Static assets
└── docs/                    # Additional documentation
```

### **Key Components**

#### **Custom Hooks**
- `useRealTimePositions()` - Live DLMM position tracking
- `useActivityFeed()` - Real-time transaction feed
- `usePortfolioValue()` - Live portfolio calculations
- `useDLMM()` - DLMM pool interactions
- `useWebSocket()` - WebSocket connection management

#### **Services**
- **Price Service** - Multi-source price aggregation
- **Token Service** - SPL token metadata and operations
- **WebSocket Service** - Real-time data streaming

## 🔧 **Configuration**

### **Environment Variables**
Create a `.env.local` file with:
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_WEBSOCKET_URL=wss://api.mainnet-beta.solana.com
NEXT_PUBLIC_METEORA_API_URL=https://dlmm-api.meteora.ag
```

### **Turbopack Configuration**
The project uses Turbopack for faster builds. Configuration in `next.config.ts`:
```typescript
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        // Custom Turbopack rules
      }
    }
  }
}
```

## 🚀 **Deployment**

### **Production Build**
```bash
npm run build
npm start
```

### **Vercel Deployment**
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write tests for new features
- Maintain real-time functionality
- Ensure SPL token compatibility

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Meteora Protocol** for DLMM infrastructure
- **Solana Foundation** for blockchain technology
- **Next.js Team** for the amazing framework
- **Tailwind CSS** for utility-first styling

## 📞 **Support**

- **Issues**: [GitHub Issues](https://github.com/esogbengastephen/DLMM/issues)
- **Discussions**: [GitHub Discussions](https://github.com/esogbengastephen/DLMM/discussions)
- **Documentation**: [Project Wiki](https://github.com/esogbengastephen/DLMM/wiki)

---

**Built with ❤️ for the Solana DeFi ecosystem**
