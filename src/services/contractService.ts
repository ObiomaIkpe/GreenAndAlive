import { ethers } from 'ethers';
import { config } from '../config/environment';

// Contract ABIs (simplified for demo - in production, import from compiled contracts)
const CARBON_CREDIT_ABI = [
  "function mintCredit(address to, uint256 amount, string projectType, string location, uint256 vintage, string tokenURI) returns (uint256)",
  "function verifyCredit(uint256 tokenId)",
  "function listCredit(uint256 tokenId, uint256 price)",
  "function purchaseCredit(uint256 tokenId) payable",
  "function getCreditsOwnedBy(address owner) view returns (uint256[])",
  "function getCreditsForSale() view returns (uint256[])",
  "function creditData(uint256) view returns (uint256 amount, string projectType, string location, uint256 vintage, bool verified, address verifier, uint256 price, bool forSale)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "event CreditMinted(uint256 indexed tokenId, address indexed to, uint256 amount, string projectType)",
  "event CreditSold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price)"
];

const CARBON_TOKEN_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function stake(uint256 amount)",
  "function unstake(uint256 amount)",
  "function claimRewards()",
  "function getPendingRewards(address user) view returns (uint256)",
  "function getStakeInfo(address user) view returns (uint256 amount, uint256 startTime, uint256 pendingReward)",
  "function getAPY() view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Staked(address indexed user, uint256 amount)",
  "event Unstaked(address indexed user, uint256 amount)",
  "event RewardsClaimed(address indexed user, uint256 amount)"
];

export interface CreditData {
  tokenId: number;
  amount: number;
  projectType: string;
  location: string;
  vintage: number;
  verified: boolean;
  verifier: string;
  price: string;
  forSale: boolean;
  owner: string;
  tokenURI?: string;
}

export interface StakeInfo {
  amount: string;
  startTime: number;
  pendingReward: string;
}

export interface TransactionResult {
  hash: string;
  success: boolean;
  error?: string;
}

