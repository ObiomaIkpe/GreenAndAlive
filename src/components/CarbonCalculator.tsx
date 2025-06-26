import React, { useState } from 'react';
import { Calculator, Zap, Car, Home, Plane } from 'lucide-react';

interface EmissionSource {
  category: string;
  icon: React.ReactNode;
  value: number;
  unit: string;
  emissions: number;
}

export default function CarbonCalculator() {
  const [sources, setSources] = useState<EmissionSource[]>([
    { category: 'Electricity', icon: <Zap className="w-5 h-5" />, value: 800, unit: 'kWh/month', emissions: 0.4 },
    { category: 'Transportation', icon: <Car className="w-5 h-5" />, value: 1200, unit: 'miles/month', emissions: 0.4 },
    { category: 'Home Heating', icon: <Home className="w-5 h-5" />, value: 100, unit: 'therms/month', emissions: 5.3 },
    { category: 'Air Travel', icon: <Plane className="w-5 h-5" />, value: 4, unit: 'flights/year', emissions: 0.9 }
  ]);

  const updateSource = (index: number, newValue: number) => {
    const newSources = [...sources];
    newSources[index].value = newValue;
    setSources(newSources);
  };

  const totalEmissions = sources.reduce((total, source) => total + (source.value * source.emissions), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Calculator className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Carbon Footprint Calculator</h2>
            <p className="text-sm text-gray-600">Track and calculate your environmental impact</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {sources.map((source, index) => (
          <div key={source.category} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-gray-600">{source.icon}</div>
                <div>
                  <h3 className="font-medium text-gray-900">{source.category}</h3>
                  <p className="text-sm text-gray-500">{source.unit}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {(source.value * source.emissions).toFixed(1)} tons CO₂
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Annual Emissions</h3>
                <p className="text-sm text-gray-600">Based on your current usage patterns</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-red-600">{totalEmissions.toFixed(1)}</p>
                <p className="text-sm text-red-500">tons CO₂/year</p>
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
  );
}