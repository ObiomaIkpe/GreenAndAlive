import React, { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import CarbonCalculator from './components/CarbonCalculator';
import Marketplace from './components/Marketplace';
import AIRecommendations from './components/AIRecommendations';
import AIInsights from './components/AIInsights';
import Analytics from './components/Analytics';
import Profile from './components/Profile';
import BlockchainDashboard from './components/BlockchainDashboard';
import LoadingSpinner from './components/LoadingSpinner';
import { UserPortfolio } from './types';
import { analyticsService } from './services/analytics';
import { config } from './config/environment';

const mockPortfolio: UserPortfolio = {
  totalCredits: 1247,
  totalValue: 52850,
  monthlyOffset: 18.5,
  carbonFootprint: 32.4,
  reductionGoal: 24.0,
  achievements: [
    'Carbon Neutral Champion - Achieved 3 consecutive months',
    'Forest Protector - 100+ conservation credits purchased',
    'Efficiency Expert - 30% emission reduction achieved'
  ],
  walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  tokenBalance: 1247,
  stakingRewards: 156.5,
  nftBadges: []
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize analytics
    analyticsService.initialize();
    
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Track page views
    analyticsService.trackPageView(activeTab);
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard portfolio={mockPortfolio} />;
      case 'calculator':
        return <CarbonCalculator />;
      case 'marketplace':
        return <Marketplace />;
      case 'recommendations':
        return <AIRecommendations />;
      case 'ai-insights':
        return <AIInsights />;
      case 'blockchain':
        return config.features.blockchainEnabled ? <BlockchainDashboard /> : <Dashboard portfolio={mockPortfolio} />;
      case 'analytics':
        return <Analytics />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard portfolio={mockPortfolio} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading CarbonAI...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;