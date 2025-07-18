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
    { id: 'calculator', label: 'Calculator', description: 'Track emissions', icon: Calculator, group: 'core' },
    { id: 'marketplace', label: 'Marketplace', description: 'Buy carbon credits', icon: ShoppingCart, group: 'core' },
    { id: 'recommendations', label: 'AI Recommendations', description: 'Smart suggestions', icon: Brain, group: 'ai' },
    { id: 'ai-insights', label: 'AI Insights', description: 'Advanced analytics', icon: Lightbulb, group: 'ai' },
    { id: 'ai-metrics', label: 'AI Metrics', description: 'Usage statistics', icon: BarChart3, group: 'ai' },
    { id: 'analytics', label: 'Analytics', description: 'Performance data', icon: BarChart3, group: 'core' },
    { id: 'profile', label: 'Profile', description: 'Account settings', icon: User, group: 'core' },
  ];
  
  const bottomRowNavItems = [
    { id: 'waste-tracker', label: 'Waste Tracker', description: 'Disposal rewards', icon: Trash2, group: 'features' },
    { id: 'corporate', label: 'Corporate', description: 'Business compliance', icon: Building, group: 'features' },
    { id: 'verification', label: 'Verification', description: 'Third-party audits', icon: Shield, group: 'features' },
    { id: 'blockchain', label: 'Blockchain', description: 'Token management', icon: Link, group: 'blockchain' },
    { id: 'blockchain-testnet', label: 'Testnet', description: 'Test environment', icon: Link, group: 'blockchain' },
    { id: 'production-guide', label: 'Production Guide', description: 'Deployment steps', icon: BookOpen, group: 'blockchain' },
    { id: 'bolt-blockchain', label: 'Bolt Blockchain', description: 'Bolt.new integration', icon: () => <img src="/bolt-icon.svg" alt="Bolt" className="w-4 h-4" />, group: 'blockchain' },
    { id: 'ai-test', label: 'AI Test', description: 'Test AI features', icon: TestTube, group: 'ai' }
  ];

  // Group navigation items by category for mobile view
  const groupedNavItems = {
    core: [...topRowNavItems, ...bottomRowNavItems].filter(item => item.group === 'core'),
    ai: [...topRowNavItems, ...bottomRowNavItems].filter(item => item.group === 'ai'),
    features: [...topRowNavItems, ...bottomRowNavItems].filter(item => item.group === 'features'),
    blockchain: [...topRowNavItems, ...bottomRowNavItems].filter(item => item.group === 'blockchain'),
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col">
          {/* Logo and Brand */}
          <div className="flex justify-between items-center h-12 mb-2 relative">
            <div className="flex items-center">
              <div className="relative">
                <img src="/bolt-icon.svg" alt="Bolt Icon" className="h-8 w-8" />
                <Leaf className="h-8 w-8 text-green-600 absolute top-0 left-0 opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="ml-2">
                <span className="text-xl font-bold text-gray-900">CarbonledgerAI</span>
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Production</span>
              </div>
              <a 
                href="https://bolt.new" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ml-2 text-xs text-gray-500 hover:text-emerald-600 transition-colors duration-200"
              >
                Powered by Bolt.new
              </a>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <div className="block w-full">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <optgroup label="Core Features">
                    {groupedNavItems.core.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="AI Features">
                    {groupedNavItems.ai.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Advanced Features">
                    {groupedNavItems.features.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Blockchain">
                    {groupedNavItems.blockchain.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
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
                    className={`px-3 py-2 rounded-md text-sm font-medium flex flex-col items-center transition-colors relative ${
                      activeTab === item.id
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    {item.group === 'ai' && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
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
                    className={`px-3 py-2 rounded-md text-sm font-medium flex flex-col items-center transition-colors relative ${
                      activeTab === item.id
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    {item.group === 'ai' && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
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