import { ethers } from 'ethers';
import { analyticsService } from './analytics';

// Enhanced Smart Contract ABI for comprehensive carbon management
const CARBON_MANAGEMENT_ABI = [
  // Core carbon credit functions
  "function mintCarbonCredit(address to, uint256 amount, string memory metadata, bytes32 verificationHash) public returns (uint256)",
  "function burnCarbonCredit(uint256 tokenId, uint256 amount, string memory reason) public",
  
  // Waste disposal rewards
  "function reportWasteDisposal(string memory wasteType, uint256 amount, string memory method, bytes32 proofHash) public",
  "function verifyWasteDisposal(bytes32 reportId, bool approved, string memory verifierNotes) public",
  "function claimWasteReward(bytes32 reportId) public returns (uint256)",
  
  // Corporate carbon compliance
  "function registerCorporation(string memory name, uint256 expectedEmissions, uint256 compliancePeriod) public",
  "function reportCorporateEmissions(uint256 actualEmissions, bytes32 verificationHash) public",
  "function purchaseCorporateCredits(uint256 amount) public payable",
  "function redeemExcessCredits() public returns (uint256)",
  
  // Third-party verification system
  "function registerVerifier(address verifier, string memory credentials, string[] memory specializations) public",
  "function submitVerificationRequest(bytes32 dataHash, string memory verificationType, uint256 bounty) public payable",
  "function completeVerification(bytes32 requestId, bool approved, string memory report, uint256 confidence) public",
  
  // Staking and rewards
  "function stakeTokens(uint256 amount, uint256 lockPeriod) public",
  "function unstakeTokens(uint256 stakeId) public returns (uint256)",
  "function claimStakingRewards(uint256 stakeId) public returns (uint256)",
  
  // Governance and reputation
  "function proposeGovernanceChange(string memory proposal, bytes memory data) public",
  "function voteOnProposal(uint256 proposalId, bool support, uint256 votingPower) public",
  "function updateReputationScore(address user, int256 change, string memory reason) public",
  
  // Events
  "event WasteDisposalReported(address indexed user, bytes32 indexed reportId, string wasteType, uint256 amount, string method)",
  "event WasteDisposalVerified(bytes32 indexed reportId, address indexed verifier, bool approved, uint256 rewardAmount)",
  "event CorporateEmissionsReported(address indexed corporation, uint256 expectedEmissions, uint256 actualEmissions, int256 difference)",
  "event CorporateCreditsRedeemed(address indexed corporation, uint256 excessCredits, uint256 rewardAmount)",
  "event VerificationCompleted(bytes32 indexed requestId, address indexed verifier, bool approved, uint256 confidence)",
  "event ReputationUpdated(address indexed user, int256 change, uint256 newScore, string reason)",
  "event GovernanceProposal(uint256 indexed proposalId, address indexed proposer, string proposal)",
  "event RewardDistributed(address indexed recipient, uint256 amount, string category, bytes32 indexed referenceId)"
];

const CONTRACT_ADDRESS = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"; // Demo address

export interface WasteDisposalReport {
  id: string;
  wasteType: 'organic' | 'recyclable' | 'electronic' | 'hazardous' | 'general';
  amount: number; // in kg
  method: 'recycling' | 'composting' | 'proper_disposal' | 'upcycling' | 'donation';
  location: string;
  timestamp: string;
  proofHash: string;
  status: 'pending' | 'verified' | 'rejected';
  rewardAmount?: number;
  verifierNotes?: string;
}

export interface CorporateProfile {
  id: string;
  name: string;
  industry: string;
  expectedEmissions: number; // tons CO2/year
  actualEmissions: number;
  compliancePeriod: string;
  creditsOwned: number;
  creditsRequired: number;
  reputationScore: number;
  verificationStatus: 'pending' | 'verified' | 'non_compliant';
}

export interface VerificationRequest {
  id: string;
  type: 'waste_disposal' | 'carbon_offset' | 'corporate_emissions' | 'renewable_energy';
  dataHash: string;
  requester: string;
  bounty: number;
  status: 'open' | 'in_progress' | 'completed' | 'disputed';
  assignedVerifier?: string;
  confidence?: number;
  report?: string;
  deadline: string;
}

