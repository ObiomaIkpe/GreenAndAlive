import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, BarChart3, Zap, AlertTriangle } from 'lucide-react';
import { aiService } from '../services/aiService';
import { useAsync } from '../hooks/useAsync';
import LoadingSpinner from './LoadingSpinner';

export default function AIInsights() {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  
  const { data: behaviorAnalysis, loading: behaviorLoading } = useAsync(
    () => aiService.analyzeBehavior({
      daily_activities: [
        { date: '2024-01-15', electricity: 12, transport: 8, heating: 5 },
        { date: '2024-01-14', electricity: 11, transport: 12, heating: 6 },
        { date: '2024-01-13', electricity: 13, transport: 6, heating: 4 }
      ],
      patterns: ['weekend_spikes', 'morning_commute', 'evening_heating'],
      goals: ['reduce_transport', 'optimize_heating', 'carbon_neutral']
    }),
    [timeframe]
  );

  const { data: creditRecommendations, loading: creditLoading } = useAsync(
    () => aiService.recommendCarbonCredits({
      budget: 500,
      impact_preference: ['forest_conservation', 'renewable_energy'],
      location_preference: ['local', 'north_america'],
      certification_preference: ['VCS', 'Gold_Standard'],
      risk_tolerance: 'medium'
    }),
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Insights Dashboard</h2>
              <p className="text-sm text-gray-600">Advanced analytics and behavioral patterns</p>
            </div>
          </div>
          
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as 'week' | 'month' | 'quarter')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
          </select>
        </div>
      </div>

      {/* Behavior Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Behavioral Analysis</h3>
          <p className="text-sm text-gray-600">AI-powered insights into your carbon habits</p>
        </div>

        <div className="p-6">
          {behaviorLoading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Analyzing behavior patterns...</p>
            </div>
          ) : behaviorAnalysis ? (
            <div className="space-y-6">
              {/* Behavior Score */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Behavior Score</h4>
                  <div className="text-3xl font-bold text-purple-600">{behaviorAnalysis.behavior_score}/100</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${behaviorAnalysis.behavior_score}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {behaviorAnalysis.behavior_score >= 80 ? 'Excellent sustainability habits!' :
                   behaviorAnalysis.behavior_score >= 60 ? 'Good progress with room for improvement' :
                   'Significant opportunities for carbon reduction'}
                </p>
              </div>

              {/* Key Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
                    Key Insights
                  </h4>
                  <div className="space-y-2">
                    {behaviorAnalysis.insights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <span className="text-sm text-blue-900">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Zap className="w-5 h-5 text-orange-600 mr-2" />
                    Improvement Suggestions
                  </h4>
                  <div className="space-y-2">
                    {behaviorAnalysis.improvement_suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-orange-50 rounded-lg">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <span className="text-sm text-orange-900">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Habit Recommendations */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600 mr-2" />
                  Habit Recommendations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {behaviorAnalysis.habit_recommendations.map((habit, index) => (
                    <div key={index} className="p-4 border border-emerald-200 rounded-lg hover:border-emerald-300 transition-colors duration-200">
                      <span className="text-sm font-medium text-emerald-900">{habit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Unable to load behavior analysis</p>
            </div>
          )}
        </div>
      </div>

      {/* Smart Credit Recommendations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">AI Credit Recommendations</h3>
          <p className="text-sm text-gray-600">Personalized carbon credit portfolio suggestions</p>
        </div>

        <div className="p-6">
          {creditLoading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Analyzing credit opportunities...</p>
            </div>
          ) : creditRecommendations ? (
            <div className="space-y-6">
              {/* Portfolio Allocation */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Recommended Portfolio Allocation</h4>
                <div className="space-y-3">
                  {Object.entries(creditRecommendations.portfolio_allocation).map(([type, percentage]) => (
                    <div key={type} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 capitalize">{type.replace('_', ' ')}</span>
                        <span className="text-sm font-bold text-gray-900">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            type === 'forest' ? 'bg-green-500' :
                            type === 'renewable' ? 'bg-blue-500' :
                            'bg-purple-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-semibold text-indigo-900 mb-2">AI Reasoning</h4>
                <p className="text-sm text-indigo-800">{creditRecommendations.reasoning}</p>
              </div>

              {/* Recommended Credits */}
              {creditRecommendations.recommended_credits.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Top Recommended Credits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {creditRecommendations.recommended_credits.slice(0, 4).map((credit, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors duration-200">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{credit.description || 'Carbon Credit'}</h5>
                          <span className="text-lg font-bold text-emerald-600">${credit.price}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{credit.location}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                            {credit.type}
                          </span>
                          <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Unable to load credit recommendations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}