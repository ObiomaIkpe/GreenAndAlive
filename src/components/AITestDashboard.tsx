import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle, XCircle, AlertTriangle, Loader, Clock, AlertCircle } from 'lucide-react';
import { aiService } from '../services/aiService';
import { openaiService } from '../services/openaiService';
import { aiServiceAPI } from '../services/aiServiceAPI';
import { config } from '../config/environment';
import { notificationService } from '../services/notificationService';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export default function AITestDashboard() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false); 
  const [fallbackMode, setFallbackMode] = useState(aiService.isInFallbackMode());
  const [apiKeyMasked, setApiKeyMasked] = useState<string>('');

  useEffect(() => {
    // Mask the API key for display
    if (config.ai.apiKey) {
      const key = config.ai.apiKey; 
      if (key.startsWith('sk-proj-')) {
        setApiKeyMasked(`sk-proj-...${key.slice(-4)}`);
      } else if (key.startsWith('sk-')) {
        setApiKeyMasked(`sk-...${key.slice(-4)}`); 
      } else {
        setApiKeyMasked('Invalid format');
      }
    } else {
      setApiKeyMasked('Not configured');
    }
  }, []);

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
    
    // Reset fallback mode to give the API another chance
    aiService.resetFallbackMode();
    setFallbackMode(false);

    // Test 1: Configuration Check
    updateTest('Configuration', 'pending', 'Checking AI configuration...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const apiKey = config.ai.apiKey;
    
    if (!apiKey) { 
      updateTest('Configuration', 'error', 'OpenAI API key not found in environment variables');
      setFallbackMode(true);
    } else if ((apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-')) && apiKey.length > 20) {
      updateTest('Configuration', 'success', `API key format appears valid (${apiKeyMasked})`);
    } else {
      updateTest('Configuration', 'error', `API key format appears invalid (${apiKey.substring(0, 5)}...)`);
      setFallbackMode(true);
    }

    // Add delay between tests to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: OpenAI Connection Test
    updateTest('API Connection', 'pending', 'Testing connection to OpenAI API...');
    const connectionStartTime = Date.now();

    try { 
      const connectionResult = await openaiService.testConnection();
      const duration = Date.now() - connectionStartTime;
      
      if (connectionResult.success) {
        updateTest('API Connection', 'success', 
          `Connected to OpenAI API successfully`, duration);
      } else {
        updateTest('API Connection', 'error', 
          connectionResult.message, duration);
        setFallbackMode(true);
      }
    } catch (error) {
      const duration = Date.now() - connectionStartTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTest('API Connection', 'error', 
        `Failed: ${errorMessage}`, duration);
      setFallbackMode(true);
    }
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: AI Recommendations
    updateTest('AI Recommendations', 'pending', 'Testing recommendation generation...');
    const startTime = Date.now();

    try { 
      // Use the API service that's used in the actual application
      const recommendations = await aiServiceAPI.generateRecommendations({
        carbonFootprint: 25.5,
        location: 'San Francisco, CA',
        lifestyle: ['urban', 'tech_worker'],
        preferences: ['renewable_energy'],
        budget: 500
      });
      
      const duration = Date.now() - startTime;
      
      if (recommendations?.length > 0) {
        updateTest('AI Recommendations', 'success',
          `Generated ${recommendations.length} recommendations successfully${aiService.isInFallbackMode() ? ' (using fallback)' : ''} in ${duration}ms`, duration);
        setFallbackMode(aiService.isInFallbackMode());
      } else {
        updateTest('AI Recommendations', 'error', 'No recommendations returned');
        setFallbackMode(true);
      }
    } catch (error) {
      const duration = Date.now() - startTime; 
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('rate limit')) {
        updateTest('AI Recommendations', 'error', 
          'Rate limit exceeded. Please wait a few minutes before testing again.', duration);
        setFallbackMode(true);
      } else {
        updateTest('AI Recommendations', 'error', 
          `Failed: ${errorMessage}`, duration);
        setFallbackMode(true);
      }
    }

    // Add longer delay for rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 4: Carbon Predictions (only if previous test succeeded)
    const recommendationTest = tests.find(t => t.name === 'AI Recommendations');
    if (recommendationTest?.status === 'success') {
      updateTest('Carbon Predictions', 'pending', 'Testing carbon emission predictions...');
      const predictionStartTime = Date.now(); 
      
      try {
        const prediction = await aiServiceAPI.predictEmissions({
          monthly_emissions: [45, 42, 48, 41, 39, 37],
          activities: ['electricity', 'transportation'],
          seasonal_factors: true
        });
        
        const duration = Date.now() - predictionStartTime;
        
        if (prediction && prediction.predictedEmissions) {
          const fallbackNote = aiService.isInFallbackMode() ? ' (using fallback)' : ''; 
          updateTest('Carbon Predictions', 'success', 
            `Predicted ${prediction.predictedEmissions.toFixed(1)} tons CO₂${fallbackNote} in ${duration}ms`, duration);
          setFallbackMode(aiService.isInFallbackMode());
        } else {
          updateTest('Carbon Predictions', 'error', 'Invalid prediction response');
          setFallbackMode(true);
        }
      } catch (error) {
        const duration = Date.now() - predictionStartTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        updateTest('Carbon Predictions', 'error', 
          `Failed: ${errorMessage}`, duration);
        setFallbackMode(true);
      }
    } else {
      updateTest('Carbon Predictions', 'error', 'Skipped due to previous test failure');
      setFallbackMode(true);
    }

    setIsRunning(false);
  };

  const runQuickTest = async () => {
    setIsRunning(true);
    setTests([]);

    // Quick configuration test only
    updateTest('Quick Configuration Test', 'pending', 'Checking basic setup...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const apiKey = config.ai.apiKey;
    
    // Reset fallback mode to give the API another chance 
    if (apiKey && (apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-'))) {
      aiService.resetFallbackMode();
      setFallbackMode(false);
    }
    
    if (!apiKey) {
      updateTest('Quick Configuration Test', 'error', 'OpenAI API key not found');
      setFallbackMode(true); 
    } else if (!apiKey.startsWith('sk-') && !apiKey.startsWith('sk-proj-')) {
      updateTest('Quick Configuration Test', 'error', 'Invalid API key format');
      setFallbackMode(true);
    } else {
      // Try a quick connection test
      try {
        const result = await openaiService.testConnection();
        if (result.success) {
          updateTest('Quick Configuration Test', 'success', 'Configuration looks good! Ready for AI features.');
        } else {
          updateTest('Quick Configuration Test', 'error', `API connection failed: ${result.message}`);
          setFallbackMode(true);
        }
      } catch (error) {
        updateTest('Quick Configuration Test', 'error', `API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setFallbackMode(true);
      }
    }

    setIsRunning(false);
  };

  const fixApiKey = () => {
    notificationService.info(
      'API Key Configuration',
      'To fix the API key, add your OpenAI API key to the .env file as VITE_OPENAI_API_KEY=sk-your-key-here'
    );
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
          <div className="flex items-center space-x-3 relative">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div> 
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">AI Integration Test Dashboard</h2>
              <p className="text-sm text-gray-600">Verify AI services are working correctly</p>
            </div>
            {fallbackMode && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                Fallback Mode Active
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={runQuickTest}
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
                  <CheckCircle className="w-4 h-4" />
                  <span>Quick Test</span>
                </>
              )}
            </button>
            
            <button
              onClick={runAITests}
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

      {/* Rate Limit Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-yellow-600" />
          <div>
            <h3 className="font-medium text-yellow-900">Rate Limiting Information</h3>
            <p className="text-sm text-yellow-800 mt-1">
              OpenAI has rate limits to prevent abuse. If you see rate limit errors:
            </p>
            <ul className="text-sm text-yellow-800 mt-2 space-y-1">
              <li>• Wait 1-2 minutes between test runs</li>
              <li>• Use "Quick Test" to check configuration without API calls</li>
              <li>• Consider upgrading your OpenAI plan for higher limits</li>
              <li>• Free tier: 3 requests per minute, 200 requests per day</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Configuration Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Status</h3>
        
        {fallbackMode && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">AI Service in Fallback Mode</p>
                <p className="text-xs text-yellow-700 mt-1">
                  The system is currently using pre-generated responses instead of live AI. This provides continuity 
                  when the AI service is unavailable.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">OpenAI API Key</span>
              {config.ai.apiKey ? (
                config.ai.apiKey.startsWith('sk-') ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                {config.ai.apiKey ? apiKeyMasked : 'Missing'}
              </p>
              {(!config.ai.apiKey || (!config.ai.apiKey.startsWith('sk-') && !config.ai.apiKey.startsWith('sk-proj-'))) && (
                <button 
                  onClick={fixApiKey}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Fix
                </button>
              )}
            </div>
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
              <div className="flex items-center space-x-1">
                {config.features.aiRecommendations ? ( 
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                {fallbackMode && (
                  <span className="text-xs text-yellow-600">(Fallback)</span>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {config.features.aiRecommendations 
                ? fallbackMode ? 'Enabled (Fallback Mode)' : 'Enabled' 
                : 'Disabled'}
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
                    (config.ai.apiKey.startsWith('sk-') || config.ai.apiKey.startsWith('sk-proj-')) ? (
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {fallbackMode ? 'Troubleshooting Steps' : 'Next Steps'}
          </h3>
          
          {!fallbackMode && errorCount === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">All tests passed!</span>
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
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">
                  {fallbackMode ? 'AI Service in Fallback Mode' : 'Some tests failed'}
                </span>
              </div> 
              <p className="text-sm text-yellow-800 mt-2">
                {fallbackMode 
                  ? 'The application is using pre-generated responses instead of live AI. To fix this:' 
                  : 'Common solutions for AI service issues:'}
              </p>
              <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                <li>• Add a valid OpenAI API key to your .env file (VITE_OPENAI_API_KEY)</li>
                <li>• Check your OpenAI account for sufficient credits</li>
                <li>• Verify network connectivity to OpenAI's servers</li>
                <li>• If rate limited, wait 2-3 minutes before trying again</li>
                <li>• Consider using a different model (e.g., gpt-3.5-turbo instead of gpt-4)</li>
              </ul>
              <div className="mt-4">
                <button
                  onClick={runQuickTest}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Run Quick Test Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}