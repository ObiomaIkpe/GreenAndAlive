import { ethers } from 'ethers';

// Smart Contract ABI (simplified for demo)
const CARBON_CREDIT_ABI = [
  "function mintCarbonCredit(address to, uint256 amount, string memory metadata) public returns (uint256)",
  "function rewardUser(address user, uint256 amount, string memory reason) public",
  "function stakeTokens(uint256 amount) public",
  "function claimRewards() public returns (uint256)",
  "function getUserRewards(address user) public view returns (uint256)",
  "function getStakingBalance(address user) public view returns (uint256)",
  "function verifyOffset(uint256 tokenId, uint256 amount) public",
  "event RewardClaimed(address indexed user, uint256 amount, string reason)",
  "event CarbonCreditMinted(address indexed to, uint256 tokenId, uint256 amount)",
  "event OffsetVerified(address indexed user, uint256 amount, uint256 timestamp)"
];

const CONTRACT_ADDRESS = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"; // Demo address

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;

  async connectWallet(): Promise<string | null> {
    try {
      if (typeof window.ethereum !== 'undefined') {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        await this.provider.send("eth_requestAccounts", []);
        this.signer = await this.provider.getSigner();
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, CARBON_CREDIT_ABI, this.signer);
        
        const address = await this.signer.getAddress();
        return address;
      } else {
        throw new Error('MetaMask not installed');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      return null;
    }
  }

  async claimReward(rewardId: string, amount: number): Promise<string | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const tx = await this.contract.claimRewards();
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Reward claim failed:', error);
      return null;
    }
  }

  async stakeTokens(amount: number): Promise<string | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const tx = await this.contract.stakeTokens(ethers.parseEther(amount.toString()));
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Staking failed:', error);
      return null;
    }
  }

  async verifyOffset(tokenId: string, amount: number): Promise<string | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const tx = await this.contract.verifyOffset(tokenId, ethers.parseEther(amount.toString()));
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Offset verification failed:', error);
      return null;
    }
  }

  async getUserRewards(address: string): Promise<number> {
    try {
      if (!this.contract) return 0;
      
      const rewards = await this.contract.getUserRewards(address);
      return parseFloat(ethers.formatEther(rewards));
    } catch (error) {
      console.error('Failed to get user rewards:', error);
      return 0;
    }
  }

  async getStakingBalance(address: string): Promise<number> {
    try {
      if (!this.contract) return 0;
      
      const balance = await this.contract.getStakingBalance(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error('Failed to get staking balance:', error);
      return 0;
    }
  }

  // Simulate automatic reward triggers
  async checkAndTriggerRewards(userAddress: string, action: string, amount: number): Promise<void> {
    try {
      if (!this.contract) return;

      // Automatic reward logic based on user actions
      let rewardAmount = 0;
      let reason = '';

      switch (action) {
        case 'carbon_offset':
          rewardAmount = amount * 0.1; // 10% bonus tokens
          reason = 'Carbon offset achievement';
          break;
        case 'daily_login':
          rewardAmount = 5;
          reason = 'Daily engagement reward';
          break;
        case 'milestone_reached':
          rewardAmount = 100;
          reason = 'Sustainability milestone';
          break;
        case 'referral':
          rewardAmount = 50;
          reason = 'Successful referral';
          break;
      }

      if (rewardAmount > 0) {
        await this.contract.rewardUser(userAddress, ethers.parseEther(rewardAmount.toString()), reason);
      }
    } catch (error) {
      console.error('Auto reward trigger failed:', error);
    }
  }
}

export const blockchainService = new BlockchainService();