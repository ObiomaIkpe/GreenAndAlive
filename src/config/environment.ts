export const config = {
  // Environment detection
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.carbonai.com',
    timeout: 30000,
    retryAttempts: 3
  },
  
  // Blockchain Configuration
  blockchain: {
    contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    networkId: import.meta.env.VITE_NETWORK_ID || '1',
    rpcUrl: import.meta.env.VITE_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    explorerUrl: import.meta.env.VITE_EXPLORER_URL || 'https://etherscan.io'
  },
  
  // Feature Flags
  features: {
    blockchainEnabled: import.meta.env.VITE_BLOCKCHAIN_ENABLED === 'true',
    aiRecommendations: import.meta.env.VITE_AI_RECOMMENDATIONS === 'true',
    analytics: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
    notifications: import.meta.env.VITE_NOTIFICATIONS_ENABLED === 'true'
  },
  
  // Analytics
  analytics: {
    googleAnalyticsId: import.meta.env.VITE_GA_ID,
    mixpanelToken: import.meta.env.VITE_MIXPANEL_TOKEN
  },
  
  // Error Reporting
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENV || 'production'
  }
};