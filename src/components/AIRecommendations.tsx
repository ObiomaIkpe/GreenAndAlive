import React from 'react';
import { Brain, TrendingUp, Lightbulb, Target } from 'lucide-react';
import { AIRecommendation } from '../types';

const mockRecommendations: AIRecommendation[] = [
  {
    id: '1',
    type: 'reduction',
    title: 'Switch to LED Lighting',
    description: 'Replace remaining incandescent bulbs with LED alternatives to reduce energy consumption by 15%',
    impact: 2.4,
    confidence: 92,
    category: 'Energy Efficiency'
  },
  {
    id: '2',
    type: 'purchase',
    title: 'Forest Conservation Credits',
    description: 'Amazon rainforest credits show 23% price increase trend. Consider purchasing now.',
    impact: 8.5,
    confidence: 87,
    category: 'Market Opportunity'
  },
  {
    id: '3',
    type: 'optimization',
    title: 'Smart Thermostat Upgrade',
    description: 'AI analysis shows potential 18% heating cost reduction with smart temperature control',
    impact: 3.2,
    confidence: 89,
    category: 'Home Automation'
  },
  {
    id: '4',
    type: 'reduction',
    title: 'Renewable Energy Plan',
    description: 'Local utility offers 100% renewable energy at competitive rates in your area',
    impact: 12.8,
    confidence: 95,
    category: 'Energy Source'
  }
];

const typeIcons = {
  reduction: <Target className="w-5 h-5" />,
  purchase: <TrendingUp className="w-5 h-5" />,
  optimization: <Lightbulb className="w-5 h-5" />
};

const typeColors = {
  reduction: 'bg-green-100 text-green-800',
  purchase: 'bg-blue-100 text-blue-800',
  optimization: 'bg-purple-100 text-purple-800'
};

export default function AIRecommendations() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Brain className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI-Powered Recommendations</h2>
            <p className="text-sm text-gray-600">Personalized insights to optimize your carbon strategy</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {mockRecommendations.map((rec) => (
            <div key={rec.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${typeColors[rec.type]}`}>
                    {typeIcons[rec.type]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {rec.category}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-600">
                    {rec.impact} tons CO₂
                  </div>
                  <div className="text-xs text-gray-500">potential impact</div>
                </div>
              </div>

              <p className="text-gray-700 mb-3">{rec.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Confidence:</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${rec.confidence}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{rec.confidence}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200">
                    Learn More
                  </button>
                  <button className="px-3 py-1 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors duration-200">
                    Take Action
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Brain className="w-5 h-5 text-indigo-600" />
            <div>
              <h4 className="font-medium text-gray-900">AI Learning Progress</h4>
              <p className="text-sm text-gray-600">Your AI assistant becomes more accurate with each interaction</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Model Accuracy</span>
              <span className="text-indigo-600 font-medium">94.2%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full w-[94.2%] transition-all duration-1000"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}