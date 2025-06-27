import React, { useState, useEffect } from 'react';
import { Wallet, Coins, Shield, Zap, Gift, Lock, ExternalLink } from 'lucide-react';
import { blockchainService } from '../services/blockchain';
import { SmartContractReward, BlockchainStats, NFTBadge } from '../types';

const mockRewards: SmartContractReward[] = [
  {
    id: '1',
    type: 'milestone',
    amount: 100,
    tokenSymbol: 'CARB',
    description: 'Carbon Neutral Achievement',
    criteria: 'Offset 50+ tons of CO₂',
    claimed: false,
    claimableDate: '2024-01-15',
    txHash: undefined
  },
  {
    id: '2',
    type: 'daily',
    amount: 5,
    tokenSymbol: 'CARB',
    description: 'Daily Engagement Bonus',
    criteria: 'Login and track daily footprint',
    claimed: true,
    claimableDate: '2024-01-14',
    txHash: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
  },
  {
    id: '3',
    type: 'staking',
    amount: 25,
    tokenSymbol: 'CARB',
    description: 'Staking Rewards',
    criteria: 'Stake 1000+ CARB tokens',
    claimed: false,
    claimableDate: '2024-01-16',
    txHash: undefined
  },
  {
    id: '4',
    type: 'verification',
    amount: 75,
    tokenSymbol: 'CARB',
    description: 'Offset Verification Bonus',
    criteria: 'Verify carbon offset on blockchain',
    claimed: false,
    claimableDate: '2024-01-15',
    txHash: undefined
  }
];

const mockNFTBadges: NFTBadge[] = [
  {
    id: '1',
    name: 'Forest Guardian',
    description: 'Protected 100+ hectares of forest',
    imageUrl: 'https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=400',
    rarity: 'epic',
    mintDate: '2024-01-10',
    tokenId: '001',
    attributes: [
      { trait_type: 'Type', value: 'Conservation' },
      { trait_type: 'Impact', value: 'High' },
      { trait_type: 'Rarity', value: 'Epic' }
    ]
  },
  {
    id: '2',
    name: 'Carbon Pioneer',
    description: 'First 1000 users to join the platform',
    imageUrl: 'https://images.pexels.com/photos/414837/pexels-photo-414837.jpeg?auto=compress&cs=tinysrgb&w=400',
    rarity: 'legendary',
    mintDate: '2024-01-05',
    tokenId: '002',
    attributes: [
      { trait_type: 'Type', value: 'Achievement' },
      { trait_type: 'Edition', value: 'Genesis' },
      { trait_type: 'Rarity', value: 'Legendary' }
    ]
  }
];

const mockBlockchainStats: BlockchainStats = {
  totalTokensEarned: 1247,
  totalTransactions: 23,
  carbonTokensStaked: 500,
  stakingAPY: 12.5,
  nextRewardUnlock: '2024-01-16',
  contractInteractions: 15
};

