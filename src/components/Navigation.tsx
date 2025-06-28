import React from 'react';
import { 
  Home, 
  Calculator, 
  ShoppingCart, 
  Brain, 
  BarChart3, 
  User, 
  Leaf,
  Trash2,
  Building,
  Shield,
  Link,
  TestTube,
  Lightbulb,
  BookOpen
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  // Organize navigation items into two rows
  const topRowNavItems = [
    { id: 'dashboard', label: 'Dashboard', description: 'Overview & stats', icon: Home },
    { id: 'calculator', label: 'Calculator', description: 'Track emissions', icon: Calculator },
    { id: 'marketplace', label: 'Marketplace', description: 'Buy carbon credits', icon: ShoppingCart },
    { id: 'recommendations', label: 'AI Recommendations', description: 'Smart suggestions', icon: Brain },
    { id: 'ai-insights', label: 'AI Insights', description: 'Advanced analytics', icon: Lightbulb },
    { id: 'ai-metrics', label: 'AI Metrics', description: 'Usage statistics', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', description: 'Performance data', icon: BarChart3 },
    { id: 'profile', label: 'Profile', description: 'Account settings', icon: User },
  ];
  
  const bottomRowNavItems = [
    { id: 'waste-tracker', label: 'Waste Tracker', description: 'Disposal rewards', icon: Trash2 },
    { id: 'corporate', label: 'Corporate', description: 'Business compliance', icon: Building },
    { id: 'verification', label: 'Verification', description: 'Third-party audits', icon: Shield },
    { id: 'blockchain', label: 'Blockchain', description: 'Token management', icon: Link },
    { id: 'blockchain-testnet', label: 'Testnet', description: 'Test environment', icon: Link },
    { id: 'production-guide', label: 'Production Guide', description: 'Deployment steps', icon: BookOpen },
    { id: 'ai-test', label: 'AI Test', description: 'Test AI features', icon: TestTube }
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col">
          {/* Logo and Brand */}
          <div className="flex justify-between items-center h-12 mb-2">
            <div className="flex items-center">
              <Leaf className="h-8 w-8 text-green-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">CarbonledgerAI</span>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                {[...topRowNavItems, ...bottomRowNavItems].map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Top Row Navigation */}
          <div className="hidden md:block border-b border-gray-100 pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              {topRowNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex flex-col items-center transition-colors ${
                      activeTab === item.id
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-gray-500 mt-1">{item.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Bottom Row Navigation */}
          <div className="hidden md:block pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              {bottomRowNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex flex-col items-center transition-colors ${
                      activeTab === item.id
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-gray-500 mt-1">{item.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;