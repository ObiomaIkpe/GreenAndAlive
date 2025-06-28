import React, { useState, useEffect } from 'react';
import { Wallet, Coins, TrendingUp, Shield, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import { contractService, CreditData, StakeInfo, TransactionResult } from '../services/contractService';
import { notificationService } from '../services/notificationService';

export default function BlockchainDashboard() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [stakeInfo, setStakeInfo] = useState<StakeInfo | null>(null);
  const [ownedCredits, setOwnedCredits] = useState<CreditData[]>([]);
  const [creditsForSale, setCreditsForSale] = useState<CreditData[]>([]);
  const [apy, setApy] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Staking form state
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [unstakeAmount, setUnstakeAmount] = useState<string>('');

  useEffect(() => {
    initializeBlockchain();
  }, []);

  const initializeBlockchain = async () => {
    setLoading(true);
    try {
      const initialized = await contractService.initialize();
      if (initialized) {
        const address = await contractService.getWalletAddress();
        if (address) {
          setWalletAddress(address);
          setIsConnected(true);
          await loadBlockchainData(address);
        }
      }
    } catch (error) {
      console.error('Failed to initialize blockchain:', error);
      notificationService.error('Failed to connect to blockchain');
    } finally {
      setLoading(false);
    }
  };

  const loadBlockchainData = async (address: string) => {
    try {
      const [balance, stake, credits, forSale, apyRate] = await Promise.all([
        contractService.getTokenBalance(address),
        contractService.getStakeInfo(address),
        contractService.getCreditsOwnedBy(address),
        contractService.getCreditsForSale(),
        contractService.getAPY()
      ]);

      setTokenBalance(balance);
      setStakeInfo(stake);
      setOwnedCredits(credits);
      setCreditsForSale(forSale);
      setApy(apyRate);
    } catch (error) {
      console.error('Failed to load blockchain data:', error);
      notificationService.error('Failed to load blockchain data');
    }
  };

  const connectWallet = async () => {
    setLoading(true);
    try {
      const address = await contractService.connectWallet();
      if (address) {
        setWalletAddress(address);
        setIsConnected(true);
        await loadBlockchainData(address);
        notificationService.success('Wallet connected successfully');
      } else {
        notificationService.error('Failed to connect wallet');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      notificationService.error('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      notificationService.error('Please enter a valid stake amount');
      return;
    }

    setLoading(true);
    try {
      const result: TransactionResult = await contractService.stakeTokens(stakeAmount);
      if (result.success) {
        notificationService.success(`Successfully staked ${stakeAmount} CARB tokens`);
        setStakeAmount('');
        if (walletAddress) {
          await loadBlockchainData(walletAddress);
        }
      } else {
        notificationService.error(result.error || 'Failed to stake tokens');
      }
    } catch (error) {
      console.error('Staking failed:', error);
      notificationService.error('Failed to stake tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      notificationService.error('Please enter a valid unstake amount');
      return;
    }

    setLoading(true);
    try {
      const result: TransactionResult = await contractService.unstakeTokens(unstakeAmount);
      if (result.success) {
        notificationService.success(`Successfully unstaked ${unstakeAmount} CARB tokens`);
        setUnstakeAmount('');
        if (walletAddress) {
          await loadBlockchainData(walletAddress);
        }
      } else {
        notificationService.error(result.error || 'Failed to unstake tokens');
      }
    } catch (error) {
      console.error('Unstaking failed:', error);
      notificationService.error('Failed to unstake tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    setLoading(true);
    try {
      const result: TransactionResult = await contractService.claimRewards();
      if (result.success) {
        notificationService.success('Successfully claimed rewards');
        if (walletAddress) {
          await loadBlockchainData(walletAddress);
        }
      } else {
        notificationService.error(result.error || 'Failed to claim rewards');
      }
    } catch (error) {
      console.error('Claim rewards failed:', error);
      notificationService.error('Failed to claim rewards');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredit = async (credit: CreditData) => {
    setLoading(true);
    try {
      const result: TransactionResult = await contractService.purchaseCredit(credit.tokenId, credit.price);
      if (result.success) {
        notificationService.success(`Successfully purchased carbon credit #${credit.tokenId}`);
        if (walletAddress) {
          await loadBlockchainData(walletAddress);
        }
      } else {
        notificationService.error(result.error || 'Failed to purchase credit');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      notificationService.error('Failed to purchase credit');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (walletAddress) {
      await loadBlockchainData(walletAddress);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const totalValue = parseFloat(tokenBalance) + parseFloat(stakeInfo?.amount || '0');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Blockchain Dashboard</h1>
        <div className="flex items-center space-x-4">
          {isConnected && (
            <button
              onClick={refreshData}
              disabled={loading}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
          {!isConnected && (
            <button
              onClick={connectWallet}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" />
              <span>{loading ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          )}
        </div>
      </div>

      {!isConnected ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-yellow-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your Web3 wallet to access blockchain features, stake tokens, and trade carbon credits.
          </p>
          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <Wallet className="w-5 h-5" />
            <span>Connect Wallet</span>
          </button>
        </div>
      ) : (
        <>
          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-3 mb-4">
                <Wallet className="w-6 h-6 text-blue-600" />
                <span className="text-sm text-gray-600">{walletAddress ? formatAddress(walletAddress) : 'Not connected'}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {parseFloat(tokenBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} CARB
              </div>
              <div className="text-sm text-gray-600">Token Balance</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-3 mb-4">
                <Coins className="w-6 h-6 text-green-600" />
                <span className="text-sm text-gray-600">Staked: {parseFloat(stakeInfo?.amount || '0').toLocaleString(undefined, { maximumFractionDigits: 2 })} CARB</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {parseFloat(stakeInfo?.pendingReward || '0').toFixed(4)} CARB
              </div>
              <div className="text-sm text-gray-600">Pending Rewards</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <span className="text-sm text-gray-600">APY: {apy.toFixed(1)}%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                ${(totalValue * 25).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-600">Total Portfolio Value</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-indigo-600" />
                <span className="text-sm text-gray-600">Owned Credits: {ownedCredits.length}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {ownedCredits.filter(c => c.verified).length}
              </div>
              <div className="text-sm text-gray-600">Verified Credits</div>
            </div>
          </div>

          {/* Staking & Trading Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stake Tokens */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stake Tokens</h3>
              <div className="space-y-3">
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Amount to stake"
                  step="0.01"
                />
                <button 
                  onClick={handleStake}
                  disabled={loading || !stakeAmount}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Staking...' : 'Stake Tokens'}
                </button>
                <div className="text-xs text-gray-600">
                  Available: {parseFloat(tokenBalance).toFixed(2)} CARB
                </div>
              </div>
            </div>

            {/* Unstake & Claim */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Unstake & Claim</h3>
              <div className="space-y-3">
                <input
                  type="number"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Amount to unstake"
                  step="0.01"
                />
                <button 
                  onClick={handleUnstake}
                  disabled={loading || !unstakeAmount}
                  className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Unstaking...' : 'Unstake Tokens'}
                </button>
                <button 
                  onClick={handleClaimRewards}
                  disabled={loading || parseFloat(stakeInfo?.pendingReward || '0') <= 0}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Claiming...' : `Claim ${parseFloat(stakeInfo?.pendingReward || '0').toFixed(4)} CARB`}
                </button>
                <div className="text-xs text-gray-600">
                  Staked: {parseFloat(stakeInfo?.amount || '0').toFixed(2)} CARB
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Credits for Sale:</span>
                  <span className="text-sm font-medium">{creditsForSale.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">My Credits:</span>
                  <span className="text-sm font-medium">{ownedCredits.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Staking APY:</span>
                  <span className="text-sm font-medium text-green-600">{apy.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Network:</span>
                  <span className="text-sm font-medium">Ethereum</span>
                </div>
              </div>
            </div>
          </div>

          {/* Carbon Credits Marketplace */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Carbon Credits Marketplace</h3>
            {creditsForSale.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No carbon credits available for purchase
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {creditsForSale.slice(0, 6).map((credit) => (
                  <div key={credit.tokenId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Credit #{credit.tokenId}</span>
                      {credit.verified && (
                        <Shield className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <div>Type: {credit.projectType}</div>
                      <div>Location: {credit.location}</div>
                      <div>Amount: {credit.amount} tons CO₂</div>
                      <div>Vintage: {credit.vintage}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        {parseFloat(credit.price).toFixed(4)} ETH
                      </span>
                      <button
                        onClick={() => handlePurchaseCredit(credit)}
                        disabled={loading}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Buying...' : 'Buy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Carbon Credits */}
          {ownedCredits.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Carbon Credits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ownedCredits.map((credit) => (
                  <div key={credit.tokenId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Credit #{credit.tokenId}</span>
                      {credit.verified && (
                        <Shield className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <div>Type: {credit.projectType}</div>
                      <div>Location: {credit.location}</div>
                      <div>Amount: {credit.amount} tons CO₂</div>
                      <div>Vintage: {credit.vintage}</div>
                    </div>
                    <div className="text-sm">
                      {credit.forSale ? (
                        <span className="text-green-600 font-medium">Listed for {parseFloat(credit.price).toFixed(4)} ETH</span>
                      ) : (
                        <span className="text-gray-500">Not for sale</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}