class ContractService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private carbonCreditContract: ethers.Contract | null = null;
  private carbonTokenContract: ethers.Contract | null = null;

  async initialize(): Promise<boolean> {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not installed');
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      await this.provider.send("eth_requestAccounts", []);
      this.signer = await this.provider.getSigner();

      // Initialize contracts
      this.carbonCreditContract = new ethers.Contract(
        config.blockchain.contractAddress,
        CARBON_CREDIT_ABI,
        this.signer
      );

      this.carbonTokenContract = new ethers.Contract(
        config.blockchain.tokenAddress || config.blockchain.contractAddress,
        CARBON_TOKEN_ABI,
        this.signer
      );

      return true;
    } catch (error) {
      console.error('Failed to initialize contracts:', error);
      return false;
    }
  }

  async connectWallet(): Promise<string | null> {
    try {
      if (!this.provider) {
        await this.initialize();
      }

      const accounts = await this.provider!.send("eth_requestAccounts", []);
      return accounts[0];
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return null;
    }
  }

  async getWalletAddress(): Promise<string | null> {
    try {
      if (!this.signer) return null;
      return await this.signer.getAddress();
    } catch (error) {
      console.error('Failed to get wallet address:', error);
      return null;
    }
  }

  async getTokenBalance(address: string): Promise<string> {
    try {
      if (!this.carbonTokenContract) return '0';
      const balance = await this.carbonTokenContract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return '0';
    }
  }

  async getStakeInfo(address: string): Promise<StakeInfo | null> {
    try {
      if (!this.carbonTokenContract) return null;
      const [amount, startTime, pendingReward] = await this.carbonTokenContract.getStakeInfo(address);
      
      return {
        amount: ethers.formatEther(amount),
        startTime: Number(startTime),
        pendingReward: ethers.formatEther(pendingReward)
      };
    } catch (error) {
      console.error('Failed to get stake info:', error);
      return null;
    }
  }

  async stakeTokens(amount: string): Promise<TransactionResult> {
    try {
      if (!this.carbonTokenContract) {
        throw new Error('Contract not initialized');
      }

      const amountWei = ethers.parseEther(amount);
      const tx = await this.carbonTokenContract.stake(amountWei);
      await tx.wait();

      return { hash: tx.hash, success: true };
    } catch (error: any) {
      console.error('Failed to stake tokens:', error);
      return { hash: '', success: false, error: error.message };
    }
  }

  async unstakeTokens(amount: string): Promise<TransactionResult> {
    try {
      if (!this.carbonTokenContract) {
        throw new Error('Contract not initialized');
      }

      const amountWei = ethers.parseEther(amount);
      const tx = await this.carbonTokenContract.unstake(amountWei);
      await tx.wait();

      return { hash: tx.hash, success: true };
    } catch (error: any) {
      console.error('Failed to unstake tokens:', error);
      return { hash: '', success: false, error: error.message };
    }
  }

  async claimRewards(): Promise<TransactionResult> {
    try {
      if (!this.carbonTokenContract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.carbonTokenContract.claimRewards();
      await tx.wait();

      return { hash: tx.hash, success: true };
    } catch (error: any) {
      console.error('Failed to claim rewards:', error);
      return { hash: '', success: false, error: error.message };
    }
  }

  async getCreditsOwnedBy(address: string): Promise<CreditData[]> {
    try {
      if (!this.carbonCreditContract) return [];

      const tokenIds = await this.carbonCreditContract.getCreditsOwnedBy(address);
      const credits: CreditData[] = [];

      for (const tokenId of tokenIds) {
        const creditData = await this.carbonCreditContract.creditData(tokenId);
        const owner = await this.carbonCreditContract.ownerOf(tokenId);
        
        credits.push({
          tokenId: Number(tokenId),
          amount: Number(creditData.amount),
          projectType: creditData.projectType,
          location: creditData.location,
          vintage: Number(creditData.vintage),
          verified: creditData.verified,
          verifier: creditData.verifier,
          price: ethers.formatEther(creditData.price),
          forSale: creditData.forSale,
          owner
        });
      }

      return credits;
    } catch (error) {
      console.error('Failed to get owned credits:', error);
      return [];
    }
  }

  async getCreditsForSale(): Promise<CreditData[]> {
    try {
      if (!this.carbonCreditContract) return [];

      const tokenIds = await this.carbonCreditContract.getCreditsForSale();
      const credits: CreditData[] = [];

      for (const tokenId of tokenIds) {
        const creditData = await this.carbonCreditContract.creditData(tokenId);
        const owner = await this.carbonCreditContract.ownerOf(tokenId);
        
        credits.push({
          tokenId: Number(tokenId),
          amount: Number(creditData.amount),
          projectType: creditData.projectType,
          location: creditData.location,
          vintage: Number(creditData.vintage),
          verified: creditData.verified,
          verifier: creditData.verifier,
          price: ethers.formatEther(creditData.price),
          forSale: creditData.forSale,
          owner
        });
      }

      return credits;
    } catch (error) {
      console.error('Failed to get credits for sale:', error);
      return [];
    }
  }

  async purchaseCredit(tokenId: number, price: string): Promise<TransactionResult> {
    try {
      if (!this.carbonCreditContract) {
        throw new Error('Contract not initialized');
      }

      const priceWei = ethers.parseEther(price);
      const tx = await this.carbonCreditContract.purchaseCredit(tokenId, { value: priceWei });
      await tx.wait();

      return { hash: tx.hash, success: true };
    } catch (error: any) {
      console.error('Failed to purchase credit:', error);
      return { hash: '', success: false, error: error.message };
    }
  }

  async listCredit(tokenId: number, price: string): Promise<TransactionResult> {
    try {
      if (!this.carbonCreditContract) {
        throw new Error('Contract not initialized');
      }

      const priceWei = ethers.parseEther(price);
      const tx = await this.carbonCreditContract.listCredit(tokenId, priceWei);
      await tx.wait();

      return { hash: tx.hash, success: true };
    } catch (error: any) {
      console.error('Failed to list credit:', error);
      return { hash: '', success: false, error: error.message };
    }
  }

  async getAPY(): Promise<number> {
    try {
      if (!this.carbonTokenContract) return 0;
      const apy = await this.carbonTokenContract.getAPY();
      return Number(apy) / 100; // Convert basis points to percentage
    } catch (error) {
      console.error('Failed to get APY:', error);
      return 0;
    }
  }

  // Event listeners
  onCreditSold(callback: (tokenId: number, from: string, to: string, price: string) => void) {
    if (!this.carbonCreditContract) return;

    this.carbonCreditContract.on('CreditSold', (tokenId, from, to, price) => {
      callback(Number(tokenId), from, to, ethers.formatEther(price));
    });
  }

  onTokensStaked(callback: (user: string, amount: string) => void) {
    if (!this.carbonTokenContract) return;

    this.carbonTokenContract.on('Staked', (user, amount) => {
      callback(user, ethers.formatEther(amount));
    });
  }

  onRewardsClaimed(callback: (user: string, amount: string) => void) {
    if (!this.carbonTokenContract) return;

    this.carbonTokenContract.on('RewardsClaimed', (user, amount) => {
      callback(user, ethers.formatEther(amount));
    });
  }
}

export const contractService = new ContractService();