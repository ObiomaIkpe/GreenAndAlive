import { ethers } from 'ethers';
import { analyticsService } from './analytics';
import { notificationService } from './notificationService';

// Sepolia Testnet Configuration
const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID';
const SEPOLIA_EXPLORER = 'https://sepolia.etherscan.io';

// Enhanced Smart Contract ABI for Sepolia deployment
const CARBON_CREDIT_ABI = [
  // ERC-20 Token Functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  
  // Carbon Credit Specific Functions
  "function mintCarbonCredit(address to, uint256 amount, string memory metadata) public returns (uint256)",
  "function burnCarbonCredit(uint256 amount, string memory reason) public",
  "function offsetCarbon(uint256 amount, string memory project) public",
  
  // Staking Functions
  "function stake(uint256 amount, uint256 lockPeriod) public",
  "function unstake(uint256 stakeId) public returns (uint256)",
  "function getStakingRewards(address user) view returns (uint256)",
  "function claimRewards() public returns (uint256)",
  
  // Governance Functions
  "function propose(string memory description, bytes memory data) public returns (uint256)",
  "function vote(uint256 proposalId, bool support) public",
  "function execute(uint256 proposalId) public",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event CarbonCreditMinted(address indexed to, uint256 amount, string metadata)",
  "event CarbonOffset(address indexed user, uint256 amount, string project)",
  "event Staked(address indexed user, uint256 amount, uint256 lockPeriod, uint256 stakeId)",
  "event RewardsClaimed(address indexed user, uint256 amount)",
  "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description)"
];

// Contract deployment bytecode (simplified for demo)
const CONTRACT_BYTECODE = "0x608060405234801561001057600080fd5b50..."; // This would be the actual compiled bytecode

export interface TestnetDeployment {
  contractAddress: string;
  deploymentTx: string;
  blockNumber: number;
  gasUsed: string;
  deployer: string;
  timestamp: string;
}

export interface StakingInfo {
  stakeId: string;
  amount: string;
  lockPeriod: number;
  startTime: string;
  endTime: string;
  rewards: string;
  isActive: boolean;
}

export class BlockchainTestnetService {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private userAddress: string = '';
  private contractAddress: string = '';

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider(): void {
    try {
      // Initialize with Sepolia testnet
      this.provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
      console.log('Blockchain provider initialized for Sepolia testnet');
    } catch (error) {
      console.error('Failed to initialize blockchain provider:', error);
    }
  }

  async connectWallet(): Promise<string | null> {
    try {
      if (typeof window.ethereum === 'undefined') {
        notificationService.error(
          'MetaMask Required',
          'Please install MetaMask to connect your wallet'
        );
        return null;
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.userAddress = await this.signer.getAddress();

      // Check if we're on Sepolia testnet
      const network = await this.provider.getNetwork();
      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        await this.switchToSepolia();
      }

      // Initialize contract if address is available
      if (this.contractAddress) {
        this.contract = new ethers.Contract(this.contractAddress, CARBON_CREDIT_ABI, this.signer);
      }

      analyticsService.trackWalletConnection(this.userAddress);
      
      notificationService.success(
        'Wallet Connected',
        `Connected to ${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)} on Sepolia testnet`
      );

      return this.userAddress;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      notificationService.error(
        'Connection Failed',
        'Failed to connect wallet. Please try again.'
      );
      return null;
    }
  }

  private async switchToSepolia(): Promise<void> {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'SEP',
                  decimals: 18,
                },
                rpcUrls: [SEPOLIA_RPC_URL],
                blockExplorerUrls: [SEPOLIA_EXPLORER],
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

  async deployContract(): Promise<TestnetDeployment | null> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      notificationService.info(
        'Deploying Contract',
        'Deploying carbon credit contract to Sepolia testnet...'
      );

      // Create contract factory
      const contractFactory = new ethers.ContractFactory(
        CARBON_CREDIT_ABI,
        CONTRACT_BYTECODE,
        this.signer
      );

      // Deploy contract with constructor parameters
      const contract = await contractFactory.deploy(
        "CarbonAI Token",     // name
        "CARB",              // symbol
        18,                  // decimals
        ethers.parseEther("1000000") // initial supply
      );

      // Wait for deployment
      const deploymentReceipt = await contract.waitForDeployment();
      const contractAddress = await contract.getAddress();
      
      // Get deployment transaction details
      const deployTx = contract.deploymentTransaction();
      const receipt = await deployTx?.wait();

      this.contractAddress = contractAddress;
      this.contract = contract;

      const deployment: TestnetDeployment = {
        contractAddress,
        deploymentTx: deployTx?.hash || '',
        blockNumber: receipt?.blockNumber || 0,
        gasUsed: receipt?.gasUsed.toString() || '0',
        deployer: this.userAddress,
        timestamp: new Date().toISOString()
      };

      // Store deployment info
      localStorage.setItem('carbonai_testnet_deployment', JSON.stringify(deployment));

      analyticsService.track({
        name: 'contract_deployed',
        properties: {
          contractAddress,
          network: 'sepolia',
          gasUsed: deployment.gasUsed
        }
      });

      notificationService.success(
        'Contract Deployed!',
        `Contract deployed at ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`,
        {
          label: 'View on Etherscan',
          onClick: () => window.open(`${SEPOLIA_EXPLORER}/address/${contractAddress}`, '_blank')
        }
      );

