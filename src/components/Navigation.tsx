import React, { useState } from 'react';
import { BarChart3, ShoppingCart, Calculator, Brain, Activity, User, Settings, Blocks, Lightbulb, TestTube, Recycle, Building2, Shield, Menu, X, Network, Rocket } from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'calculator', label: 'Calculator', icon: Calculator },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
  { id: 'recommendations', label: 'AI Recommendations', icon: Brain },
  { id: 'ai-insights', label: 'AI Insights', icon: Lightbulb },
  { id: 'ai-test', label: 'AI Test', icon: TestTube },
  { id: 'waste-tracker', label: 'Waste Tracker', icon: Recycle },
  { id: 'corporate', label: 'Corporate', icon: Building2 },
  { id: 'verification', label: 'Verification', icon: Shield },
  { id: 'blockchain', label: 'Blockchain', icon: Blocks },
  { id: 'blockchain-testnet', label: 'Testnet', icon: Network },
  { id: 'production-guide', label: 'Production Guide', icon: Rocket },
  { id: 'analytics', label: 'Analytics', icon: Activity },
  { id: 'profile', label: 'Profile', icon: User }
];

export default function Navigation({ activeTab, setActiveTab }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">CarbonAI</h1>
              <p className="text-xs text-gray-500">Smart Carbon Management</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-gray-900">CarbonAI</h1>
            </div>
          </div>

          {/* Desktop Navigation - Hidden on smaller screens */}
          <div className="hidden xl:flex space-x-2 flex-1 justify-center max-w-6xl mx-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === item.id
                      ? 'bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tablet Navigation - Show fewer items with tooltips */}
          <div className="hidden lg:flex xl:hidden space-x-1 flex-1 justify-center max-w-4xl mx-8">
            {navItems.slice(0, 8).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative group flex items-center justify-center p-2.5 rounded-lg font-medium text-xs transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </button>
              );
            })}
            {/* More menu for remaining items */}
            <div className="relative">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="relative group flex items-center justify-center p-2.5 rounded-lg font-medium text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
              >
                <Menu className="w-4 h-4" />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  More Options
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </button>
              {mobileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {navItems.slice(8).map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center space-x-3 w-full px-4 py-3 text-sm transition-colors duration-200 ${
                          activeTab === item.id
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{item.label}</span>
                          <span className="text-xs text-gray-500">
                            {item.id === 'blockchain-testnet' ? 'Test smart contracts' :
                             item.id === 'production-guide' ? 'Deploy to mainnet' :
                             item.id === 'analytics' ? 'View carbon insights' :
                             item.id === 'profile' ? 'Manage account' : 'Advanced features'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Settings */}
          <div className="hidden lg:flex items-center space-x-3">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1 max-h-96 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-3 w-full px-3 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <button className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg font-medium text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </nav>
  );
}