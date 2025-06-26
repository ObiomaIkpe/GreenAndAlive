import React, { useState } from 'react';
import { Brain, CheckCircle, XCircle, AlertTriangle, Loader } from 'lucide-react';
import { aiService } from '../services/aiService';
import { config } from '../config/environment';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export default function AITestDashboard() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (name: string, status: 'pending' | 'success' | 'error', message: string, duration?: number) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { ...t, status, message, duration } : t);
      }
      return [...prev, { name, status, message, duration }];
    });
  };

  const runAITests = async () => {
    setIsRunning(true);
    setTests([]);

    // Test 1: Configuration Check
    updateTest('Configuration', 'pending', 'Checking AI configuration...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!config.ai.apiKey) {
      updateTest('Configuration', 'error', 'OpenAI API key not found in environment variables');
    } else if (config.ai.apiKey.startsWith('sk-') && config.ai.apiKey.length > 20) {
      updateTest('Configuration', 'success', 'API key format is valid');
    } else {
      updateTest('Configuration', 'error', 'API key format appears invalid');
    }

    // Test 2: AI Recommendations
    updateTest('AI Recommendations', 'pending', 'Testing recommendation generation...');
    const startTime = Date.now();
    
    try {
      const recommendations = await aiService.generateRecommendations({
        carbonFootprint: 25.5,
        location: 'San Francisco, CA',
        lifestyle: ['urban', 'tech_worker'],
        preferences: ['renewable_energy', 'forest_conservation'],
        budget: 500
      });
      
      const duration = Date.now() - startTime;
      
      if (recommendations && recommendations.length > 0) {
        updateTest('AI Recommendations', 'success', 
          `Generated ${recommendations.length} recommendations successfully`, duration);
      } else {
        updateTest('AI Recommendations', 'error', 'No recommendations returned');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest('AI Recommendations', 'error', 
        `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, duration);
    }

    // Test 3: Carbon Predictions
    updateTest('Carbon Predictions', 'pending', 'Testing emission predictions...');
    const predictionStartTime = Date.now();
    
    try {
      const prediction = await aiService.predictCarbonEmissions({
        monthly_emissions: [45, 42, 48, 41, 39, 37, 35, 33, 31, 29, 27, 25],
        activities: ['electricity', 'transportation', 'heating'],
        seasonal_factors: true
      });
      
      const duration = Date.now() - predictionStartTime;
      
      if (prediction && prediction.predictedEmissions) {
        updateTest('Carbon Predictions', 'success', 
          `Predicted ${prediction.predictedEmissions.toFixed(1)} tons CO₂`, duration);
      } else {
        updateTest('Carbon Predictions', 'error', 'Invalid prediction response');
      }
    } catch (error) {
      const duration = Date.now() - predictionStartTime;
      updateTest('Carbon Predictions', 'error', 
        `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, duration);
    }

    // Test 4: Efficiency Analysis
    updateTest('Efficiency Analysis', 'pending', 'Testing efficiency analysis...');
    const analysisStartTime = Date.now();
    
    try {
      const insights = await aiService.analyzeEfficiency({
        emissions: 32.4,
        activities: {
          electricity: 12.5,
          transportation: 8.2,
          heating: 6.7,
          air_travel: 5.0
        },
        location: 'San Francisco, CA',
        demographics: 'urban_professional'
      });
      
      const duration = Date.now() - analysisStartTime;
      
      if (insights && insights.carbonEfficiencyScore) {
        updateTest('Efficiency Analysis', 'success', 
          `Efficiency score: ${insights.carbonEfficiencyScore}/100`, duration);
      } else {
        updateTest('Efficiency Analysis', 'error', 'Invalid analysis response');
      }
    } catch (error) {
      const duration = Date.now() - analysisStartTime;
      updateTest('Efficiency Analysis', 'error', 
        `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, duration);
    }

    // Test 5: Behavior Analysis
    updateTest('Behavior Analysis', 'pending', 'Testing behavioral analysis...');
    const behaviorStartTime = Date.now();
    
    try {
      const behavior = await aiService.analyzeBehavior({
        daily_activities: [
          { date: '2024-01-15', electricity: 12, transport: 8, heating: 5 },
          { date: '2024-01-14', electricity: 11, transport: 12, heating: 6 },
          { date: '2024-01-13', electricity: 13, transport: 6, heating: 4 }
        ],
        patterns: ['weekend_spikes', 'morning_commute'],
        goals: ['reduce_transport', 'carbon_neutral']
      });
      
      const duration = Date.now() - behaviorStartTime;
      
      if (behavior && behavior.behavior_score) {
        updateTest('Behavior Analysis', 'success', 
          `Behavior score: ${behavior.behavior_score}/100`, duration);
      } else {
        updateTest('Behavior Analysis', 'error', 'Invalid behavior analysis response');
      }
    } catch (error) {
      const duration = Date.now() - behaviorStartTime;
      updateTest('Behavior Analysis', 'error', 
        `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, duration);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;
  const totalTests = tests.length;

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
              <h2 className="text-xl font-semibold text-gray-900">AI Integration Test Dashboard</h2>
              <p className="text-sm text-gray-600">Verify AI services are working correctly</p>
            </div>
          </div>
          
          <button
            onClick={runAITests}
            disabled={isRunning}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            {isRunning ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                <span>Run AI Tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Configuration Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">API Key</span>
              {config.ai.apiKey ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {config.ai.apiKey ? 'Configured' : 'Missing'}
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">AI Model</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">{config.ai.model}</p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Base URL</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {config.ai.baseUrl.includes('openai') ? 'OpenAI' : 'Custom'}
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Features</span>
              {config.features.aiRecommendations ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {config.features.aiRecommendations ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {tests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-green-600 font-medium">{successCount} passed</span>
              <span className="text-red-600 font-medium">{errorCount} failed</span>
              <span className="text-gray-600">{totalTests} total</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={index} className={`border rounded-lg p-4 ${getStatusColor(test.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">{test.name}</h4>
                      <p className="text-sm text-gray-600">{test.message}</p>
                    </div>
                  </div>
                  {test.duration && (
                    <span className="text-xs text-gray-500">{test.duration}ms</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {tests.length > 0 && !isRunning && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
          
          {errorCount === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">All AI tests passed!</span>
              </div>
              <p className="text-sm text-green-800 mt-2">
                Your AI integration is working correctly. You can now:
              </p>
              <ul className="text-sm text-green-800 mt-2 space-y-1">
                <li>• Navigate to "AI Recommendations" to see personalized suggestions</li>
                <li>• Check "AI Insights" for advanced behavioral analysis</li>
                <li>• Use the carbon calculator with AI-powered recommendations</li>
                <li>• Proceed with production deployment</li>
              </ul>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">Some tests failed</span>
              </div>
              <p className="text-sm text-red-800 mt-2">
                Please check your configuration and try again:
              </p>
              <ul className="text-sm text-red-800 mt-2 space-y-1">
                <li>• Verify your OpenAI API key is correct</li>
                <li>• Check your internet connection</li>
                <li>• Ensure you have sufficient API credits</li>
                <li>• Review the error messages above</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}