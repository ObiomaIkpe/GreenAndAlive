import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, Zap, Clock, AlertTriangle, CheckCircle, Download, TrendingDown } from 'lucide-react';
import { openaiUsageService } from '../services/openaiUsageService';
import LoadingSpinner from './LoadingSpinner';

export default function OpenAIUsageDashboard() {
  const [timeframe, setTimeframe] = useState<30 | 60 | 90>(30);
  const [usageSummary, setUsageSummary] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'requests' | 'optimization'>('overview');

  useEffect(() => {
    loadData();
  }, [timeframe]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summary, recs] = await Promise.all([
        openaiUsageService.getUserUsageSummary(timeframe),
        openaiUsageService.getCostOptimizationRecommendations()
      ]);
      
      setUsageSummary(summary);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load OpenAI usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!usageSummary) return;
    
    const data = {
      summary: usageSummary.summary,
      byModel: usageSummary.byModel,
      byDay: usageSummary.byDay,
      timeframe,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `openai-usage-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const formatCost = (cost: number) => {
    if (cost >= 1) {
      return `$${cost.toFixed(2)}`;
    } else {
      return `$${cost.toFixed(4)}`;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading OpenAI API usage data...</p>
        </div>
      </div>
    );
  }

  if (!usageSummary) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Usage Data Available</h3>
          <p className="text-gray-600 mb-4">We don't have any OpenAI API usage data for your account yet.</p>
          <p className="text-sm text-gray-500">Start using AI features to collect usage data.</p>
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
            <div className="bg-blue-100 p-2 rounded-lg">
              <img src="/bolt-icon.svg" alt="Bolt" className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">OpenAI API Usage Dashboard</h2>
              <p className="text-sm text-gray-600">Track and optimize your OpenAI API costs</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(Number(e.target.value) as 30 | 60 | 90)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={30}>Last 30 Days</option>
              <option value={60}>Last 60 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
            
            <button
              onClick={exportData}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">{formatCost(usageSummary.summary.totalCost)}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-blue-600 font-medium">
              Last {timeframe} days
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tokens</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(usageSummary.summary.totalTokens)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600 font-medium">
              Avg {formatNumber(Math.round(usageSummary.summary.avgTokensPerRequest))} per request
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(usageSummary.summary.totalRequests)}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-purple-600 font-medium">
              {usageSummary.summary.successRate.toFixed(1)}% success rate
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Cost/Request</p>
              <p className="text-2xl font-bold text-gray-900">{formatCost(usageSummary.summary.avgCostPerRequest)}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-orange-600 font-medium">
              {formatCost(usageSummary.summary.totalCost / 1000)} per 1K tokens
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </button>
          
          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
              activeTab === 'models'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Models</span>
          </button>
          
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Recent Requests</span>
          </button>
          
          <button
            onClick={() => setActiveTab('optimization')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
              activeTab === 'optimization'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Cost Optimization</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Usage Trend */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Trend</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="h-60 relative">
                    {Object.entries(usageSummary.byDay).length > 0 ? (
                      <>
                        {/* Render bar chart here */}
                        <div className="absolute inset-0 flex items-end">
                          {Object.entries(usageSummary.byDay).map(([day, data]: [string, any], index) => (
                            <div 
                              key={day} 
                              className="flex-1 flex flex-col items-center"
                              style={{ height: '100%' }}
                            >
                              <div 
                                className="w-full bg-blue-500 rounded-t"
                                style={{ 
                                  height: `${Math.max(
                                    (data.tokens / (usageSummary.summary.totalTokens / Object.keys(usageSummary.byDay).length)) * 50, 
                                    5
                                  )}%` 
                                }}
                              ></div>
                              {index % 5 === 0 && (
                                <div className="text-xs text-gray-500 mt-2 rotate-45 origin-top-left">
                                  {new Date(day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs text-gray-500">
                          Token usage by day
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No daily usage data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Success vs Failure */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Success Rate</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Successful Requests</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {usageSummary.summary.successfulRequests} ({usageSummary.summary.successRate.toFixed(1)}%)
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Failed Requests</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {usageSummary.summary.totalRequests - usageSummary.summary.successfulRequests} ({(100 - usageSummary.summary.successRate).toFixed(1)}%)
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-green-500 h-4"
                      style={{ width: `${usageSummary.summary.successRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage by Model</h3>
              
              {Object.keys(usageSummary.byModel).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(usageSummary.byModel).map(([model, data]: [string, any]) => {
                    const percentage = (data.tokens / usageSummary.summary.totalTokens) * 100;
                    const costPercentage = (data.cost / usageSummary.summary.totalCost) * 100;
                    
                    return (
                      <div key={model} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{model}</h4>
                            <p className="text-sm text-gray-600">{formatNumber(data.requests)} requests</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{formatCost(data.cost)}</p>
                            <p className="text-sm text-gray-600">{formatNumber(data.tokens)} tokens</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Cost Share</span>
                            <span>{costPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${costPercentage}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Token Share</span>
                            <span>{percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No model usage data available</p>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Model Cost Comparison</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>• GPT-4: $0.03 per 1K prompt tokens, $0.06 per 1K completion tokens</p>
                  <p>• GPT-3.5 Turbo: $0.0015 per 1K prompt tokens, $0.002 per 1K completion tokens</p>
                  <p className="font-medium">GPT-3.5 Turbo is approximately 20x cheaper than GPT-4</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent API Requests</h3>
              
              {usageSummary.recentRequests && usageSummary.recentRequests.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Model
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Endpoint
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tokens
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usageSummary.recentRequests.map((request: any) => (
                        <tr key={request.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(request.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {request.model}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.endpoint}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.total_tokens || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.estimated_cost_usd ? formatCost(request.estimated_cost_usd) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              request.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {request.success ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Success
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Failed
                                </>
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No recent requests found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'optimization' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Optimization Recommendations</h3>
              
              {recommendations && recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{rec.recommendation_type}</h4>
                          <p className="text-sm text-gray-600">{rec.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">{formatCost(rec.estimated_savings)} potential savings</p>
                          <p className="text-xs text-gray-500">Difficulty: {rec.implementation_difficulty}</p>
                        </div>
                      </div>
                      
                      {rec.current_usage_pattern && rec.optimized_usage_pattern && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Current Usage</h5>
                            <pre className="text-xs text-gray-600 overflow-auto p-2 bg-gray-100 rounded">
                              {JSON.stringify(rec.current_usage_pattern, null, 2)}
                            </pre>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <h5 className="text-sm font-medium text-green-900 mb-2">Optimized Usage</h5>
                            <pre className="text-xs text-green-600 overflow-auto p-2 bg-green-100 rounded">
                              {JSON.stringify(rec.optimized_usage_pattern, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4 flex justify-end">
                        <button
                          className={`px-3 py-1 text-sm rounded-md ${
                            rec.is_implemented
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {rec.is_implemented ? 'Implemented ✓' : 'Implement'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No optimization recommendations available</p>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">General Cost Saving Tips</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span>Use GPT-3.5 Turbo instead of GPT-4 for simpler tasks (20x cheaper)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span>Implement client-side caching for common requests</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span>Use shorter, more focused prompts to reduce token usage</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span>Set appropriate max_tokens limits to prevent unnecessarily long responses</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span>Implement fallback mechanisms to handle API outages without retries</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}