export default function BlockchainDashboard() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [rewards, setRewards] = useState<SmartContractReward[]>(mockRewards);
  const [stats, setStats] = useState<BlockchainStats>(mockBlockchainStats);

  const connectWallet = async () => {
    setLoading(true);
    try {
      // Use the testnet service for better functionality
      const address = await blockchainService.connectWallet();
      if (address) {
        setWalletAddress(address);
        setWalletConnected(true);
        
        // Show helpful message about testnet
        notificationService.info(
          'Testnet Connected',
          'Connected to Sepolia testnet. Use test ETH for transactions.',
          {
            label: 'Get Test ETH',
            onClick: () => window.open('https://sepoliafaucet.com', '_blank')
          }
        );
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      notificationService.error(
        'Connection Failed',
        'Please install MetaMask and ensure you have Sepolia testnet configured.'
      );
    }
    setLoading(false);
  };

  const claimReward = async (reward: SmartContractReward) => {
    if (!walletConnected) return;
    
    setLoading(true);
    try {
      const txHash = await blockchainService.claimReward(reward.id, reward.amount);
      if (txHash) {
        setRewards(prev => prev.map(r => 
          r.id === reward.id ? { ...r, claimed: true, txHash } : r
        ));
      }
    } catch (error) {
      console.error('Claim failed:', error);
    }
    setLoading(false);
  };

  const stakeTokens = async (amount: number) => {
    if (!walletConnected) return;
    
    setLoading(true);
    try {
      const txHash = await blockchainService.stakeTokens(amount);
      if (txHash) {
        setStats(prev => ({ ...prev, carbonTokensStaked: prev.carbonTokensStaked + amount }));
      }
    } catch (error) {
      console.error('Staking failed:', error);
    }
    setLoading(false);
  };

  const rarityColors = {
    common: 'border-gray-300 bg-gray-50',
    rare: 'border-blue-300 bg-blue-50',
    epic: 'border-purple-300 bg-purple-50',
    legendary: 'border-yellow-300 bg-yellow-50'
  };

  return (
    <div className="space-y-6">
      {/* Wallet Connection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Wallet className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Blockchain Wallet</h2>
                <p className="text-sm text-gray-600">Connect your wallet to access smart contract features</p>
              </div>
            </div>
            
            {!walletConnected ? (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Connected</p>
                <p className="text-xs text-gray-500">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {walletConnected && (
        <>
          {/* Blockchain Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">CARB Tokens</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTokensEarned.toLocaleString()}</p>
                </div>
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <Coins className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-emerald-600 font-medium">+15% this week</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Staked Tokens</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.carbonTokensStaked}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-blue-600 font-medium">{stats.stakingAPY}% APY</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-purple-600 font-medium">On-chain verified</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contract Calls</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.contractInteractions}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-orange-600 font-medium">Smart contracts</span>
              </div>
            </div>
          </div>

          {/* Smart Contract Rewards */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Gift className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Smart Contract Rewards</h3>
                  <p className="text-sm text-gray-600">Automatically earned through blockchain interactions</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {rewards.map((reward) => (
                  <div key={reward.id} className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{reward.description}</h4>
                        <p className="text-sm text-gray-600 mt-1">{reward.criteria}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                          reward.type === 'milestone' ? 'bg-purple-100 text-purple-800' :
                          reward.type === 'daily' ? 'bg-blue-100 text-blue-800' :
                          reward.type === 'staking' ? 'bg-green-100 text-green-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {reward.type.charAt(0).toUpperCase() + reward.type.slice(1)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600">+{reward.amount}</p>
                        <p className="text-xs text-gray-500">{reward.tokenSymbol}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Claimable: {new Date(reward.claimableDate).toLocaleDateString()}
                      </div>
                      
                      {reward.claimed ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-green-600 font-medium">Claimed</span>
                          {reward.txHash && (
                            <a 
                              href={`https://etherscan.io/tx/${reward.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => claimReward(reward)}
                          disabled={loading || new Date(reward.claimableDate) > new Date()}
                          className="px-3 py-1 text-sm text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Claiming...' : 'Claim'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* NFT Badges */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Achievement NFT Badges</h3>
              <p className="text-sm text-gray-600">Unique digital collectibles for your sustainability milestones</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockNFTBadges.map((badge) => (
                  <div key={badge.id} className={`rounded-lg p-4 border-2 ${rarityColors[badge.rarity]}`}>
                    <div className="flex items-start space-x-4">
                      <img 
                        src={badge.imageUrl} 
                        alt={badge.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{badge.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            badge.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                            badge.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                            badge.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                            'bg-gray-200 text-gray-800'
                          }`}>
                            {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Token #{badge.tokenId}</span>
                          <span>Minted: {new Date(badge.mintDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Staking Interface */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Token Staking</h3>
              <p className="text-sm text-gray-600">Stake your CARB tokens to earn rewards and support the network</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-emerald-900">Current APY</span>
                      <span className="text-lg font-bold text-emerald-600">{stats.stakingAPY}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-emerald-900">Your Staked</span>
                      <span className="text-lg font-bold text-emerald-600">{stats.carbonTokensStaked} CARB</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Amount to Stake</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Enter amount"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => stakeTokens(100)}
                        disabled={loading}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50"
                      >
                        {loading ? 'Staking...' : 'Stake'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Staking Benefits</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Earn passive rewards on staked tokens</li>
                      <li>• Participate in governance voting</li>
                      <li>• Access to exclusive NFT drops</li>
                      <li>• Higher reward multipliers</li>
                    </ul>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p><strong>Next reward unlock:</strong> {new Date(stats.nextRewardUnlock).toLocaleDateString()}</p>
                    <p><strong>Minimum stake period:</strong> 30 days</p>
                    <p><strong>Unstaking fee:</strong> 2%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}