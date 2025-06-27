import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle, XCircle, AlertTriangle, Loader, Clock, Settings, Key, Zap } from 'lucide-react';
import { openaiService } from '../services/openaiService';
import { notificationService } from '../services/notificationService';
import { config } from '../config/environment';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
  details?: any;
}

export default function OpenAITestDashboard() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [configuration, setConfiguration] = useState(openaiService.getConfiguration());
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    setRequestCount(openaiService.getRequestCount());
  }, [tests]);

  const updateTest = (name: string, status: 'pending' | 'success' | 'error', message: string, duration?: number, details?: any) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { ...t, status, message, duration, details } : t);
      }
      return [...prev, { name, status, message, duration, details }];
    });
  };

  const runConnectionTest = async () => {
    setIsRunning(true);
    setTests([]);

    // Test 1: Configuration Check
    updateTest('Configuration', 'pending', 'Checking OpenAI configuration...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!configuration.hasApiKey) {
      updateTest('Configuration', 'error', 'OpenAI API key not found in environment variables');
      setIsRunning(false);
      return;
    } else {
      updateTest('Configuration', 'success', `API key configured for model: ${configuration.model}`);
    }

    // Test 2: Connection Test
    updateTest('Connection', 'pending', 'Testing OpenAI API connection...');
    const startTime = Date.now();
    
    try {
      const result = await openaiService.testConnection();
      const duration = Date.now() - startTime;
      
      if (result.success) {
        updateTest('Connection', 'success', result.message, duration, result.details);
      } else {
        updateTest('Connection', 'error', result.message, duration, result.details);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTest('Connection', 'error', `Connection failed: ${errorMessage}`, duration);
    }

    setIsRunning(false);
  };

  const runFullAITest = async () => {
    setIsRunning(true);
    setTests([]);

    // Run connection test first
    await runConnectionTest();
    
    // Wait a bit for rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: AI Recommendations
    updateTest('AI Recommendations', 'pending', 'Testing recommendation generation...');
    const recStartTime = Date.now();
    
    try {
      const recommendations = await openaiService.generateCarbonRecommendations({
        carbonFootprint: 25.5,
        location: 'San Francisco, CA',
        lifestyle: ['urban', 'tech_worker'],
        preferences: ['renewable_energy'],
        budget: 500
      });
      
      const duration = Date.now() - recStartTime;
      
      if (recommendations && recommendations.length > 0) {
        updateTest('AI Recommendations', 'success', 
          `Generated ${recommendations.length} recommendations successfully`, duration, recommendations);
      } else {
        updateTest('AI Recommendations', 'error', 'No recommendations returned', duration);
      }
    } catch (error) {
      const duration = Date.now() - recStartTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTest('AI Recommendations', 'error', `Failed: ${errorMessage}`, duration);
    }

    // Wait for rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 4: Carbon Predictions
    updateTest('Carbon Predictions', 'pending', 'Testing emission predictions...');
    const predStartTime = Date.now();
    
    try {
      const prediction = await openaiService.predictCarbonEmissions({
        monthly_emissions: [45, 42, 48, 41, 39, 37],
        activities: ['electricity', 'transportation'],
        seasonal_factors: true
      });
      
      const duration = Date.now() - predStartTime;
      
      if (prediction && prediction.predictedEmissions) {
        updateTest('Carbon Predictions', 'success', 
          `Predicted ${prediction.predictedEmissions.toFixed(1)} tons CO₂`, duration, prediction);
      } else {
        updateTest('Carbon Predictions', 'error', 'Invalid prediction response', duration);
      }
    } catch (error) {
      const duration = Date.now() - predStartTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTest('Carbon Predictions', 'error', `Failed: ${errorMessage}`, duration);
    }

    // Wait for rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 5: Behavior Analysis
    updateTest('Behavior Analysis', 'pending', 'Testing behavior analysis...');
    const behaviorStartTime = Date.now();
    
    try {
      const analysis = await openaiService.analyzeBehavior({
        daily_activities: [
          { date: '2024-01-15', electricity: 12, transport: 8, heating: 5 },
          { date: '2024-01-14', electricity: 11, transport: 12, heating: 6 }
        ],
        patterns: ['weekend_spikes', 'morning_commute'],
        goals: ['reduce_transport', 'carbon_neutral']
      });
      
      const duration = Date.now() - behaviorStartTime;
      
      if (analysis && analysis.behavior_score) {
        updateTest('Behavior Analysis', 'success', 
          `Analysis complete with score: ${analysis.behavior_score}/100`, duration, analysis);
      } else {
        updateTest('Behavior Analysis', 'error', 'Invalid analysis response', duration);
      }
    } catch (error) {
      const duration = Date.now() - behaviorStartTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTest('Behavior Analysis', 'error', `Failed: ${errorMessage}`, duration);
    }

    setIsRunning(false);
    setRequestCount(openaiService.getRequestCount());
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
              <h2 className="text-xl font-semibold text-gray-900">OpenAI Integration Test Dashboard</h2>
              <p className="text-sm text-gray-600">Verify OpenAI services are working correctly</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={runConnectionTest}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
            >
              {isRunning ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Quick Test</span>
                </>
              )}
            </button>
            
            <button
              onClick={runFullAITest}
              disabled={isRunning}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
            >
              {isRunning ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span>Full AI Test</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="w-5 h-5 text-gray-600 mr-2" />
          OpenAI Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">API Key</span>
              {configuration.hasApiKey ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {configuration.hasApiKey ? 'Configured' : 'Missing'}
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">AI Model</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">{configuration.model}</p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Base URL</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {configuration.baseUrl.includes('openai') ? 'OpenAI' : 'Custom'}
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Requests Made</span>
              <span className="text-sm font-bold text-purple-600">{requestCount}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">This session</p>
          </div>
        </div>
      </div>

      {/* Rate Limit Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-yellow-600" />
          <div>
            <h3 className="font-medium text-yellow-900">Rate Limiting Information</h3>
            <p className="text-sm text-yellow-800 mt-1">
              OpenAI has rate limits to prevent abuse. Current limits for different tiers:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <div className="bg-yellow-100 rounded-lg p-3">
                <h4 className="font-medium text-yellow-900 text-sm">Free Tier</h4>
                <ul className="text-xs text-yellow-800 mt-1 space-y-1">
                  <li>• 3 requests per minute</li>
                  <li>• 200 requests per day</li>
                  <li>• $5 monthly usage limit</li>
                </ul>
              </div>
              <div className="bg-yellow-100 rounded-lg p-3">
                <h4 className="font-medium text-yellow-900 text-sm">Pay-as-you-go</h4>
                <ul className="text-xs text-yellow-800 mt-1 space-y-1">
                  <li>• 3,500 requests per minute</li>
                  <li>• 10,000 requests per day</li>
                  <li>• Based on usage</li>
                </ul>
              </div>
              <div className="bg-yellow-100 rounded-lg p-3">
                <h4 className="font-medium text-yellow-900 text-sm">Tips</h4>
                <ul className="text-xs text-yellow-800 mt-1 space-y-1">
                  <li>• Wait between test runs</li>
                  <li>• Use Quick Test first</li>
                  <li>• Monitor your usage</li>
                </ul>
              </div>
            </div>
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
                      {test.details && test.status === 'success' && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">View Details</summary>
                          <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-32">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
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

      {/* Setup Instructions */}
      {!configuration.hasApiKey && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Key className="w-5 h-5 text-gray-600 mr-2" />
            OpenAI Setup Instructions
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="font-medium text-gray-900">Get OpenAI API Key</h4>
                <p className="text-sm text-gray-600">Visit OpenAI Platform and create an API key</p>
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm underline"
                >
                  Get API Key →
                </a>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="font-medium text-gray-900">Add to Environment</h4>
                <p className="text-sm text-gray-600">Add your API key to the .env file:</p>
                <code className="block text-xs bg-gray-100 p-2 rounded mt-1">
                  VITE_OPENAI_API_KEY=sk-your-api-key-here
                </code>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="font-medium text-gray-900">Restart Application</h4>
                <p className="text-sm text-gray-600">Restart the development server to load the new environment variable</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      {tests.length > 0 && !isRunning && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
          
          {errorCount === 0 && successCount > 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">OpenAI integration is working!</span>
              </div>
              <p className="text-sm text-green-800 mt-2">
                Your OpenAI integration is working correctly. You can now:
              </p>
              <ul className="text-sm text-green-800 mt-2 space-y-1">
                <li>• Navigate to "AI Recommendations" to see personalized suggestions</li>
                <li>• Check "AI Insights" for advanced behavioral analysis</li>
                <li>• Use the carbon calculator with AI-powered recommendations</li>
                <li>• Test blockchain integration on the "Testnet" tab</li>
              </ul>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">Some tests failed</span>
              </div>
              <p className="text-sm text-red-800 mt-2">
                Common solutions for OpenAI integration issues:
              </p>
              <ul className="text-sm text-red-800 mt-2 space-y-1">
                <li>• Verify your API key is correct and active</li>
                <li>• Check your OpenAI account has sufficient credits</li>
                <li>• Wait 2-3 minutes between test runs for rate limits</li>
                <li>• Ensure your API key has the correct permissions</li>
                <li>• Try using "gpt-3.5-turbo" model if "gpt-4" fails</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}