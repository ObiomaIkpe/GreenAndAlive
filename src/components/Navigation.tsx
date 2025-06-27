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
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
    { id: 'recommendations', label: 'AI Recommendations', icon: Brain },
    { id: 'ai-insights', label: 'AI Insights', icon: Lightbulb },
    { id: 'ai-test', label: 'AI Test', icon: TestTube },
    { id: 'waste-tracker', label: 'Waste Tracker', icon: Trash2 },
    { id: 'corporate', label: 'Corporate', icon: Building },
    { id: 'verification', label: 'Verification', icon: Shield },
    { id: 'blockchain', label: 'Blockchain', icon: Link },
    { id: 'blockchain-testnet', label: 'Testnet', icon: Link },
    { id: 'production-guide', label: 'Production Guide', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Leaf className="h-8 w-8 text-green-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">CarbonAI</span>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors ${
                      activeTab === item.id
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              {navItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;