export interface StakingPosition {
  id: string;
  amount: number;
  lockPeriod: number; // in days
  startDate: string;
  endDate: string;
  apy: number;
  accruedRewards: number;
  status: 'active' | 'unlocked' | 'withdrawn';
}

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private userAddress: string = '';
  private isTestnet: boolean = true; // Use testnet by default

  async connectWallet(): Promise<string | null> {
    try {
      if (typeof window.ethereum !== 'undefined') {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        await this.provider.send("eth_requestAccounts", []);
        this.signer = await this.provider.getSigner();
        
        this.userAddress = await this.signer.getAddress();
        
        // Check network and switch to Sepolia if needed
        const network = await this.provider.getNetwork();
        if (Number(network.chainId) !== 11155111) {
          await this.switchToSepolia();
        }
        
        // Initialize contract if available
        const contractAddress = this.getStoredContractAddress();
        if (contractAddress) {
          this.contract = new ethers.Contract(contractAddress, CARBON_MANAGEMENT_ABI, this.signer);
        }
        
        // Track wallet connection
        analyticsService.trackWalletConnection(this.userAddress);
        
        return this.userAddress;
      } else {
        throw new Error('MetaMask not installed. Please install MetaMask to use blockchain features.');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      return null;
    }
  }

  private async switchToSepolia(): Promise<void> {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'SEP',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  }

  private getStoredContractAddress(): string | null {
    try {
      const stored = localStorage.getItem('carbonai_testnet_deployment');
      if (stored) {
        const deployment = JSON.parse(stored);
        return deployment.contractAddress;
      }
    } catch (error) {
      console.warn('Failed to load stored contract address:', error);
    }
    return null;
  }

  // === WASTE DISPOSAL REWARDS SYSTEM ===

  async reportWasteDisposal(report: Omit<WasteDisposalReport, 'id' | 'status' | 'timestamp'>): Promise<string | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes(
        `${report.wasteType}-${report.amount}-${report.method}-${Date.now()}`
      ));
      
      const tx = await this.contract.reportWasteDisposal(
        report.wasteType,
        ethers.parseUnits(report.amount.toString(), 18),
        report.method,
        proofHash
      );
      
      await tx.wait();
      
      // Track waste disposal reporting
      analyticsService.track({
        name: 'waste_disposal_reported',
        properties: {
          wasteType: report.wasteType,
          amount: report.amount,
          method: report.method,
          txHash: tx.hash
        }
      });
      
      return tx.hash;
    } catch (error) {
      console.error('Waste disposal reporting failed:', error);
      return null;
    }
  }

  async getWasteDisposalReports(userAddress?: string): Promise<WasteDisposalReport[]> {
    // In a real implementation, this would query blockchain events
    // For demo, return mock data
    return [
      {
        id: 'waste-001',
        wasteType: 'recyclable',
        amount: 15.5,
        method: 'recycling',
        location: 'San Francisco, CA',
        timestamp: '2024-01-15T10:30:00Z',
        proofHash: '0x123...',
        status: 'verified',
        rewardAmount: 25,
        verifierNotes: 'Proper recycling facility confirmed'
      },
      {
        id: 'waste-002',
        wasteType: 'organic',
        amount: 8.2,
        method: 'composting',
        location: 'San Francisco, CA',
        timestamp: '2024-01-14T15:45:00Z',
        proofHash: '0x456...',
        status: 'pending'
      }
    ];
  }

  // === CORPORATE CARBON COMPLIANCE ===

  async registerCorporation(profile: Omit<CorporateProfile, 'id' | 'actualEmissions' | 'creditsOwned' | 'reputationScore' | 'verificationStatus'>): Promise<string | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const compliancePeriodDays = 365; // 1 year
      
      const tx = await this.contract.registerCorporation(
        profile.name,
        ethers.parseUnits(profile.expectedEmissions.toString(), 18),
        compliancePeriodDays
      );
      
      await tx.wait();
      
      analyticsService.track({
        name: 'corporation_registered',
        properties: {
          name: profile.name,
          industry: profile.industry,
          expectedEmissions: profile.expectedEmissions,
          txHash: tx.hash
        }
      });
      
      return tx.hash;
    } catch (error) {
      console.error('Corporation registration failed:', error);
      return null;
    }
  }

  async reportCorporateEmissions(actualEmissions: number, verificationData: any): Promise<string | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(verificationData)));
      
      const tx = await this.contract.reportCorporateEmissions(
        ethers.parseUnits(actualEmissions.toString(), 18),
        verificationHash
      );
      
      await tx.wait();
      
      analyticsService.track({
        name: 'corporate_emissions_reported',
        properties: {
          actualEmissions,
          txHash: tx.hash
        }
      });
      
      return tx.hash;
    } catch (error) {
      console.error('Corporate emissions reporting failed:', error);
      return null;
    }
  }

  async purchaseCorporateCredits(amount: number, pricePerCredit: number): Promise<string | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const totalCost = ethers.parseEther((amount * pricePerCredit).toString());
      
      const tx = await this.contract.purchaseCorporateCredits(
        ethers.parseUnits(amount.toString(), 18),
        { value: totalCost }
      );
      
      await tx.wait();
      
      analyticsService.track({
        name: 'corporate_credits_purchased',
        properties: {
          amount,
          totalCost: amount * pricePerCredit,
          txHash: tx.hash
        }
      });
      
      return tx.hash;
    } catch (error) {
      console.error('Corporate credit purchase failed:', error);
      return null;
    }
  }

  async redeemExcessCredits(): Promise<{ txHash: string; rewardAmount: number } | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const tx = await this.contract.redeemExcessCredits();
      const receipt = await tx.wait();
      
      // Parse events to get reward amount
      const rewardAmount = 100; // Would parse from events in real implementation
      
      analyticsService.track({
        name: 'excess_credits_redeemed',
        properties: {
          rewardAmount,
          txHash: tx.hash
        }
      });
      
      return { txHash: tx.hash, rewardAmount };
    } catch (error) {
      console.error('Excess credit redemption failed:', error);
      return null;
    }
  }

  // === THIRD-PARTY VERIFICATION SYSTEM ===

  async registerAsVerifier(credentials: string, specializations: string[]): Promise<string | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const tx = await this.contract.registerVerifier(
        this.userAddress,
        credentials,
        specializations
      );
      
      await tx.wait();
      
      analyticsService.track({
        name: 'verifier_registered',
        properties: {
          specializations,
          txHash: tx.hash
        }
      });
      
      return tx.hash;
    } catch (error) {
      console.error('Verifier registration failed:', error);
      return null;
    }
  }

  async submitVerificationRequest(
    dataHash: string, 
    verificationType: string, 
    bounty: number
  ): Promise<string | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const bountyWei = ethers.parseEther(bounty.toString());
      
      const tx = await this.contract.submitVerificationRequest(
        dataHash,
        verificationType,
        bountyWei,
        { value: bountyWei }
      );
      
      await tx.wait();
      
      analyticsService.track({
        name: 'verification_request_submitted',
        properties: {
          verificationType,
          bounty,
          txHash: tx.hash
        }
      });
      
      return tx.hash;
    } catch (error) {
      console.error('Verification request submission failed:', error);
      return null;
    }
  }

  async completeVerification(
    requestId: string,
    approved: boolean,
    report: string,
    confidence: number
  ): Promise<string | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const requestIdBytes = ethers.keccak256(ethers.toUtf8Bytes(requestId));
      
      const tx = await this.contract.completeVerification(
        requestIdBytes,
        approved,
        report,
        confidence
      );
      
      await tx.wait();
      
      analyticsService.track({
        name: 'verification_completed',
        properties: {
          approved,
          confidence,
          txHash: tx.hash
        }
      });
      
      return tx.hash;
    } catch (error) {
      console.error('Verification completion failed:', error);
      return null;
    }
  }

  // === ENHANCED STAKING SYSTEM ===

  async stakeTokens(amount: number, lockPeriod: number): Promise<string | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const amountWei = ethers.parseEther(amount.toString());
      
      const tx = await this.contract.stakeTokens(amountWei, lockPeriod);
      await tx.wait();
      
      analyticsService.track({
        name: 'tokens_staked',
        properties: {
          amount,
          lockPeriod,
          txHash: tx.hash
        }
      });
      
      return tx.hash;
    } catch (error) {
      console.error('Token staking failed:', error);
      return null;
    }
  }

  async getStakingPositions(userAddress?: string): Promise<StakingPosition[]> {
    // Mock data for demo - would query blockchain in real implementation
    return [
      {
        id: 'stake-001',
        amount: 1000,
        lockPeriod: 90,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-04-01T00:00:00Z',
        apy: 12.5,
        accruedRewards: 31.25,
        status: 'active'
      },
      {
        id: 'stake-002',
        amount: 500,
        lockPeriod: 30,
        startDate: '2024-01-15T00:00:00Z',
        endDate: '2024-02-14T00:00:00Z',
        apy: 8.0,
        accruedRewards: 3.29,
        status: 'unlocked'
      }
    ];
  }

  // === REPUTATION AND GOVERNANCE ===

  async updateReputationScore(targetAddress: string, change: number, reason: string): Promise<string | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const tx = await this.contract.updateReputationScore(
        targetAddress,
        change,
        reason
      );
      
      await tx.wait();
      
      analyticsService.track({
        name: 'reputation_updated',
        properties: {
          change,
          reason,
          txHash: tx.hash
        }
      });
      
      return tx.hash;
    } catch (error) {
      console.error('Reputation update failed:', error);
      return null;
    }
  }

  async proposeGovernanceChange(proposal: string, data: any): Promise<string | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const encodedData = ethers.toUtf8Bytes(JSON.stringify(data));
      
      const tx = await this.contract.proposeGovernanceChange(proposal, encodedData);
      await tx.wait();
      
      analyticsService.track({
        name: 'governance_proposal_submitted',
        properties: {
          proposal,
          txHash: tx.hash
        }
      });
      
      return tx.hash;
    } catch (error) {
      console.error('Governance proposal failed:', error);
      return null;
    }
  }

  // === AUTOMATED REWARD CALCULATIONS ===

  calculateWasteDisposalReward(wasteType: string, amount: number, method: string): number {
    const baseRates = {
      'organic': { recycling: 2, composting: 3, proper_disposal: 1 },
      'recyclable': { recycling: 4, upcycling: 5, proper_disposal: 2 },
      'electronic': { recycling: 8, proper_disposal: 4, donation: 6 },
      'hazardous': { proper_disposal: 10 },
      'general': { proper_disposal: 1 }
    };

    const rate = baseRates[wasteType as keyof typeof baseRates]?.[method as keyof any] || 1;
    const multiplier = amount > 50 ? 1.2 : amount > 20 ? 1.1 : 1.0; // Bulk bonus
    
    return Math.floor(amount * rate * multiplier);
  }

  calculateCorporateReward(expectedEmissions: number, actualEmissions: number, creditsOwned: number): number {
    const emissionDifference = expectedEmissions - actualEmissions;
    const excessCredits = creditsOwned - actualEmissions;
    
    let reward = 0;
    
    // Reward for emitting less than expected
    if (emissionDifference > 0) {
      reward += emissionDifference * 50; // 50 tokens per ton saved
    }
    
    // Reward for excess credits
    if (excessCredits > 0) {
      reward += excessCredits * 25; // 25 tokens per excess credit
    }
    
    return Math.floor(reward);
  }

  // === UTILITY FUNCTIONS ===

  async getUserStats(address?: string): Promise<{
    totalRewards: number;
    reputationScore: number;
    verificationsCompleted: number;
    wasteReportsSubmitted: number;
    stakingBalance: number;
  }> {
    // Mock data for demo
    return {
      totalRewards: 1247,
      reputationScore: 85,
      verificationsCompleted: 12,
      wasteReportsSubmitted: 28,
      stakingBalance: 1500
    };
  }

  async getVerificationRequests(status?: string): Promise<VerificationRequest[]> {
    // Mock data for demo
    return [
      {
        id: 'verify-001',
        type: 'waste_disposal',
        dataHash: '0x123...',
        requester: '0x456...',
        bounty: 50,
        status: 'open',
        deadline: '2024-01-20T00:00:00Z'
      },
      {
        id: 'verify-002',
        type: 'corporate_emissions',
        dataHash: '0x789...',
        requester: '0xabc...',
        bounty: 200,
        status: 'in_progress',
        assignedVerifier: this.userAddress,
        deadline: '2024-01-18T00:00:00Z'
      }
    ];
  }

  async getCorporateProfiles(): Promise<CorporateProfile[]> {
    // Mock data for demo
    return [
      {
        id: 'corp-001',
        name: 'GreenTech Industries',
        industry: 'Manufacturing',
        expectedEmissions: 1000,
        actualEmissions: 850,
        compliancePeriod: '2024',
        creditsOwned: 900,
        creditsRequired: 850,
        reputationScore: 92,
        verificationStatus: 'verified'
      },
      {
        id: 'corp-002',
        name: 'EcoRefinery Corp',
        industry: 'Oil & Gas',
        expectedEmissions: 5000,
        actualEmissions: 4800,
        compliancePeriod: '2024',
        creditsOwned: 4500,
        creditsRequired: 4800,
        reputationScore: 78,
        verificationStatus: 'non_compliant'
      }
    ];
  }

  // Legacy methods for backward compatibility
  async claimReward(rewardId: string, amount: number): Promise<string | null> {
    return this.claimWasteReward(rewardId);
  }

  async claimWasteReward(reportId: string): Promise<string | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const reportIdBytes = ethers.keccak256(ethers.toUtf8Bytes(reportId));
      const tx = await this.contract.claimWasteReward(reportIdBytes);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Waste reward claim failed:', error);
      return null;
    }
  }

  async verifyOffset(tokenId: string, amount: number): Promise<string | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      const tx = await this.contract.burnCarbonCredit(
        tokenId,
        ethers.parseEther(amount.toString()),
        'Carbon offset verification'
      );
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Offset verification failed:', error);
      return null;
    }
  }

  async getUserRewards(address: string): Promise<number> {
    const stats = await this.getUserStats(address);
    return stats.totalRewards;
  }

  async getStakingBalance(address: string): Promise<number> {
    const stats = await this.getUserStats(address);
    return stats.stakingBalance;
  }
}

export const blockchainService = new BlockchainService();