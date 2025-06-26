import React, { useState } from 'react';
import { Shield, Clock, CheckCircle, XCircle, DollarSign, FileText, User } from 'lucide-react';
import { blockchainService, VerificationRequest } from '../services/blockchain';
import { useAsync } from '../hooks/useAsync';
import LoadingSpinner from './LoadingSpinner';

export default function VerificationDashboard() {
  const [activeTab, setActiveTab] = useState<'requests' | 'register' | 'history'>('requests');
  const [verifierData, setVerifierData] = useState({
    credentials: '',
    specializations: [] as string[],
    experience: ''
  });

  const { data: verificationRequests, loading: requestsLoading, refetch: refetchRequests } = useAsync(
    () => blockchainService.getVerificationRequests(),
    []
  );

  const specializationOptions = [
    'Waste Disposal Verification',
    'Corporate Emissions Auditing',
    'Renewable Energy Certification',
    'Carbon Offset Validation',
    'Environmental Impact Assessment',
    'Sustainability Reporting',
    'Blockchain Data Verification'
  ];

  const handleRegisterVerifier = async () => {
    if (!verifierData.credentials || verifierData.specializations.length === 0) return;

    try {
      const txHash = await blockchainService.registerAsVerifier(
        verifierData.credentials,
        verifierData.specializations
      );

      if (txHash) {
        setVerifierData({ credentials: '', specializations: [], experience: '' });
      }
    } catch (error) {
      console.error('Verifier registration failed:', error);
    }
  };

  const handleCompleteVerification = async (requestId: string, approved: boolean, report: string) => {
    try {
      const confidence = approved ? 95 : 0; // High confidence for approved, 0 for rejected
      
      const txHash = await blockchainService.completeVerification(
        requestId,
        approved,
        report,
        confidence
      );

      if (txHash) {
        refetchRequests();
      }
    } catch (error) {
      console.error('Verification completion failed:', error);
    }
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'waste_disposal': return 'text-green-600 bg-green-100';
      case 'corporate_emissions': return 'text-blue-600 bg-blue-100';
      case 'renewable_energy': return 'text-purple-600 bg-purple-100';
      case 'carbon_offset': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'disputed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const toggleSpecialization = (specialization: string) => {
    setVerifierData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Third-Party Verification</h2>
              <p className="text-sm text-gray-600">Verify carbon offset claims and earn rewards</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {verificationRequests?.filter(r => r.status === 'open').length || 0}
              </div>
              <div className="text-xs text-gray-500">Open Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${verificationRequests?.reduce((sum, r) => sum + r.bounty, 0) || 0}
              </div>
              <div className="text-xs text-gray-500">Total Bounties</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'requests', label: 'Verification Requests', icon: FileText },
            { id: 'register', label: 'Register as Verifier', icon: User },
            { id: 'history', label: 'Verification History', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
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
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {requestsLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-gray-600">Loading verification requests...</p>
                </div>
              ) : verificationRequests && verificationRequests.length > 0 ? (
                verificationRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition-colors duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRequestTypeColor(request.type)}`}>
                            {request.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900">Verification Request #{request.id}</h4>
                        <p className="text-sm text-gray-600">
                          Requester: {request.requester.slice(0, 6)}...{request.requester.slice(-4)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Deadline: {new Date(request.deadline).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">${request.bounty}</div>
                        <div className="text-xs text-gray-500">Bounty</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Data Hash</h5>
                      <p className="text-sm font-mono text-gray-600 break-all">{request.dataHash}</p>
                    </div>

                    {request.status === 'open' && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleCompleteVerification(request.id, true, 'Verification approved after thorough review')}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleCompleteVerification(request.id, false, 'Verification rejected due to insufficient evidence')}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}

                    {request.status === 'in_progress' && request.assignedVerifier && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          Currently being verified by: {request.assignedVerifier.slice(0, 6)}...{request.assignedVerifier.slice(-4)}
                        </p>
                      </div>
                    )}

                    {request.status === 'completed' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-green-800">
                            Verification completed with {request.confidence}% confidence
                          </p>
                          <span className="text-sm font-medium text-green-600">
                            Bounty claimed: ${request.bounty}
                          </span>
                        </div>
                        {request.report && (
                          <p className="text-xs text-green-700 mt-2">
                            Report: {request.report}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No verification requests available</p>
                  <p className="text-sm text-gray-500 mt-1">Check back later for new verification opportunities</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'register' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Register as Third-Party Verifier</h3>
                <p className="text-sm text-gray-600">Join our network of trusted verifiers and earn rewards</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Credentials & Qualifications</label>
                  <textarea
                    value={verifierData.credentials}
                    onChange={(e) => setVerifierData(prev => ({ ...prev, credentials: e.target.value }))}
                    placeholder="Describe your professional credentials, certifications, and relevant qualifications..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Areas of Specialization</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {specializationOptions.map((specialization) => (
                      <label key={specialization} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={verifierData.specializations.includes(specialization)}
                          onChange={() => toggleSpecialization(specialization)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{specialization}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Relevant Experience</label>
                  <textarea
                    value={verifierData.experience}
                    onChange={(e) => setVerifierData(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="Describe your relevant work experience, previous verification work, and expertise..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="font-medium text-indigo-900 mb-2">Verifier Benefits</h4>
                <ul className="text-sm text-indigo-800 space-y-1">
                  <li>• Earn bounty rewards for completed verifications</li>
                  <li>• Build reputation in the carbon offset ecosystem</li>
                  <li>• Access to exclusive verification opportunities</li>
                  <li>• Blockchain-verified track record</li>
                  <li>• Contribute to environmental sustainability</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Requirements</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Professional credentials in relevant field</li>
                  <li>• Minimum 2 years of verification experience</li>
                  <li>• Commitment to accurate and timely verifications</li>
                  <li>• Adherence to verification standards and protocols</li>
                </ul>
              </div>

              <button
                onClick={handleRegisterVerifier}
                disabled={!verifierData.credentials || verifierData.specializations.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Register as Verifier
              </button>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No verification history yet</p>
                <p className="text-sm text-gray-500 mt-1">Complete verifications to see your history here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Network Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">247</div>
            <div className="text-sm text-indigo-700">Active Verifiers</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">1,856</div>
            <div className="text-sm text-green-700">Completed Verifications</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">98.7%</div>
            <div className="text-sm text-blue-700">Accuracy Rate</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">$125,000</div>
            <div className="text-sm text-purple-700">Total Bounties Paid</div>
          </div>
        </div>
      </div>
    </div>
  );
}