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
          <div className="hidden xl:flex space-x-1 flex-1 justify-center max-w-5xl mx-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-lg font-medium text-xs transition-all duration-200 whitespace-nowrap ${
                    activeTab === item.id
                      ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden 2xl:inline">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tablet Navigation - Show fewer items */}
          <div className="hidden lg:flex xl:hidden space-x-1 flex-1 justify-center max-w-4xl mx-8">
            {navItems.slice(0, 8).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-center p-2.5 rounded-lg font-medium text-xs transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
            {/* More menu for remaining items */}
            <div className="relative">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center justify-center p-2.5 rounded-lg font-medium text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
                title="More options"
              >
                <Menu className="w-4 h-4" />
              </button>
              {mobileMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {navItems.slice(8).map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center space-x-3 w-full px-4 py-2 text-sm transition-colors duration-200 ${
                          activeTab === item.id
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Settings */}
          <div className="hidden lg:flex items-center space-x-2">
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