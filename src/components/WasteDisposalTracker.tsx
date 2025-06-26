import React, { useState, useEffect } from 'react';
import { Trash2, Recycle, Leaf, Zap, Award, Camera, MapPin, Clock } from 'lucide-react';
import { blockchainService, WasteDisposalReport } from '../services/blockchain';
import { useAsync } from '../hooks/useAsync';
import LoadingSpinner from './LoadingSpinner';

export default function WasteDisposalTracker() {
  const [activeTab, setActiveTab] = useState<'report' | 'history' | 'rewards'>('report');
  const [newReport, setNewReport] = useState({
    wasteType: 'recyclable' as const,
    amount: '',
    method: 'recycling' as const,
    location: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: reports, loading: reportsLoading, refetch: refetchReports } = useAsync(
    () => blockchainService.getWasteDisposalReports(),
    []
  );

  const wasteTypes = [
    { id: 'organic', label: 'Organic Waste', icon: Leaf, color: 'text-green-600', bgColor: 'bg-green-100' },
    { id: 'recyclable', label: 'Recyclable', icon: Recycle, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { id: 'electronic', label: 'E-Waste', icon: Zap, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { id: 'hazardous', label: 'Hazardous', icon: Trash2, color: 'text-red-600', bgColor: 'bg-red-100' },
    { id: 'general', label: 'General Waste', icon: Trash2, color: 'text-gray-600', bgColor: 'bg-gray-100' }
  ];

  const disposalMethods = {
    organic: ['composting', 'proper_disposal'],
    recyclable: ['recycling', 'upcycling', 'proper_disposal'],
    electronic: ['recycling', 'proper_disposal', 'donation'],
    hazardous: ['proper_disposal'],
    general: ['proper_disposal']
  };

  const handleSubmitReport = async () => {
    if (!newReport.amount || !newReport.location) return;

    setIsSubmitting(true);
    try {
      const txHash = await blockchainService.reportWasteDisposal({
        wasteType: newReport.wasteType,
        amount: parseFloat(newReport.amount),
        method: newReport.method,
        location: newReport.location,
        proofHash: `proof-${Date.now()}`
      });

      if (txHash) {
        setNewReport({
          wasteType: 'recyclable',
          amount: '',
          method: 'recycling',
          location: '',
          notes: ''
        });
        refetchReports();
        setActiveTab('history');
      }
    } catch (error) {
      console.error('Failed to submit waste report:', error);
    }
    setIsSubmitting(false);
  };

  const calculatePotentialReward = () => {
    if (!newReport.amount) return 0;
    return blockchainService.calculateWasteDisposalReward(
      newReport.wasteType,
      parseFloat(newReport.amount),
      newReport.method
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const totalRewards = reports?.filter(r => r.status === 'verified').reduce((sum, r) => sum + (r.rewardAmount || 0), 0) || 0;
  const pendingReports = reports?.filter(r => r.status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Recycle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Waste Disposal Tracker</h2>
              <p className="text-sm text-gray-600">Earn rewards for eco-friendly waste disposal</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{totalRewards}</div>
              <div className="text-xs text-gray-500">CARB Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{pendingReports}</div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'report', label: 'Report Disposal', icon: Trash2 },
            { id: 'history', label: 'History', icon: Clock },
            { id: 'rewards', label: 'Rewards', icon: Award }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'report' && (
            <div className="space-y-6">
              {/* Waste Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Waste Type</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {wasteTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setNewReport(prev => ({ 
                          ...prev, 
                          wasteType: type.id as any,
                          method: disposalMethods[type.id as keyof typeof disposalMethods][0] as any
                        }))}
                        className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                          newReport.wasteType === type.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`${type.bgColor} p-2 rounded-lg mb-2 mx-auto w-fit`}>
                          <Icon className={`w-5 h-5 ${type.color}`} />
                        </div>
                        <div className="text-sm font-medium text-gray-900">{type.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount and Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (kg)</label>
                  <input
                    type="number"
                    value={newReport.amount}
                    onChange={(e) => setNewReport(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter weight in kg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Disposal Method</label>
                  <select
                    value={newReport.method}
                    onChange={(e) => setNewReport(prev => ({ ...prev, method: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {disposalMethods[newReport.wasteType].map((method) => (
                      <option key={method} value={method}>
                        {method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={newReport.location}
                    onChange={(e) => setNewReport(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter disposal location"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
                <textarea
                  value={newReport.notes}
                  onChange={(e) => setNewReport(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional details about the disposal..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Reward Preview */}
              {newReport.amount && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-emerald-900">Estimated Reward</h4>
                      <p className="text-sm text-emerald-700">Based on waste type, amount, and method</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-600">+{calculatePotentialReward()}</div>
                      <div className="text-sm text-emerald-700">CARB tokens</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmitReport}
                disabled={!newReport.amount || !newReport.location || isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Submitting Report...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span>Submit Disposal Report</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {reportsLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-gray-600">Loading disposal history...</p>
                </div>
              ) : reports && reports.length > 0 ? (
                reports.map((report) => {
                  const wasteType = wasteTypes.find(t => t.id === report.wasteType);
                  const Icon = wasteType?.icon || Trash2;
                  
                  return (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`${wasteType?.bgColor || 'bg-gray-100'} p-2 rounded-lg`}>
                            <Icon className={`w-5 h-5 ${wasteType?.color || 'text-gray-600'}`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {report.amount}kg {wasteType?.label || report.wasteType}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {report.method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • {report.location}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(report.timestamp).toLocaleDateString()}
                            </p>
                            {report.verifierNotes && (
                              <p className="text-xs text-blue-600 mt-1">
                                Verifier: {report.verifierNotes}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </span>
                          {report.rewardAmount && (
                            <div className="text-sm font-medium text-emerald-600 mt-1">
                              +{report.rewardAmount} CARB
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No disposal reports yet</p>
                  <button
                    onClick={() => setActiveTab('report')}
                    className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Submit your first report
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="space-y-6">
              {/* Reward Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{totalRewards}</div>
                  <div className="text-sm text-emerald-700">Total CARB Earned</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{reports?.length || 0}</div>
                  <div className="text-sm text-blue-700">Reports Submitted</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {reports?.filter(r => r.status === 'verified').length || 0}
                  </div>
                  <div className="text-sm text-purple-700">Verified Reports</div>
                </div>
              </div>

              {/* Reward Breakdown */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Reward Breakdown by Waste Type</h4>
                <div className="space-y-3">
                  {wasteTypes.map((type) => {
                    const typeReports = reports?.filter(r => r.wasteType === type.id && r.status === 'verified') || [];
                    const typeRewards = typeReports.reduce((sum, r) => sum + (r.rewardAmount || 0), 0);
                    const Icon = type.icon;
                    
                    return (
                      <div key={type.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`${type.bgColor} p-2 rounded-lg`}>
                            <Icon className={`w-4 h-4 ${type.color}`} />
                          </div>
                          <span className="font-medium text-gray-900">{type.label}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{typeRewards} CARB</div>
                          <div className="text-xs text-gray-500">{typeReports.length} reports</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}