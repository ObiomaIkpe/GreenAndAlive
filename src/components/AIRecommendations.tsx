import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Lightbulb, Target, Coins, RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-react';
import { aiService } from '../services/aiService';
import { aiServiceAPI, AIRecommendationAPI } from '../services/aiServiceAPI';
import { useAsync } from '../hooks/useAsync';
import { localStorageService } from '../services/localStorage';
import { notificationService } from '../services/notificationService';
import { config } from '../config/environment';
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
  const [recommendations, setRecommendations] = useState<AIRecommendationAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); 
  const [retryCount, setRetryCount] = useState(0);
  const [apiKeyStatus, setApiKeyStatus] = useState(aiService.getApiKeyStatus());

  // Check if AI service is in fallback mode
  const [isFallbackMode, setIsFallbackMode] = useState(aiService.isInFallbackMode());

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await aiServiceAPI.getRecommendations({ dismissed: false });
      setRecommendations(data);
      
      // Update fallback mode status
      setIsFallbackMode(aiService.isInFallbackMode());
      setApiKeyStatus(aiService.getApiKeyStatus());
      
      if (data.length === 0 && retryCount < 2) {
        // If no recommendations and we haven't tried generating yet, try to generate some
        setRetryCount(prev => prev + 1);
        await generateNewRecommendations();
        return;
      }
    } catch (err) {
      setError('Failed to load recommendations. Please check your API configuration.');
      console.error('Error loading recommendations:', err);
      
      // Update fallback mode status
      setIsFallbackMode(true);
      setApiKeyStatus(aiService.getApiKeyStatus());
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    await loadRecommendations();
  };

  useEffect(() => {
    loadInitialData();
  }, [refreshTrigger]);

  const { data: prediction } = useAsync(
    () => aiServiceAPI.predictEmissions({
      monthly_emissions: [45, 42, 48, 41, 39, 37, 35, 33, 31, 29, 27, 25],
      activities: ['electricity', 'transportation', 'heating'],
      seasonal_factors: true
    }),
    []
  );

  const { data: insights } = useAsync(
    () => aiServiceAPI.analyzeBehavior({
      daily_activities: [
        { date: '2024-01-15', electricity: 12, transport: 8, heating: 5 },
        { date: '2024-01-14', electricity: 11, transport: 12, heating: 6 }
      ],
      patterns: ['weekend_spikes', 'morning_commute'],
      goals: ['reduce_transport', 'carbon_neutral']
    }),
    []
  );

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    setRetryCount(0);
    
    // Reset fallback mode to try using the API again
    aiService.resetFallbackMode();
    setIsFallbackMode(false);
    setApiKeyStatus(aiService.getApiKeyStatus());
    
    notificationService.info('Refreshing Recommendations', 'Getting latest AI recommendations...');
  };

  const generateNewRecommendations = async () => {
    setLoading(true);
    try {
      if (!config.ai.apiKey) {
        notificationService.warning(
          'API Key Configuration',
          'Using your OpenAI API key to generate recommendations'
        );
      } else {
        // Reset fallback mode to try using the API again
        aiService.resetFallbackMode();
        setIsFallbackMode(false);
        setApiKeyStatus(aiService.getApiKeyStatus());
      }
      
      await aiServiceAPI.generateRecommendations(userProfile);
      await loadRecommendations();
      
      // Check if we fell back to mock data
      setIsFallbackMode(aiService.isInFallbackMode());
      setApiKeyStatus(aiService.getApiKeyStatus());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to generate recommendations: ${errorMessage}`);
      console.error('Error generating recommendations:', err);
      setIsFallbackMode(true);
      setApiKeyStatus(aiService.getApiKeyStatus());
    } finally {
      setLoading(false);
    }
  };

  const handleImplement = async (recommendationId: string, title: string) => {
    try {
      await aiServiceAPI.implementRecommendation(recommendationId);
      await loadRecommendations();
    } catch (err) {
      notificationService.error('Failed to implement', 'Could not mark recommendation as implemented');
    }
  };

  const handleDismiss = async (recommendationId: string, title: string) => {
    try {
      await aiServiceAPI.dismissRecommendation(recommendationId);
      await loadRecommendations();
    } catch (err) {
      notificationService.error('Failed to dismiss', 'Could not dismiss recommendation');
    }
  };

  const handleLearnMore = (recommendation: AIRecommendationAPI) => {
    notificationService.info(
      'Learn More',
      `Opening detailed information about "${recommendation.title}"`
    );
    // In a real app, this would open a modal or navigate to a detailed page
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

  const visibleRecommendations = recommendations.filter(rec => !rec.dismissed);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">AI is analyzing your carbon profile...</p> 
          <p className="mt-2 text-sm text-gray-500">Using OpenAI API with {config.ai.model}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isFallbackMode ? 'Using Fallback Recommendations' : 'AI Service Unavailable'}
          </h3>
          <p className="text-gray-600 mb-2">
            {isFallbackMode 
              ? 'The AI service is currently unavailable. We\'re showing pre-generated recommendations instead.' 
              : error}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            API Key Status: {apiKeyStatus}
          </p>
          <button
            onClick={handleRefresh}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            {isFallbackMode ? 'Retry AI Connection' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with AI Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Brain className={`w-5 h-5 sm:w-6 sm:h-6 ${isFallbackMode ? 'text-yellow-600' : 'text-indigo-600'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">AI-Powered Recommendations</h2>
                <p className="text-sm text-gray-600">Personalized insights powered by advanced machine learning</p>
              </div>
            </div>
            
            {isFallbackMode && (
              <div className="absolute top-0 right-0 -mt-4 sm:mt-0 sm:relative sm:mb-0 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                Using Fallback Data
              </div>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 w-full sm:w-auto justify-center"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={generateNewRecommendations}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 w-full sm:w-auto justify-center"
              >
                <Brain className="w-4 h-4" />
                <span>Generate New</span>
              </button>
            </div>
          </div>
        </div>

        {/* AI Insights Summary */}
        {insights && (  
          <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
            {isFallbackMode && (
              <div className="mb-4 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                Note: These insights are based on pre-generated data while the AI service is unavailable.
              </div>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-indigo-600">{insights.behavior_score}</div>
                <div className="text-xs sm:text-sm text-gray-600">Efficiency Score</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{insights.improvement_suggestions.length}</div>
                <div className="text-xs sm:text-sm text-gray-600">Improvement Potential</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-emerald-600">{insights.insights.length}</div>
                <div className="text-xs sm:text-sm text-gray-600">vs Similar Users</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{prediction?.confidence || 85}%</div>
                <div className="text-xs sm:text-sm text-gray-600">Prediction Confidence</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Carbon Prediction */}
      {prediction && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Carbon Emission Prediction</h3>
            {isFallbackMode && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Fallback Data
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{prediction.predictedEmissions.toFixed(1)} tons</div>
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
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center justify-between relative">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Personalized Recommendations</h3>
              <p className="text-sm text-gray-600">AI-generated suggestions based on your profile and behavior patterns</p>
              {isFallbackMode && (
                <p className="text-xs text-yellow-600 mt-1">Using pre-generated recommendations while AI service is unavailable</p>
              )}
            </div>
            {isFallbackMode && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Fallback Data
              </span>
            )}
            <div className="text-sm text-gray-500">
              {recommendations.filter(r => r.implemented).length} implemented • {recommendations.filter(r => r.dismissed).length} dismissed
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {visibleRecommendations.length > 0 ? (
            <div className="space-y-4">
              {visibleRecommendations.map((rec) => (
                <div 
                  key={rec.id} 
                  className={`border-l-4 ${priorityColors[rec.priority]} border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-all duration-200 ${
                    rec.implemented ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-lg ${typeColors[rec.type]} flex-shrink-0`}>
                        {typeIcons[rec.type as keyof typeof typeIcons]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                          {rec.implemented && (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
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
                    
                    <div className="flex items-start space-x-2">
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-emerald-600">
                          {rec.impact} tons CO₂
                        </div>
                        <div className="text-xs text-gray-500">potential impact</div>
                      </div>
                      
                      <button
                        onClick={() => handleDismiss(rec.id, rec.title)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        title="Dismiss recommendation"
                      >
                        <X className="w-4 h-4" />
                      </button>
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
                            <span className="text-indigo-600 font-medium flex-shrink-0">{index + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Confidence:</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
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
                      <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-full w-fit">
                        <Coins className="w-4 h-4 text-yellow-600" />
                        Implemented
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-xs text-gray-500">
                      AI-powered recommendation • Smart contract rewards available
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleLearnMore(rec)}
                        className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                      >
                        Learn More
                      </button>
                      {!rec.implemented ? (
                        <button 
                          onClick={() => handleImplement(rec.id, rec.title)}
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
          ) : (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recommendations available</p>
              <p className="text-sm text-gray-500 mt-1">All recommendations have been implemented or dismissed</p>
              <button
                onClick={generateNewRecommendations}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                Get New Recommendations
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Learning Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className={`w-5 h-5 ${isFallbackMode ? 'text-yellow-600' : 'text-indigo-600'}`} />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">AI Learning Progress</h4>
            <p className="text-sm text-gray-600">
              {isFallbackMode
                ? 'AI service is in fallback mode - using pre-generated data'
                : 'Your AI assistant becomes more accurate with each interaction'
              }
            </p>
          </div>
          {isFallbackMode && (
            <button
              onClick={generateNewRecommendations}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Try Reconnecting
            </button>
          )}
        </div>
        
        {isFallbackMode && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">AI Service Unavailable</p>
                <p className="text-xs text-yellow-700 mt-1">
                  The AI service is currently unavailable. This could be due to:
                </p> 
                <ul className="text-xs text-yellow-700 mt-1 space-y-1 list-disc pl-4">
                  <li>Missing or invalid API key in environment variables</li>
                  <li>Network connectivity issues</li>
                  <li>Rate limiting from the AI provider</li>
                  <li>Temporary service outage</li>
                </ul>
                <button
                  onClick={generateNewRecommendations}
                  className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 underline"
                >
                  Try reconnecting to AI service
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-90">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">API Status</span>
              <span className={`font-medium ${isFallbackMode ? 'text-yellow-600' : 'text-indigo-600'}`}>
                {isFallbackMode ? 'Fallback Mode' : 'Connected'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${
                  isFallbackMode 
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 w-[30%]' 
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 w-[94.2%]'
                }`}
              ></div>
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
              <span className="text-gray-600">API Key</span>
              <span className={`font-medium ${
                apiKeyStatus === 'Valid and working' ? 'text-green-600' : 
                apiKeyStatus === 'Valid but service unavailable' ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {apiKeyStatus}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${
                  apiKeyStatus === 'Valid and working' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 w-[100%]' 
                    : apiKeyStatus === 'Valid but service unavailable'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 w-[50%]'
                    : 'bg-gradient-to-r from-red-500 to-pink-500 w-[20%]'
                }`}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}