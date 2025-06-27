import React, { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import CarbonCalculator from './components/CarbonCalculator';
import Marketplace from './components/Marketplace';
import AIRecommendations from './components/AIRecommendations';
import AIInsights from './components/AIInsights';
import AITestDashboard from './components/AITestDashboard';
import WasteDisposalTracker from './components/WasteDisposalTracker';
import CorporateCompliance from './components/CorporateCompliance';
import VerificationDashboard from './components/VerificationDashboard';
import Analytics from './components/Analytics';
import Profile from './components/Profile';
import BlockchainDashboard from './components/BlockchainDashboard';
import BlockchainTestnetDashboard from './components/BlockchainTestnetDashboard';
import BlockchainProductionGuide from './components/BlockchainProductionGuide';
import LoadingSpinner from './components/LoadingSpinner';
import NotificationContainer from './components/NotificationContainer';
import { UserPortfolio } from './types';
import { analyticsService } from './services/analytics';
import { localStorageService } from './services/localStorage';
import { config } from './config/environment';

function App() {
  const [activeTab, setActiveTab] = useState('production-guide');
  const [blockchainReady, setBlockchainReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<UserPortfolio>({
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
  });

  useEffect(() => {
    // Initialize analytics
    analyticsService.initialize();
    
    // Load user data from localStorage
    const userData = localStorageService.getUserData();
    setPortfolio(prev => ({
      ...prev,
      totalCredits: userData.portfolio.totalCredits,
      totalValue: userData.portfolio.totalValue,
      monthlyOffset: userData.portfolio.monthlyOffset,
      carbonFootprint: userData.carbonFootprint.totalEmissions || prev.carbonFootprint,
      reductionGoal: userData.portfolio.reductionGoal,
      achievements: userData.portfolio.achievements
    }));
    
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

  // Update portfolio when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const userData = localStorageService.getUserData();
      setPortfolio(prev => ({
        ...prev,
        totalCredits: userData.portfolio.totalCredits,
        totalValue: userData.portfolio.totalValue,
        monthlyOffset: userData.portfolio.monthlyOffset,
        carbonFootprint: userData.carbonFootprint.totalEmissions || prev.carbonFootprint,
        reductionGoal: userData.portfolio.reductionGoal,
        achievements: userData.portfolio.achievements
      }));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard portfolio={portfolio} />;
      case 'calculator':
        return <CarbonCalculator />;
      case 'marketplace':
        return <Marketplace />;
      case 'recommendations':
        return <AIRecommendations />;
      case 'ai-insights':
        return <AIInsights />;
      case 'ai-test':
        return <AITestDashboard />;
      case 'waste-tracker':
        return <WasteDisposalTracker />;
      case 'corporate':
        return <CorporateCompliance />;
      case 'verification':
        return <VerificationDashboard />;
      case 'blockchain':
        return config.features.blockchainEnabled ? <BlockchainDashboard /> : <Dashboard portfolio={portfolio} />;
      case 'blockchain-testnet':
        return <BlockchainTestnetDashboard />;
      case 'production-guide':
        return <BlockchainProductionGuide />;
      case 'analytics':
        return <Analytics />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard portfolio={portfolio} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {renderContent()}
        </main>
        <NotificationContainer />
      </div>
    </ErrorBoundary>
  );
}

export default App;