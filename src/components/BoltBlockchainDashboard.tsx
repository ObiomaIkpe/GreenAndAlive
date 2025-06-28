import React, { useState, useEffect } from 'react';
import { Zap, Link, Shield, Wallet, ExternalLink, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { notificationService } from '../services/notificationService';
import { config } from '../config/environment';
import LoadingSpinner from './LoadingSpinner';

interface BoltTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  token_type: string;
  tx_hash: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  metadata: any;
}

export default function BoltBlockchainDashboard() {
  const [transactions, setTransactions] = useState<BoltTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
    checkWalletConnection();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bolt_blockchain_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      notificationService.error('Failed to load transactions', 'Please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  const checkWalletConnection = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletConnected(true);
          setWalletAddress(accounts[0]);
          fetchTokenBalance(accounts[0]);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
        fetchTokenBalance(accounts[0]);
        notificationService.success('Wallet Connected', 'Successfully connected to your blockchain wallet');
      } else {
        notificationService.warning('MetaMask Required', 'Please install MetaMask to connect your wallet');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      notificationService.error('Connection Failed', 'Failed to connect wallet');
    }
  };

  const fetchTokenBalance = async (address: string) => {
    try {
      // This would be replaced with actual blockchain call in production
      // For demo, we'll use a mock balance
      setTokenBalance('1,247.35');
    } catch (error) {
      console.error('Error fetching token balance:', error);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadTransactions();
    if (walletConnected) {
      await fetchTokenBalance(walletAddress);
    }
    setIsRefreshing(false);
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'mint':
        return <Zap className="w-5 h-5 text-green-600" />;
      case 'transfer':
        return <Link className="w-5 h-5 text-blue-600" />;
      case 'stake':
        return <Shield className="w-5 h-5 text-purple-600" />;
      case 'claim':
        return <Wallet className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <img src="/bolt-icon.svg" alt="Bolt Icon" className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bolt Blockchain Dashboard</h2>
              <p className="text-sm text-gray-600">Manage your blockchain transactions powered by Bolt.new</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {walletConnected ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="flex items-center space-x-2 px-3 py-1 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatAddress(walletAddress)}</p>
                  <p className="text-xs text-gray-500">{tokenBalance} CARB</p>
                </div>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Bolt Transaction History</h3>
          <p className="text-sm text-gray-600">View your blockchain transactions powered by Bolt.new</p>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Loading transactions...</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getTransactionTypeIcon(tx.transaction_type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 capitalize">{tx.transaction_type} Transaction</h4>
                        <p className="text-sm text-gray-600">
                          {tx.amount} {tx.token_type}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(tx.status)}
                        <span className="text-sm font-medium capitalize">{tx.status}</span>
                      </div>
                      <a
                        href={`${config.blockchain.explorerUrl}/tx/${tx.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center"
                      >
                        <span>View on Explorer</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <img src="/bolt-icon.svg" alt="Bolt Icon" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No transactions found</p>
              <p className="text-sm text-gray-500 mt-1">Connect your wallet and start using Bolt.new blockchain features</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {walletConnected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mint Carbon Credits</h3>
            <p className="text-sm text-gray-600 mb-4">Create new carbon credits on the blockchain</p>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200">
              Mint Credits
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stake Tokens</h3>
            <p className="text-sm text-gray-600 mb-4">Stake your tokens to earn rewards</p>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200">
              Stake Tokens
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verify Carbon Offset</h3>
            <p className="text-sm text-gray-600 mb-4">Verify your carbon offset on the blockchain</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200">
              Verify Offset
            </button>
          </div>
        </div>
      )}

      {/* Bolt.new Integration Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <img src="/bolt-icon.svg" alt="Bolt Icon" className="w-6 h-6" />
          <h3 className="text-lg font-semibold text-gray-900">About Bolt.new Blockchain Integration</h3>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            The Bolt.new blockchain integration provides a seamless way to interact with carbon credit smart contracts,
            enabling transparent and verifiable carbon offset tracking, trading, and verification.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Key Features</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Transparent carbon credit tracking</li>
                <li>• Verifiable offset certificates</li>
                <li>• Automated reward distribution</li>
                <li>• Token staking with competitive APY</li>
                <li>• Blockchain-verified carbon footprint</li>
              </ul>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Benefits</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Immutable record of carbon offsets</li>
                <li>• Trustless verification system</li>
                <li>• Incentivized sustainability actions</li>
                <li>• Transparent carbon credit marketplace</li>
                <li>• Reduced carbon footprint tracking costs</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center mt-4">
            <a 
              href="https://bolt.new" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              <img src="/bolt-icon.svg" alt="Bolt Icon" className="w-4 h-4" />
              <span>Learn More About Bolt.new</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}