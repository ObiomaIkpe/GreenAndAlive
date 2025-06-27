import React, { useState, useEffect } from 'react';
import { Calculator, Zap, Car, Home, Plane, Save, History, TrendingDown } from 'lucide-react';
import { localStorageService } from '../services/localStorage';
import { notificationService } from '../services/notificationService';

interface EmissionSource {
  category: string;
  icon: React.ReactNode;
  value: number;
  unit: string;
  emissions: number;
}

interface CalculationHistory {
  date: string;
  totalEmissions: number;
  breakdown: Record<string, number>;
}

export default function CarbonCalculator() {
  const [sources, setSources] = useState<EmissionSource[]>([
    { category: 'Electricity', icon: <Zap className="w-5 h-5" />, value: 800, unit: 'kWh/month', emissions: 0.4 },
    { category: 'Transportation', icon: <Car className="w-5 h-5" />, value: 1200, unit: 'miles/month', emissions: 0.4 },
    { category: 'Home Heating', icon: <Home className="w-5 h-5" />, value: 100, unit: 'therms/month', emissions: 5.3 },
    { category: 'Air Travel', icon: <Plane className="w-5 h-5" />, value: 4, unit: 'flights/year', emissions: 0.9 }
  ]);

  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    // Load saved data
    const userData = localStorageService.getUserData();
    if (userData.carbonFootprint.lastCalculated) {
      setSources(prev => [
        { ...prev[0], value: userData.carbonFootprint.electricity },
        { ...prev[1], value: userData.carbonFootprint.transportation },
        { ...prev[2], value: userData.carbonFootprint.heating },
        { ...prev[3], value: userData.carbonFootprint.airTravel }
      ]);
    }

    // Load calculation history from localStorage
    const savedHistory = localStorage.getItem('carbonai_calculation_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.warn('Failed to load calculation history:', error);
      }
    }
  }, []);

  const updateSource = (index: number, newValue: number) => {
    const newSources = [...sources];
    newSources[index].value = newValue;
    setSources(newSources);
    setHasUnsavedChanges(true);
  };

  const totalEmissions = sources.reduce((total, source) => total + (source.value * source.emissions), 0);

  const saveCalculation = () => {
    const breakdown = {
      electricity: sources[0].value,
      transportation: sources[1].value,
      heating: sources[2].value,
      airTravel: sources[3].value
    };

    // Save to user data
    localStorageService.updateCarbonFootprint({
      ...breakdown,
      totalEmissions
    });

    // Add to history
    const newHistoryEntry: CalculationHistory = {
      date: new Date().toISOString(),
      totalEmissions,
      breakdown
    };

    const updatedHistory = [newHistoryEntry, ...history].slice(0, 10); // Keep last 10 calculations
    setHistory(updatedHistory);
    localStorage.setItem('carbonai_calculation_history', JSON.stringify(updatedHistory));

    setHasUnsavedChanges(false);
    
    notificationService.success(
      'Calculation Saved',
      `Your carbon footprint of ${totalEmissions.toFixed(1)} tons CO₂/year has been saved.`
    );
  };

  const loadFromHistory = (historyItem: CalculationHistory) => {
    setSources(prev => [
      { ...prev[0], value: historyItem.breakdown.electricity },
      { ...prev[1], value: historyItem.breakdown.transportation },
      { ...prev[2], value: historyItem.breakdown.heating },
      { ...prev[3], value: historyItem.breakdown.airTravel }
    ]);
    setShowHistory(false);
    setHasUnsavedChanges(true);
    
    notificationService.info(
      'Calculation Loaded',
      `Loaded calculation from ${new Date(historyItem.date).toLocaleDateString()}`
    );
  };

  const getEmissionTrend = () => {
    if (history.length < 2) return null;
    
    const current = totalEmissions;
    const previous = history[0]?.totalEmissions || current;
    const change = ((current - previous) / previous) * 100;
    
    return {
      change: change.toFixed(1),
      isImprovement: change < 0
    };
  };

  const trend = getEmissionTrend();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Carbon Footprint Calculator</h2>
                <p className="text-sm text-gray-600">Track and calculate your environmental impact</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </button>
              
              <button
                onClick={saveCalculation}
                disabled={!hasUnsavedChanges}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {sources.map((source, index) => (
            <div key={source.category} className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className="text-gray-600">{source.icon}</div>
                  <div>
                    <h3 className="font-medium text-gray-900">{source.category}</h3>
                    <p className="text-sm text-gray-500">{source.unit}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {(source.value * source.emissions).toFixed(1)} tons CO₂
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <input
                  type="range"
                  min="0"
                  max={source.category === 'Air Travel' ? 20 : 2000}
                  value={source.value}
                  onChange={(e) => updateSource(index, parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <input
                  type="number"
                  value={source.value}
                  onChange={(e) => updateSource(index, parseFloat(e.target.value) || 0)}
                  className="w-20 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}

          <div className="pt-6 border-t border-gray-100">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Total Annual Emissions</h3>
                  <p className="text-sm text-gray-600">Based on your current usage patterns</p>
                  {trend && (
                    <div className="flex items-center space-x-2 mt-2">
                      <TrendingDown className={`w-4 h-4 ${trend.isImprovement ? 'text-green-600' : 'text-red-600'}`} />
                      <span className={`text-sm font-medium ${trend.isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.isImprovement ? '-' : '+'}{Math.abs(parseFloat(trend.change))}% vs last calculation
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl sm:text-3xl font-bold text-red-600">{totalEmissions.toFixed(1)}</p>
                  <p className="text-sm text-red-500">tons CO₂/year</p>
                  {hasUnsavedChanges && (
                    <p className="text-xs text-orange-600 mt-1">Unsaved changes</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-lg p-4">
            <h4 className="font-medium text-emerald-900 mb-2">AI Recommendations</h4>
            <div className="space-y-2 text-sm text-emerald-800">
              <p>• Switch to renewable energy to reduce emissions by 40%</p>
              <p>• Consider electric vehicle to cut transportation emissions by 60%</p>
              <p>• Improve home insulation to reduce heating by 25%</p>
            </div>
          </div>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Calculation History</h3>
            <p className="text-sm text-gray-600">Your previous carbon footprint calculations</p>
          </div>
          
          <div className="p-4 sm:p-6">
            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors duration-200">
                    <div>
                      <p className="font-medium text-gray-900">{item.totalEmissions.toFixed(1)} tons CO₂</p>
                      <p className="text-sm text-gray-600">{new Date(item.date).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => loadFromHistory(item)}
                      className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors duration-200"
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No calculation history yet</p>
                <p className="text-sm text-gray-500 mt-1">Save your first calculation to see it here</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}