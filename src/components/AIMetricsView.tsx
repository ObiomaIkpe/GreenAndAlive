import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, Clock, Brain, AlertTriangle, CheckCircle, XCircle, Download, DollarSign, TrendingUp, BarChart, Scale } from 'lucide-react';
import { aiMetricsService } from '../services/aiMetricsService';
import LoadingSpinner from './LoadingSpinner';

export default function AIMetricsView() {
  const [timeframe, setTimeframe] = useState<30 | 60 | 90>(30);
  const [metrics, setMetrics] = useState<any>(null);
  const [costMetrics, setCostMetrics] = useState<any>(null);
  const [modelComparisons, setModelComparisons] = useState<any[]>([]);
  const [modelPerformance, setModelPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'usage' | 'cost' | 'models'>('usage');

  useEffect(() => {
    loadMetrics();
  }, [timeframe]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const [usageData, costData, comparisons, performance] = await Promise.all([
        aiMetricsService.getUserMetrics(timeframe),
        aiMetricsService.getUserCostMetrics(timeframe),
        aiMetricsService.getModelComparisons(),
        aiMetricsService.getModelPerformance()
      ]);
      
      setMetrics(usageData);
      setCostMetrics(costData);
      setModelComparisons(comparisons);
      setModelPerformance(performance);
      setError(null);
    } catch (err) {
      setError('Failed to load AI usage metrics');
      console.error('Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportMetrics = () => {
    if (!metrics && !costMetrics) return;
    
    const exportData = {
      usage: metrics,
      cost: costMetrics,
      timeframe,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `ai-metrics-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading AI usage metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Metrics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadMetrics}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if ((!metrics || !metrics.metrics || metrics.metrics.length === 0) && 
      (!costMetrics || !costMetrics.costs || costMetrics.costs.length === 0)) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Usage Data</h3>
          <p className="text-gray-600">
            No AI usage metrics have been recorded yet. Start using AI features to collect data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Usage Metrics</h2>
              <p className="text-sm text-gray-600">Track and optimize your AI service usage</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(Number(e.target.value) as 30 | 60 | 90)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={30}>Last 30 Days</option>
              <option value={60}>Last 60 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
            
            <button
              onClick={exportMetrics}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('usage')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
              activeTab === 'usage'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Usage Metrics</span>
          </button>
          
          <button
            onClick={() => setActiveTab('cost')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
              activeTab === 'cost'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Cost Analysis</span>
          </button>
          
          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
              activeTab === 'models'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Model Comparison</span>
          </button>
        </div>
      </div>

      {activeTab === 'usage' && (
        <>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.summary.totalRequests}</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Brain className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-indigo-600 font-medium">
              Last {timeframe} days
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.summary.successRate.toFixed(1)}%</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${metrics.summary.successRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fallback Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.summary.fallbackRate.toFixed(1)}%</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full"
                style={{ width: `${metrics.summary.fallbackRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(metrics.summary.avgResponseTime)}ms</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-blue-600 font-medium">
              {metrics.summary.avgResponseTime < 1000 ? 'Good' : 
               metrics.summary.avgResponseTime < 2000 ? 'Average' : 'Slow'}
            </span>
          </div>
        </div>
      </div>

      {/* Request Type Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <PieChart className="w-5 h-5 text-indigo-600 mr-2" />
          Request Type Distribution
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Request Type Chart */}
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(metrics.summary.requestTypes).map(([type, count]) => (
                <div 
                  key={type}
                  className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm flex items-center"
                >
                  <span className="font-medium">{type}</span>
                  <span className="ml-2 bg-indigo-200 px-2 py-0.5 rounded-full text-xs">
                    {count}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              {Object.entries(metrics.summary.requestTypes).map(([type, count]) => {
                const percentage = (Number(count) / metrics.summary.totalRequests) * 100;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{type}</span>
                      <span className="text-gray-900 font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Success vs Fallback */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Success vs Fallback Usage</h4>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Successful API Calls</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {metrics.metrics.filter(m => m.success && !m.fallback_used).length}
                </span>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Fallback Used</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {metrics.metrics.filter(m => m.fallback_used).length}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Failed Requests</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {metrics.metrics.filter(m => !m.success).length}
                </span>
              </div>
            </div>
            
            <div className="relative h-40 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex">
                <div 
                  className="bg-green-500 h-full"
                  style={{ 
                    width: `${(metrics.metrics.filter(m => m.success && !m.fallback_used).length / metrics.summary.totalRequests) * 100}%` 
                  }}
                ></div>
                <div 
                  className="bg-yellow-500 h-full"
                  style={{ 
                    width: `${(metrics.metrics.filter(m => m.fallback_used).length / metrics.summary.totalRequests) * 100}%` 
                  }}
                ></div>
                <div 
                  className="bg-red-500 h-full"
                  style={{ 
                    width: `${(metrics.metrics.filter(m => !m.success).length / metrics.summary.totalRequests) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent AI Requests</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tokens
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.metrics.slice(0, 10).map((metric, index) => (
                <tr key={index} className={metric.fallback_used ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(metric.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                      {metric.request_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      !metric.success ? 'bg-red-100 text-red-800' :
                      metric.fallback_used ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {!metric.success ? (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </>
                      ) : metric.fallback_used ? (
                        <>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Fallback
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Success
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.response_time ? `${metric.response_time}ms` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.tokens_used || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {metrics.metrics.length > 10 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Showing 10 of {metrics.metrics.length} requests
            </p>
          </div>
        )}
      </div>

      {/* Optimization Tips */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Usage Optimization</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Cost Optimization</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Use smaller models for simpler tasks (gpt-3.5-turbo vs gpt-4)</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Implement caching for common AI responses</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Reduce token usage with more concise prompts</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Batch similar requests when possible</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Performance Optimization</h4>
            <ul className="text-sm text-green-800 space-y-2">
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Implement request throttling to avoid rate limits</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Use streaming responses for better user experience</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Implement robust fallback mechanisms</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Monitor and analyze error patterns</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div> 
  );
}