import React, { useState, useEffect } from 'react';
import { Building2, TrendingDown, TrendingUp, Shield, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import { blockchainService, CorporateProfile } from '../services/blockchain';
import { useAsync } from '../hooks/useAsync';
import LoadingSpinner from './LoadingSpinner';

export default function CorporateCompliance() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'register' | 'report' | 'marketplace'>('dashboard');
  const [registrationData, setRegistrationData] = useState({
    name: '',
    industry: '',
    expectedEmissions: '',
    compliancePeriod: '2024'
  });
  const [emissionReport, setEmissionReport] = useState({
    actualEmissions: '',
    verificationData: '',
    reportingPeriod: ''
  });

  const { data: corporateProfiles, loading: profilesLoading, refetch: refetchProfiles } = useAsync(
    () => blockchainService.getCorporateProfiles(),
    []
  );

  const industries = [
    'Manufacturing', 'Oil & Gas', 'Mining', 'Chemical', 'Steel', 'Cement', 
    'Power Generation', 'Transportation', 'Agriculture', 'Technology', 'Other'
  ];

  const handleRegisterCorporation = async () => {
    if (!registrationData.name || !registrationData.expectedEmissions) return;

    try {
      const txHash = await blockchainService.registerCorporation({
        name: registrationData.name,
        industry: registrationData.industry,
        expectedEmissions: parseFloat(registrationData.expectedEmissions),
        compliancePeriod: registrationData.compliancePeriod,
        creditsRequired: parseFloat(registrationData.expectedEmissions)
      });

      if (txHash) {
        setRegistrationData({ name: '', industry: '', expectedEmissions: '', compliancePeriod: '2024' });
        refetchProfiles();
        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error('Corporation registration failed:', error);
    }
  };

  const handleReportEmissions = async () => {
    if (!emissionReport.actualEmissions) return;

    try {
      const verificationData = {
        actualEmissions: parseFloat(emissionReport.actualEmissions),
        reportingPeriod: emissionReport.reportingPeriod,
        verificationMethod: 'third_party_audit',
        timestamp: new Date().toISOString()
      };

      const txHash = await blockchainService.reportCorporateEmissions(
        parseFloat(emissionReport.actualEmissions),
        verificationData
      );

      if (txHash) {
        setEmissionReport({ actualEmissions: '', verificationData: '', reportingPeriod: '' });
        refetchProfiles();
      }
    } catch (error) {
      console.error('Emission reporting failed:', error);
    }
  };

  const handlePurchaseCredits = async (amount: number) => {
    try {
      const pricePerCredit = 45; // $45 per credit
      const txHash = await blockchainService.purchaseCorporateCredits(amount, pricePerCredit);
      
      if (txHash) {
        refetchProfiles();
      }
    } catch (error) {
      console.error('Credit purchase failed:', error);
    }
  };

  const handleRedeemExcessCredits = async () => {
    try {
      const result = await blockchainService.redeemExcessCredits();
      
      if (result) {
        refetchProfiles();
      }
    } catch (error) {
      console.error('Credit redemption failed:', error);
    }
  };

  const getComplianceStatus = (profile: CorporateProfile) => {
    const deficit = profile.actualEmissions - profile.creditsOwned;
    
    if (deficit <= 0) return { status: 'compliant', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (deficit <= profile.actualEmissions * 0.1) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'non_compliant', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const calculatePotentialReward = (profile: CorporateProfile) => {
    return blockchainService.calculateCorporateReward(
      profile.expectedEmissions,
      profile.actualEmissions,
      profile.creditsOwned
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Corporate Carbon Compliance</h2>
              <p className="text-sm text-gray-600">Manage corporate emissions and carbon credit compliance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Building2 },
            { id: 'register', label: 'Register Corporation', icon: Shield },
            { id: 'report', label: 'Report Emissions', icon: TrendingUp },
            { id: 'marketplace', label: 'Credit Marketplace', icon: DollarSign }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
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
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {profilesLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-gray-600">Loading corporate profiles...</p>
                </div>
              ) : corporateProfiles && corporateProfiles.length > 0 ? (
                <div className="space-y-4">
                  {corporateProfiles.map((profile) => {
                    const compliance = getComplianceStatus(profile);
                    const potentialReward = calculatePotentialReward(profile);
                    const emissionReduction = profile.expectedEmissions - profile.actualEmissions;
                    const excessCredits = profile.creditsOwned - profile.actualEmissions;
                    
                    return (
                      <div key={profile.id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
                            <p className="text-sm text-gray-600">{profile.industry} • {profile.compliancePeriod}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${compliance.color} ${compliance.bgColor}`}>
                                {compliance.status.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                Reputation: {profile.reputationScore}/100
                              </span>
                            </div>
                          </div>
                          
                          {potentialReward > 0 && (
                            <div className="text-right">
                              <div className="text-lg font-bold text-emerald-600">+{potentialReward}</div>
                              <div className="text-xs text-emerald-700">CARB Reward</div>
                              <button
                                onClick={handleRedeemExcessCredits}
                                className="mt-2 px-3 py-1 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors duration-200"
                              >
                                Redeem
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-sm text-gray-600">Expected Emissions</div>
                            <div className="text-lg font-semibold text-gray-900">{profile.expectedEmissions.toLocaleString()} tons</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-sm text-gray-600">Actual Emissions</div>
                            <div className={`text-lg font-semibold ${emissionReduction > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {profile.actualEmissions.toLocaleString()} tons
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-sm text-gray-600">Credits Owned</div>
                            <div className="text-lg font-semibold text-blue-600">{profile.creditsOwned.toLocaleString()}</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-sm text-gray-600">Credits Required</div>
                            <div className="text-lg font-semibold text-purple-600">{profile.creditsRequired.toLocaleString()}</div>
                          </div>
                        </div>

                        {/* Performance Indicators */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                            {emissionReduction > 0 ? (
                              <TrendingDown className="w-5 h-5 text-green-600" />
                            ) : (
                              <TrendingUp className="w-5 h-5 text-red-600" />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">Emission Performance</div>
                              <div className={`text-sm ${emissionReduction > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {emissionReduction > 0 ? '-' : '+'}{Math.abs(emissionReduction).toLocaleString()} tons vs expected
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                            {excessCredits > 0 ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">Credit Balance</div>
                              <div className={`text-sm ${excessCredits > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {excessCredits > 0 ? 'Surplus: +' : 'Deficit: '}{Math.abs(excessCredits).toLocaleString()} credits
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {excessCredits < 0 && (
                          <div className="mt-4 flex space-x-3">
                            <button
                              onClick={() => handlePurchaseCredits(Math.abs(excessCredits))}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                            >
                              Purchase Required Credits ({Math.abs(excessCredits).toLocaleString()})
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No corporate profiles found</p>
                  <button
                    onClick={() => setActiveTab('register')}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Register your corporation
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'register' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Register Your Corporation</h3>
                <p className="text-sm text-gray-600">Join the blockchain-verified carbon compliance program</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Corporation Name</label>
                  <input
                    type="text"
                    value={registrationData.name}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter corporation name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <select
                    value={registrationData.industry}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select industry</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Annual Emissions (tons CO₂)</label>
                  <input
                    type="number"
                    value={registrationData.expectedEmissions}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, expectedEmissions: e.target.value }))}
                    placeholder="Enter expected emissions"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Period</label>
                  <select
                    value={registrationData.compliancePeriod}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, compliancePeriod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Registration Benefits</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Blockchain-verified emission tracking</li>
                  <li>• Automated compliance monitoring</li>
                  <li>• Reward tokens for emission reductions</li>
                  <li>• Access to verified carbon credit marketplace</li>
                  <li>• Reputation scoring system</li>
                </ul>
              </div>

              <button
                onClick={handleRegisterCorporation}
                disabled={!registrationData.name || !registrationData.expectedEmissions}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Register Corporation
              </button>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Report Actual Emissions</h3>
                <p className="text-sm text-gray-600">Submit verified emission data for compliance tracking</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Actual Emissions (tons CO₂)</label>
                  <input
                    type="number"
                    value={emissionReport.actualEmissions}
                    onChange={(e) => setEmissionReport(prev => ({ ...prev, actualEmissions: e.target.value }))}
                    placeholder="Enter actual emissions"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reporting Period</label>
                  <select
                    value={emissionReport.reportingPeriod}
                    onChange={(e) => setEmissionReport(prev => ({ ...prev, reportingPeriod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select period</option>
                    <option value="Q1 2024">Q1 2024</option>
                    <option value="Q2 2024">Q2 2024</option>
                    <option value="Q3 2024">Q3 2024</option>
                    <option value="Q4 2024">Q4 2024</option>
                    <option value="Annual 2024">Annual 2024</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification Documentation</label>
                  <textarea
                    value={emissionReport.verificationData}
                    onChange={(e) => setEmissionReport(prev => ({ ...prev, verificationData: e.target.value }))}
                    placeholder="Provide details about third-party verification, audit reports, measurement methods..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-medium text-yellow-900">Verification Required</h4>
                </div>
                <p className="text-sm text-yellow-800 mt-2">
                  All emission reports must be verified by approved third-party auditors before rewards can be distributed.
                  Ensure your data is accurate and properly documented.
                </p>
              </div>

              <button
                onClick={handleReportEmissions}
                disabled={!emissionReport.actualEmissions || !emissionReport.reportingPeriod}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Emission Report
              </button>
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Corporate Carbon Credit Marketplace</h3>
                <p className="text-sm text-gray-600">Purchase verified carbon credits to meet compliance requirements</p>
              </div>

              {/* Credit Packages */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { amount: 100, price: 45, type: 'Forest Conservation', discount: 0 },
                  { amount: 500, price: 42, type: 'Renewable Energy', discount: 7 },
                  { amount: 1000, price: 40, type: 'Mixed Portfolio', discount: 11 }
                ].map((package_, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors duration-200">
                    <div className="text-center mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{package_.amount} Credits</h4>
                      <p className="text-sm text-gray-600">{package_.type}</p>
                    </div>

                    <div className="text-center mb-4">
                      <div className="text-2xl font-bold text-blue-600">${package_.price}</div>
                      <div className="text-sm text-gray-500">per credit</div>
                      {package_.discount > 0 && (
                        <div className="text-xs text-green-600 font-medium">
                          {package_.discount}% bulk discount
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Total Cost:</span>
                        <span className="font-medium">${(package_.amount * package_.price).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Verification:</span>
                        <span className="text-green-600">Third-party verified</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery:</span>
                        <span>Instant blockchain transfer</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePurchaseCredits(package_.amount)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                    >
                      Purchase Credits
                    </button>
                  </div>
                ))}
              </div>

              {/* Marketplace Stats */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Marketplace Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">15,847</div>
                    <div className="text-sm text-gray-600">Credits Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">$42.15</div>
                    <div className="text-sm text-gray-600">Average Price</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">156</div>
                    <div className="text-sm text-gray-600">Corporations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">98.5%</div>
                    <div className="text-sm text-gray-600">Verification Rate</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}