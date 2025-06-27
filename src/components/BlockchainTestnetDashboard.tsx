import React, { useState, useEffect } from 'react';
import { Wallet, Coins, Shield, Zap, Gift, Lock, ExternalLink, Rocket, Network, Code } from 'lucide-react';
import { blockchainTestnetService, TestnetDeployment, StakingInfo } from '../services/blockchainTestnet';
import { notificationService } from '../services/notificationService';
import LoadingSpinner from './LoadingSpinner';

export default function BlockchainTestnetDashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [deployment, setDeployment] = useState<TestnetDeployment | null>(null);
  const [stakingInfo, setStakingInfo] = useState<StakingInfo[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [mintAmount, setMintAmount] = useState('100');
  const [stakeAmount, setStakeAmount] = useState('500');
  const [stakeDays, setStakeDays] = useState('30');
  const [offsetAmount, setOffsetAmount] = useState('10');

  useEffect(() => {
    loadStoredDeployment();
    loadNetworkInfo();
  }, []);

  useEffect(() => {
    if (isConnected) {
      loadContractInfo();
      loadStakingInfo();
    }
  }, [isConnected]);

  const loadStoredDeployment = () => {
    const stored = localStorage.getItem('carbonai_testnet_deployment');
    if (stored) {
      try {
        setDeployment(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load deployment info:', error);
      }
    }
  };

  const loadNetworkInfo = async () => {
    const info = await blockchainTestnetService.getNetworkInfo();
    setNetworkInfo(info);
  };

  const loadContractInfo = async () => {
    const info = await blockchainTestnetService.getContractInfo();
    setContractInfo(info);
  };

  const loadStakingInfo = async () => {
    const info = await blockchainTestnetService.getStakingInfo();
    setStakingInfo(info);
  };

  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      const address = await blockchainTestnetService.connectWallet();
      if (address) {
        setUserAddress(address);
        setIsConnected(true);
        
        // Load any existing deployment
        loadStoredDeployment();
        await loadNetworkInfo();
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
    setLoading(false);
  };

  const handleConnectWalletOld = async () => {
    setLoading(true);
    const address = await blockchainTestnetService.connectWallet();
    if (address) {
      setUserAddress(address);
      setIsConnected(true);
    }
    setLoading(false);
  };

  const handleDeployContract = async () => {
    setLoading(true);
    const deploymentResult = await blockchainTestnetService.deployContract();
    if (deploymentResult) {
      setDeployment(deploymentResult);
      await loadContractInfo();
    }
    setLoading(false);
  };

  const handleMintTokens = async () => {
    if (!mintAmount) return;
    setLoading(true);
    await blockchainTestnetService.mintTokens(
      parseFloat(mintAmount),
      `Minted ${mintAmount} CARB tokens for testing`
    );
    await loadContractInfo();
    setLoading(false);
  };

  const handleStakeTokens = async () => {
    if (!stakeAmount || !stakeDays) return;
    setLoading(true);
    await blockchainTestnetService.stakeTokens(
      parseFloat(stakeAmount),
      parseInt(stakeDays)
    );
    await loadStakingInfo();
    setLoading(false);
  };

  const handleOffsetCarbon = async () => {
    if (!offsetAmount) return;
    setLoading(true);
    await blockchainTestnetService.offsetCarbon(
      parseFloat(offsetAmount),
      'Amazon Rainforest Conservation Project'
    );
    await loadContractInfo();
    setLoading(false);
  };

  const handleClaimRewards = async () => {
    setLoading(true);
    await blockchainTestnetService.claimRewards();
    await loadContractInfo();
    await loadStakingInfo();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Network className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Blockchain Testnet Dashboard</h2>
              <p className="text-sm text-gray-600">Deploy and test smart contracts on Sepolia testnet</p>
            </div>
          </div>
          
          {!isConnected ? (
            <button
              onClick={handleConnectWallet}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : <Wallet className="w-5 h-5" />}
              <span>{loading ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          ) : (
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Connected to Sepolia</p>
              <p className="text-xs text-gray-500">{userAddress.slice(0, 6)}...{userAddress.slice(-4)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Network Information */}
      {networkInfo && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{networkInfo.chainId}</div>
              <div className="text-sm text-blue-700">Chain ID</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{networkInfo.name}</div>
              <div className="text-sm text-green-700">Network</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{networkInfo.blockNumber.toLocaleString()}</div>
              <div className="text-sm text-purple-700">Latest Block</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{parseFloat(networkInfo.gasPrice).toFixed(2)}</div>
              <div className="text-sm text-orange-700">Gas Price (Gwei)</div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Deployment */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Rocket className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Smart Contract Deployment</h3>
              <p className="text-sm text-gray-600">Deploy the CarbonAI smart contract to Sepolia testnet</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!deployment ? (
            <div className="text-center py-8">
              <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No contract deployed yet</p>
              <button
                onClick={handleDeployContract}
                disabled={!isConnected || loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2 mx-auto"
              >
                {loading ? <LoadingSpinner size="sm" /> : <Rocket className="w-5 h-5" />}
                <span>{loading ? 'Deploying...' : 'Deploy Contract'}</span>
              </button>
              <p className="text-xs text-gray-500 mt-2">Make sure you have Sepolia ETH for gas fees</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h4 className="font-medium text-emerald-900 mb-2">Contract Successfully Deployed!</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-emerald-700">Contract Address:</span>
                    <div className="font-mono text-emerald-900 break-all">{deployment.contractAddress}</div>
                  </div>
                  <div>
                    <span className="text-emerald-700">Deployment Tx:</span>
                    <div className="font-mono text-emerald-900 break-all">{deployment.deploymentTx}</div>
                  </div>
                  <div>
                    <span className="text-emerald-700">Block Number:</span>
                    <div className="font-mono text-emerald-900">{deployment.blockNumber}</div>
                  </div>
                  <div>
                    <span className="text-emerald-700">Gas Used:</span>
                    <div className="font-mono text-emerald-900">{parseInt(deployment.gasUsed).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <a
                    href={blockchainTestnetService.getAddressUrl(deployment.contractAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View on Etherscan</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contract Interaction */}
      {isConnected && deployment && (
        <>
          {/* Contract Information */}
          {contractInfo && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{contractInfo.name}</div>
                  <div className="text-sm text-indigo-700">Token Name</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{contractInfo.symbol}</div>
                  <div className="text-sm text-blue-700">Symbol</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{parseFloat(contractInfo.totalSupply).toLocaleString()}</div>
                  <div className="text-sm text-green-700">Total Supply</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{parseFloat(contractInfo.userBalance).toFixed(2)}</div>
                  <div className="text-sm text-purple-700">Your Balance</div>
                </div>
              </div>
            </div>
          )}

          {/* Token Operations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mint Tokens */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Coins className="w-5 h-5 text-emerald-600 mr-2" />
                Mint Tokens
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="100"
                  />
                </div>
                <button
                  onClick={handleMintTokens}
                  disabled={loading || !mintAmount}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? 'Minting...' : 'Mint Tokens'}
                </button>
              </div>
            </div>

            {/* Stake Tokens */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="w-5 h-5 text-blue-600 mr-2" />
                Stake Tokens
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lock Period (Days)</label>
                  <select
                    value={stakeDays}
                    onChange={(e) => setStakeDays(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="180">180 Days</option>
                    <option value="365">365 Days</option>
                  </select>
                </div>
                <button
                  onClick={handleStakeTokens}
                  disabled={loading || !stakeAmount}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? 'Staking...' : 'Stake Tokens'}
                </button>
              </div>
            </div>

            {/* Offset Carbon */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 text-purple-600 mr-2" />
                Offset Carbon
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (tons CO₂)</label>
                  <input
                    type="number"
                    value={offsetAmount}
                    onChange={(e) => setOffsetAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="10"
                  />
                </div>
                <button
                  onClick={handleOffsetCarbon}
                  disabled={loading || !offsetAmount}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? 'Offsetting...' : 'Offset Carbon'}
                </button>
              </div>
            </div>
          </div>

          {/* Staking Information */}
          {stakingInfo.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Staking Positions</h3>
                <button
                  onClick={handleClaimRewards}
                  disabled={loading}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? 'Claiming...' : 'Claim Rewards'}
                </button>
              </div>
              
              <div className="space-y-4">
                {stakingInfo.map((stake) => (
                  <div key={stake.stakeId} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Staked Amount</span>
                        <div className="font-semibold text-gray-900">{stake.amount} CARB</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Lock Period</span>
                        <div className="font-semibold text-gray-900">{stake.lockPeriod} days</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Rewards</span>
                        <div className="font-semibold text-emerald-600">{stake.rewards} CARB</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Status</span>
                        <div className={`font-semibold ${stake.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                          {stake.isActive ? 'Active' : 'Completed'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Getting Started Guide */}
      {!isConnected && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started with Testnet</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="font-medium text-gray-900">Install MetaMask</h4>
                <p className="text-sm text-gray-600">Download and install the MetaMask browser extension</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="font-medium text-gray-900">Get Sepolia ETH</h4>
                <p className="text-sm text-gray-600">Get free testnet ETH from a Sepolia faucet for gas fees</p>
                <a 
                  href="https://sepoliafaucet.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm underline"
                >
                  Visit Sepolia Faucet →
                </a>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="font-medium text-gray-900">Connect Wallet</h4>
                <p className="text-sm text-gray-600">Connect your MetaMask wallet to start testing</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <h4 className="font-medium text-gray-900">Deploy Contract</h4>
                <p className="text-sm text-gray-600">Deploy the CarbonAI smart contract to the testnet</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}