import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import CarbonCalculator from './components/CarbonCalculator';
import Marketplace from './components/Marketplace';
import AIRecommendations from './components/AIRecommendations';
import Analytics from './components/Analytics';
import Profile from './components/Profile';
import { UserPortfolio } from './types';

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
  ]
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

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
      case 'analytics':
        return <Analytics />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard portfolio={mockPortfolio} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;