      return deployment;
    } catch (error) {
      console.error('Contract deployment failed:', error);
      notificationService.error(
        'Deployment Failed',
        'Failed to deploy contract. Please check your wallet and try again.'
      );
      return null;
    }
  }

  async getContractInfo(): Promise<{
    name: string;
    symbol: string;
    totalSupply: string;
    userBalance: string;
  } | null> {
    try {
      if (!this.contract || !this.userAddress) {
        return null;
      }

      const [name, symbol, totalSupply, userBalance] = await Promise.all([
        this.contract.name(),
        this.contract.symbol(),
        this.contract.totalSupply(),
        this.contract.balanceOf(this.userAddress)
      ]);

      return {
        name,
        symbol,
        totalSupply: ethers.formatEther(totalSupply),
        userBalance: ethers.formatEther(userBalance)
      };
    } catch (error) {
      console.error('Failed to get contract info:', error);
      return null;
    }
  }

  async mintTokens(amount: number, metadata: string): Promise<string | null> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.contract.mintCarbonCredit(this.userAddress, amountWei, metadata);
      
      notificationService.info(
        'Transaction Submitted',
        'Minting carbon credits...'
      );

      const receipt = await tx.wait();

      analyticsService.track({
        name: 'tokens_minted',
        properties: {
          amount,
          metadata,
          txHash: tx.hash
        }
      });

      notificationService.success(
        'Tokens Minted!',
        `Successfully minted ${amount} CARB tokens`,
        {
          label: 'View Transaction',
          onClick: () => window.open(`${SEPOLIA_EXPLORER}/tx/${tx.hash}`, '_blank')
        }
      );

      return tx.hash;
    } catch (error) {
      console.error('Token minting failed:', error);
      notificationService.error(
        'Minting Failed',
        'Failed to mint tokens. Please try again.'
      );
      return null;
    }
  }

  async stakeTokens(amount: number, lockPeriodDays: number): Promise<string | null> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const amountWei = ethers.parseEther(amount.toString());
      const lockPeriodSeconds = lockPeriodDays * 24 * 60 * 60;
      
      const tx = await this.contract.stake(amountWei, lockPeriodSeconds);
      
      notificationService.info(
        'Transaction Submitted',
        'Staking tokens...'
      );

      const receipt = await tx.wait();

      analyticsService.track({
        name: 'tokens_staked',
        properties: {
          amount,
          lockPeriodDays,
          txHash: tx.hash
        }
      });

      notificationService.success(
        'Tokens Staked!',
        `Successfully staked ${amount} CARB tokens for ${lockPeriodDays} days`,
        {
          label: 'View Transaction',
          onClick: () => window.open(`${SEPOLIA_EXPLORER}/tx/${tx.hash}`, '_blank')
        }
      );

      return tx.hash;
    } catch (error) {
      console.error('Token staking failed:', error);
      notificationService.error(
        'Staking Failed',
        'Failed to stake tokens. Please try again.'
      );
      return null;
    }
  }

  async offsetCarbon(amount: number, project: string): Promise<string | null> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.contract.offsetCarbon(amountWei, project);
      
      notificationService.info(
        'Transaction Submitted',
        'Offsetting carbon...'
      );

      const receipt = await tx.wait();

      analyticsService.track({
        name: 'carbon_offset',
        properties: {
          amount,
          project,
          txHash: tx.hash
        }
      });

      notificationService.success(
        'Carbon Offset Complete!',
        `Successfully offset ${amount} tons of CO₂ through ${project}`,
        {
          label: 'View Transaction',
          onClick: () => window.open(`${SEPOLIA_EXPLORER}/tx/${tx.hash}`, '_blank')
        }
      );

      return tx.hash;
    } catch (error) {
      console.error('Carbon offset failed:', error);
      notificationService.error(
        'Offset Failed',
        'Failed to offset carbon. Please try again.'
      );
      return null;
    }
  }

  async getStakingInfo(): Promise<StakingInfo[]> {
    // Mock data for demo - in real implementation, this would query the contract
    return [
      {
        stakeId: '1',
        amount: '1000',
        lockPeriod: 90,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        rewards: '125.5',
        isActive: true
      }
    ];
  }

  async claimRewards(): Promise<string | null> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.claimRewards();
      
      notificationService.info(
        'Transaction Submitted',
        'Claiming staking rewards...'
      );

      const receipt = await tx.wait();

      notificationService.success(
        'Rewards Claimed!',
        'Successfully claimed your staking rewards',
        {
          label: 'View Transaction',
          onClick: () => window.open(`${SEPOLIA_EXPLORER}/tx/${tx.hash}`, '_blank')
        }
      );

      return tx.hash;
    } catch (error) {
      console.error('Reward claiming failed:', error);
      notificationService.error(
        'Claim Failed',
        'Failed to claim rewards. Please try again.'
      );
      return null;
    }
  }

  async getNetworkInfo(): Promise<{
    chainId: number;
    name: string;
    blockNumber: number;
    gasPrice: string;
  } | null> {
    try {
      if (!this.provider) {
        return null;
      }

      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const feeData = await this.provider.getFeeData();

      return {
        chainId: Number(network.chainId),
        name: network.name,
        blockNumber,
        gasPrice: ethers.formatUnits(feeData.gasPrice || 0, 'gwei')
      };
    } catch (error) {
      console.error('Failed to get network info:', error);
      return null;
    }
  }

  getExplorerUrl(txHash: string): string {
    return `${SEPOLIA_EXPLORER}/tx/${txHash}`;
  }

  getAddressUrl(address: string): string {
    return `${SEPOLIA_EXPLORER}/address/${address}`;
  }

  isConnected(): boolean {
    return !!this.signer && !!this.userAddress;
  }

  getContractAddress(): string {
    return this.contractAddress;
  }

  getUserAddress(): string {
    return this.userAddress;
  }
}

export const blockchainTestnetService = new BlockchainTestnetService();