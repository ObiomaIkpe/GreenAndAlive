export interface CarbonCredit {
  id: string;
  type: 'forest' | 'renewable' | 'efficiency' | 'capture';
  price: number;
  quantity: number;
  location: string;
  verified: boolean;
  description: string;
  vintage: number;
  seller: string;
  certification: string;
  tokenId?: string;
  contractAddress?: string;
  blockchainVerified?: boolean;
}

export interface UserPortfolio {
  totalCredits: number;
  totalValue: number;
  monthlyOffset: number;
  carbonFootprint: number;
  reductionGoal: number;
  achievements: string[];
  walletAddress?: string;
  tokenBalance?: number;
  stakingRewards?: number;
  nftBadges?: NFTBadge[];
}

export interface AIRecommendation {
  id: string;
  type: 'reduction' | 'purchase' | 'optimization';
  title: string;
  description: string;
  impact: number;
  confidence: number;
  category: string;
  rewardPotential?: number;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'offset' | 'reward' | 'stake';
  amount: number;
  credits: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  txHash?: string;
  gasUsed?: number;
  blockNumber?: number;
}

export interface SmartContractReward {
  id: string;
  type: 'milestone' | 'daily' | 'referral' | 'verification' | 'staking';
  amount: number;
  tokenSymbol: string;
  description: string;
  criteria: string;
  claimed: boolean;
  claimableDate: string;
  txHash?: string;
}

export interface NFTBadge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  mintDate: string;
  tokenId: string;
  attributes: { trait_type: string; value: string }[];
}

export interface BlockchainStats {
  totalTokensEarned: number;
  totalTransactions: number;
  carbonTokensStaked: number;
  stakingAPY: number;
  nextRewardUnlock: string;
  contractInteractions: number;
}