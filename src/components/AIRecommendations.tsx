import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Lightbulb, Target, Coins, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { aiService, AIRecommendation } from '../services/aiService';
import { useAsync } from '../hooks/useAsync';
import LoadingSpinner from './LoadingSpinner';

export default function AIRecommendations() {
  const [userProfile] = useState({
    carbonFootprint: 32.4,
    location: 'San Francisco, CA',
    lifestyle: ['urban', 'tech_worker', 'environmentally_conscious'],
    preferences: ['renewable_energy', 'forest_conservation', 'local_projects'],
    budget: 500
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [implementedRecommendations, setImplementedRecommendations] = useState<Set<string>>(new Set());

  const { data: recommendations, loading, error, refetch } = useAsync(
    () => aiService.generateRecommendations(userProfile),
    [userProfile, refreshTrigger]
  );

  const { data: prediction } = useAsync(
    () => aiService.predictCarbonEmissions({
      monthly_emissions: [45, 42, 48, 41, 39, 37, 35, 33, 31, 29, 27, 25],
      activities: ['electricity', 'transportation', 'heating'],
      seasonal_factors: true
    }),
    []
  );

  const { data: insights } = useAsync(
    () => aiService.analyzeEfficiency({
      emissions: userProfile.carbonFootprint,
      activities: {
        electricity: 12.5,
        transportation: 8.2,
        heating: 6.7,
        air_travel: 5.0
      },
      location: userProfile.location,
      demographics: 'urban_professional'
    }),
    []
  );

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleImplement = (recommendationId: string) => {
    setImplementedRecommendations(prev => new Set([...prev, recommendationId]));
    // Here you would typically call an API to track implementation
  };

  const typeIcons = {
    reduction: <Target className="w-5 h-5" />,
    purchase: <TrendingUp className="w-5 h-5" />,
    optimization: <Lightbulb className="w-5 h-5" />,
    behavioral: <Brain className="w-5 h-5" />
  };

  const typeColors = {
    reduction: 'bg-green-100 text-green-800',
    purchase: 'bg-blue-100 text-blue-800',
    optimization: 'bg-purple-100 text-purple-800',
    behavioral: 'bg-orange-100 text-orange-800'
  };

  const priorityColors = {
    low: 'border-l-gray-400',
    medium: 'border-l-yellow-400',
    high: 'border-l-orange-400',
    critical: 'border-l-red-400'
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">AI is analyzing your carbon profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Service Unavailable</h3>
          <p className="text-gray-600 mb-4">Unable to generate recommendations at this time.</p>
          <button
            onClick={() => refetch()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with AI Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Brain className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">AI-Powered Recommendations</h2>
                <p className="text-sm text-gray-600">Personalized insights powered by advanced machine learning</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* AI Insights Summary */}
        {insights && (
          <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{insights.carbonEfficiencyScore}</div>
                <div className="text-sm text-gray-600">Efficiency Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{insights.improvementPotential}%</div>
                <div className="text-sm text-gray-600">Improvement Potential</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{insights.benchmarkComparison.similar_users}</div>
                <div className="text-sm text-gray-600">vs Similar Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{prediction?.confidence || 85}%</div>
                <div className="text-sm text-gray-600">Prediction Confidence</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Carbon Prediction */}
      {prediction && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Carbon Emission Prediction</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{prediction.predictedEmissions.toFixed(1)} tons</div>
              <div className="text-sm text-blue-800">Predicted Next Quarter</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="text-lg font-bold text-emerald-600 capitalize">{prediction.trend}</div>
              <div className="text-sm text-emerald-800">Emission Trend</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-lg font-bold text-purple-600">{prediction.confidence}%</div>
              <div className="text-sm text-purple-800">Confidence Level</div>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">Key Factors:</h4>
            <div className="flex flex-wrap gap-2">
              {prediction.factors.map((factor, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {factor}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Personalized Recommendations</h3>
          <p className="text-sm text-gray-600">AI-generated suggestions based on your profile and behavior patterns</p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {recommendations?.map((rec) => (
              <div 
                key={rec.id} 
                className={`border-l-4 ${priorityColors[rec.priority]} border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-all duration-200 ${
                  implementedRecommendations.has(rec.id) ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${typeColors[rec.type]}`}>
                      {typeIcons[rec.type]}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                        {implementedRecommendations.has(rec.id) && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {rec.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rec.priority} priority
                        </span>
                      </div>
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

                {/* Action Steps */}
                {rec.actionSteps && rec.actionSteps.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Action Steps:</h4>
                    <ol className="text-sm text-gray-600 space-y-1">
                      {rec.actionSteps.map((step, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-indigo-600 font-medium">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
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
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Timeframe:</span> {rec.timeframe}
                    </div>
                    {rec.estimatedCost && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Cost:</span> ${rec.estimatedCost}
                      </div>
                    )}
                  </div>
                  
                  {rec.rewardPotential && (
                    <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-full">
                      <Coins className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">+{rec.rewardPotential} CARB</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    AI-powered recommendation • Smart contract rewards available
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200">
                      Learn More
                    </button>
                    {!implementedRecommendations.has(rec.id) ? (
                      <button 
                        onClick={() => handleImplement(rec.id)}
                        className="px-3 py-1 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                      >
                        Implement
                      </button>
                    ) : (
                      <span className="px-3 py-1 text-sm text-green-600 bg-green-100 rounded-md">
                        Implemented ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Learning Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="w-5 h-5 text-indigo-600" />
          <div>
            <h4 className="font-medium text-gray-900">AI Learning Progress</h4>
            <p className="text-sm text-gray-600">Your AI assistant becomes more accurate with each interaction</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Model Accuracy</span>
              <span className="text-indigo-600 font-medium">94.2%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full w-[94.2%] transition-all duration-1000"></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Data Points</span>
              <span className="text-emerald-600 font-medium">2,847</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full w-[85%] transition-all duration-1000"></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Personalization</span>
              <span className="text-purple-600 font-medium">87.5%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full w-[87.5%] transition-all duration-1000"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}