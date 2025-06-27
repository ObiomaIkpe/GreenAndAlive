import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, Wallet, Coins, Users, Settings, ExternalLink, Copy, Eye, EyeOff } from 'lucide-react';
import { blockchainTestnetService } from '../services/blockchainTestnet';
import { notificationService } from '../services/notificationService';

export default function BlockchainProductionGuide() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [contractDeployed, setContractDeployed] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const steps = [
    {
      id: 1,
      title: "Wallet Setup & Connection",
      description: "Connect MetaMask and configure for Sepolia testnet",
      status: walletConnected ? 'completed' : 'pending'
    },
    {
      id: 2,
      title: "Smart Contract Deployment",
      description: "Deploy the carbon management smart contract",
      status: contractDeployed ? 'completed' : 'pending'
    },
    {
      id: 3,
      title: "Verification System Setup",
      description: "Configure third-party verification network",
      status: 'pending'
    },
    {
      id: 4,
      title: "Reward Automation Testing",
      description: "Test automated crypto rewards for eco activities",
      status: 'pending'
    },
    {
      id: 5,
      title: "Production Deployment",
      description: "Deploy to mainnet with full security measures",
      status: 'pending'
    }
  ];

  useEffect(() => {
    checkWalletConnection();
    checkContractDeployment();
  }, []);

  const checkWalletConnection = async () => {
    const connected = blockchainTestnetService.isConnected();
    setWalletConnected(connected);
    if (connected && !completedSteps.includes(1)) {
      setCompletedSteps(prev => [...prev, 1]);
    }
  };

  const checkContractDeployment = () => {
    const contractAddress = blockchainTestnetService.getContractAddress();
    const deployed = !!contractAddress;
    setContractDeployed(deployed);
    if (deployed && !completedSteps.includes(2)) {
      setCompletedSteps(prev => [...prev, 2]);
    }
  };

  const handleConnectWallet = async () => {
    const address = await blockchainTestnetService.connectWallet();
    if (address) {
      setWalletConnected(true);
      setCompletedSteps(prev => [...prev, 1]);
      setCurrentStep(2);
      notificationService.success('Wallet Connected', 'Ready for smart contract deployment');
    }
  };

  const handleDeployContract = async () => {
    const deployment = await blockchainTestnetService.deployContract();
    if (deployment) {
      setContractDeployed(true);
      setCompletedSteps(prev => [...prev, 2]);
      setCurrentStep(3);
      notificationService.success('Contract Deployed', 'Smart contract is live on Sepolia testnet');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    notificationService.info('Copied', `${label} copied to clipboard`);
  };

  const getStepIcon = (step: typeof steps[0]) => {
    if (completedSteps.includes(step.id)) {
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    }
    if (step.id === currentStep) {
      return <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">{step.id}</div>;
    }
    return <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-bold">{step.id}</div>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Production Blockchain Integration Guide</h2>
            <p className="text-sm text-gray-600">Step-by-step setup for seamless crypto rewards system</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600">{completedSteps.length} of {steps.length} steps completed</p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${
            step.id === currentStep ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
          }`}>
            <div className="flex items-start space-x-4">
              {getStepIcon(step)}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 mb-4">{step.description}</p>

                {/* Step 1: Wallet Setup */}
                {step.id === 1 && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Prerequisites:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• MetaMask browser extension installed</li>
                        <li>• Sepolia testnet ETH (get from <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" className="underline">Sepolia Faucet</a>)</li>
                        <li>• Basic understanding of Web3 wallets</li>
                      </ul>
                    </div>

                    {!walletConnected ? (
                      <button
                        onClick={handleConnectWallet}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                      >
                        <Wallet className="w-5 h-5" />
                        <span>Connect MetaMask Wallet</span>
                      </button>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-900">Wallet Connected Successfully!</span>
                        </div>
                        <p className="text-sm text-green-800 mt-1">
                          Address: {blockchainTestnetService.getUserAddress()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Smart Contract Deployment */}
                {step.id === 2 && (
                  <div className="space-y-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-medium text-purple-900 mb-2">Smart Contract Features:</h4>
                      <ul className="text-sm text-purple-800 space-y-1">
                        <li>• ERC-20 carbon credit tokens (CARB)</li>
                        <li>• Automated reward distribution</li>
                        <li>• Third-party verification system</li>
                        <li>• Staking and governance mechanisms</li>
                        <li>• Corporate compliance tracking</li>
                      </ul>
                    </div>

                    {!contractDeployed ? (
                      <button
                        onClick={handleDeployContract}
                        disabled={!walletConnected}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
                      >
                        <Coins className="w-5 h-5" />
                        <span>Deploy Smart Contract</span>
                      </button>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-900">Contract Deployed Successfully!</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-green-800">Contract Address:</span>
                            <code className="text-xs bg-green-100 px-2 py-1 rounded">{blockchainTestnetService.getContractAddress()}</code>
                            <button
                              onClick={() => copyToClipboard(blockchainTestnetService.getContractAddress(), 'Contract address')}
                              className="p-1 text-green-600 hover:text-green-700"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                          <a
                            href={blockchainTestnetService.getAddressUrl(blockchainTestnetService.getContractAddress())}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-sm text-green-600 hover:text-green-700"
                          >
                            <span>View on Etherscan</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Verification System */}
                {step.id === 3 && (
                  <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-medium text-orange-900 mb-2">Verification Network Setup:</h4>
                      <ul className="text-sm text-orange-800 space-y-1">
                        <li>• Register trusted third-party verifiers</li>
                        <li>• Set up automated verification workflows</li>
                        <li>• Configure bounty and reward systems</li>
                        <li>• Implement reputation scoring</li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">Verifier Registration</h5>
                        <p className="text-sm text-gray-600 mb-3">Allow qualified entities to become verifiers</p>
                        <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200">
                          Register as Verifier
                        </button>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">Verification Requests</h5>
                        <p className="text-sm text-gray-600 mb-3">Submit activities for verification</p>
                        <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200">
                          Submit for Verification
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Reward Testing */}
                {step.id === 4 && (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <h4 className="font-medium text-emerald-900 mb-2">Automated Reward System:</h4>
                      <ul className="text-sm text-emerald-800 space-y-1">
                        <li>• Waste disposal rewards: 1-10 CARB tokens per kg</li>
                        <li>• Carbon reduction rewards: 50 CARB per ton saved</li>
                        <li>• Verification completion: 25-200 CARB bounties</li>
                        <li>• Staking rewards: 8-15% APY</li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-600 mb-1">25</div>
                        <div className="text-sm text-gray-600">CARB Tokens</div>
                        <div className="text-xs text-gray-500 mt-1">Recycling 5kg plastic</div>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">150</div>
                        <div className="text-sm text-gray-600">CARB Tokens</div>
                        <div className="text-xs text-gray-500 mt-1">Verification bounty</div>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-1">500</div>
                        <div className="text-sm text-gray-600">CARB Tokens</div>
                        <div className="text-xs text-gray-500 mt-1">Corporate compliance</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Production Deployment */}
                {step.id === 5 && (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-900 mb-2">⚠️ Production Security Checklist:</h4>
                      <ul className="text-sm text-red-800 space-y-1">
                        <li>• Smart contract security audit completed</li>
                        <li>• Multi-signature wallet for admin functions</li>
                        <li>• Emergency pause mechanisms implemented</li>
                        <li>• Rate limiting and anti-spam measures</li>
                        <li>• Legal compliance and regulatory approval</li>
                      </ul>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Mainnet Deployment Steps:</h4>
                      <ol className="text-sm text-gray-700 space-y-2">
                        <li>1. Complete security audit and penetration testing</li>
                        <li>2. Set up production infrastructure and monitoring</li>
                        <li>3. Deploy contracts to Ethereum mainnet</li>
                        <li>4. Initialize with proper governance parameters</li>
                        <li>5. Launch with limited functionality (beta)</li>
                        <li>6. Gradually enable full feature set</li>
                      </ol>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-900">Important Notes:</span>
                      </div>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• Mainnet deployment requires real ETH for gas fees</li>
                        <li>• Consider using a deployment service like Hardhat or Truffle</li>
                        <li>• Implement proper access controls and upgrade mechanisms</li>
                        <li>• Set up monitoring and alerting for contract events</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Security Best Practices */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 text-red-600 mr-2" />
          Production Security Best Practices
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Smart Contract Security</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Use OpenZeppelin contracts for standard functionality</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Implement reentrancy guards on all external calls</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Add circuit breakers for emergency situations</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Use time locks for critical parameter changes</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Operational Security</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Multi-signature wallets for admin operations</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Regular security audits and code reviews</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Monitoring and alerting for unusual activity</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Incident response plan and procedures</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ready for Production?</h3>
        <p className="text-gray-700 mb-4">
          Once you've completed all steps and thoroughly tested the system, you'll have a production-ready 
          blockchain integration that automatically rewards users with crypto tokens for verified eco-friendly activities.
        </p>
        <div className="flex space-x-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
            Schedule Security Audit
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
            Deploy to Mainnet
          </button>
        </div>
      </div>
    </div>
  );
}