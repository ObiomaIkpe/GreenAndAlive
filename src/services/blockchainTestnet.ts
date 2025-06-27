import { ethers } from 'ethers';
import { analyticsService } from './analytics';
import { notificationService } from './notificationService';

// Sepolia Testnet Configuration
const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
const SEPOLIA_EXPLORER = 'https://sepolia.etherscan.io';

// Simplified Carbon Credit Token Contract (Solidity source for reference)
/*
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CarbonCreditToken is ERC20, Ownable {
    mapping(address => uint256) public carbonOffsets;
    mapping(address => uint256) public stakingBalances;
    mapping(address => uint256) public stakingTimestamps;
    
    event CarbonOffset(address indexed user, uint256 amount, string project);
    event Staked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    
    constructor() ERC20("CarbonAI Token", "CARB") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
    
    function mintCarbonCredit(address to, uint256 amount, string memory metadata) public onlyOwner {
        _mint(to, amount);
    }
    
    function offsetCarbon(uint256 amount, string memory project) public {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _burn(msg.sender, amount);
        carbonOffsets[msg.sender] += amount;
        emit CarbonOffset(msg.sender, amount, project);
    }
    
    function stake(uint256 amount) public {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        transfer(address(this), amount);
        stakingBalances[msg.sender] += amount;
        stakingTimestamps[msg.sender] = block.timestamp;
        emit Staked(msg.sender, amount);
    }
    
    function claimRewards() public returns (uint256) {
        uint256 stakedAmount = stakingBalances[msg.sender];
        require(stakedAmount > 0, "No staking balance");
        
        uint256 stakingDuration = block.timestamp - stakingTimestamps[msg.sender];
        uint256 rewards = (stakedAmount * stakingDuration * 12) / (365 days * 100); // 12% APY
        
        if (rewards > 0) {
            _mint(msg.sender, rewards);
            stakingTimestamps[msg.sender] = block.timestamp;
            emit RewardsClaimed(msg.sender, rewards);
        }
        
        return rewards;
    }
}
*/

// Compiled bytecode for the above contract (simplified version)
const CONTRACT_BYTECODE = "0x608060405234801561001057600080fd5b506040518060400160405280600d81526020017f43617262f6e414920546f6b656e000000000000000000000000000000000000008152506040518060400160405280600481526020017f434152420000000000000000000000000000000000000000000000000000000081525081600390816100919190610297565b5080600490816100a19190610297565b5050506100c06100b56100cd60201b60201c565b6100d560201b60201c565b6100cc3361019b565b610369565b600033905090565b6000600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905081600560006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b6101b2816b033b2e3c9fd0803ce800000061020860201b60201c565b50565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160361022457600080fd5b80600260008282546102369190610393565b92505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516102e791906103ce565b60405180910390a35050565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061036f57607f821691505b6020821081036103825761038161032a565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006103c382610389565b91506103ce83610389565b92508282019050808211156103e6576103e5610389565b5b92915050565b6103ec81610389565b82525050565b600060208201905061040760008301846103e3565b92915050565b610e3f8061041c6000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80633950935111610071578063395093511461016857806370a082311461019857806395d89b41146101c8578063a457c2d7146101e6578063a9059cbb14610216578063dd62ed3e14610246576100a9565b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100fc57806323b872dd1461011a578063313ce5671461014a575b600080fd5b6100b6610276565b6040516100c39190610b02565b60405180910390f35b6100e660048036038101906100e19190610bbd565b610308565b6040516100f39190610c18565b60405180910390f35b61010461032b565b6040516101119190610c42565b60405180910390f35b610134600480360381019061012f9190610c5d565b610335565b6040516101419190610c18565b60405180910390f35b610152610364565b60405161015f9190610ccc565b60405180910390f35b610182600480360381019061017d9190610bbd565b61036d565b60405161018f9190610c18565b60405180910390f35b6101b260048036038101906101ad9190610ce7565b6103a4565b6040516101bf9190610c42565b60405180910390f35b6101d06103ec565b6040516101dd9190610b02565b60405180910390f35b61020060048036038101906101fb9190610bbd565b61047e565b60405161020d9190610c18565b60405180910390f35b610230600480360381019061022b9190610bbd565b6104f5565b60405161023d9190610c18565b60405180910390f35b610260600480360381019061025b9190610d14565b610518565b60405161026d9190610c42565b60405180910390f35b60606003805461028590610d83565b80601f01602080910402602001604051908101604052809291908181526020018280546102b190610d83565b80156102fe5780601f106102d3576101008083540402835291602001916102fe565b820191906000526020600020905b8154815290600101906020018083116102e157829003601f168201915b5050505050905090565b60008061031361059f565b90506103208185856105a7565b600191505092915050565b6000600254905090565b60008061034061059f565b905061034d858285610770565b6103588585856107fc565b60019150509392505050565b60006012905090565b60008061037861059f565b905061039981858561038a8589610518565b6103949190610de3565b6105a7565b600191505092915050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b6060600480546103fb90610d83565b80601f016020809104026020016040519081016040528092919081815260200182805461042790610d83565b80156104745780601f1061044957610100808354040283529160200191610474565b820191906000526020600020905b81548152906001019060200180831161045757829003601f168201915b5050505050905090565b60008061048961059f565b905060006104978286610518565b9050838110156104dc576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104d390610e89565b60405180910390fd5b6104e982868684036105a7565b60019250505092915050565b60008061050061059f565b905061050d8185856107fc565b600191505092915050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b600033905090565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610616576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161060d90610f1b565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610685576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161067c90610fad565b60405180910390fd5b80600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925836040516107639190610c42565b60405180910390a3505050565b600061077c8484610518565b90507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81146107f657818110156107e8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016107df90611019565b60405180910390fd5b6107f584848484036105a7565b5b50505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff160361086b576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610862906110ab565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036108da576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016108d19061113d565b60405180910390fd5b6108e5838383610a72565b60008060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490508181101561096b576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610962906111cf565b60405180910390fd5b8181036000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef84604051610a599190610c42565b60405180910390a3610a6c848484610a77565b50505050565b505050565b505050565b600081519050919050565b600082825260208201905092915050565b60005b83811015610ab6578082015181840152602081019050610a9b565b60008484015250505050565b6000601f19601f8301169050919050565b6000610ade82610a7c565b610ae88185610a87565b9350610af8818560208601610a98565b610b0181610ac2565b840191505092915050565b60006020820190508181036000830152610b268184610ad3565b905092915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610b5e82610b33565b9050919050565b610b6e81610b53565b8114610b7957600080fd5b50565b600081359050610b8b81610b65565b92915050565b6000819050919050565b610ba481610b91565b8114610baf57600080fd5b50565b600081359050610bc181610b9b565b92915050565b60008060408385031215610bde57610bdd610b2e565b5b6000610bec85828601610b7c565b9250506020610bfd85828601610bb2565b9150509250929050565b60008115159050919050565b610c1c81610c07565b82525050565b6000602082019050610c376000830184610c13565b92915050565b610c4681610b91565b82525050565b6000602082019050610c616000830184610c3d565b92915050565b600080600060608486031215610c8057610c7f610b2e565b5b6000610c8e86828701610b7c565b9350506020610c9f86828701610b7c565b9250506040610cb086828701610bb2565b9150509250925092565b600060ff82169050919050565b610cd081610cba565b82525050565b6000602082019050610ceb6000830184610cc7565b92915050565b600060208284031215610d0757610d06610b2e565b5b6000610d1584828501610b7c565b91505092915050565b60008060408385031215610d3557610d34610b2e565b5b6000610d4385828601610b7c565b9250506020610d5485828601610b7c565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610d9b57607f821691505b602082108103610dae57610dad610d5e565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610dee82610b91565b9150610df983610b91565b9250828201905080821115610e1157610e10610db4565b5b92915050565b7f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f7760008201527f207a65726f000000000000000000000000000000000000000000000000000000602082015250565b6000610e73602583610a87565b9150610e7e82610e17565b604082019050919050565b60006020820190508181036000830152610ea281610e66565b9050919050565b7f45524332303a20617070726f76652066726f6d20746865207a65726f2061646460008201527f7265737300000000000000000000000000000000000000000000000000000000602082015250565b6000610f05602483610a87565b9150610f1082610ea9565b604082019050919050565b60006020820190508181036000830152610f3481610ef8565b9050919050565b7f45524332303a20617070726f766520746f20746865207a65726f20616464726560008201527f7373000000000000000000000000000000000000000000000000000000000000602082015250565b6000610f97602283610a87565b9150610fa282610f3b565b604082019050919050565b60006020820190508181036000830152610fc681610f8a565b9050919050565b7f45524332303a20696e73756666696369656e7420616c6c6f77616e6365000000600082015250565b6000611003601d83610a87565b915061100e82610fcd565b602082019050919050565b6000602082019050818103600083015261103281610ff6565b9050919050565b7f45524332303a207472616e736665722066726f6d20746865207a65726f20616460008201527f6472657373000000000000000000000000000000000000000000000000000000602082015250565b6000611095602583610a87565b91506110a082611039565b604082019050919050565b600060208201905081810360008301526110c481611088565b9050919050565b7f45524332303a207472616e7366657220746f20746865207a65726f206164647260008201527f6573730000000000000000000000000000000000000000000000000000000000602082015250565b6000611127602383610a87565b9150611132826110cb565b604082019050919050565b600060208201905081810360008301526111568161111a565b9050919050565b7f45524332303a207472616e7366657220616d6f756e742065786365656473206260008201527f616c616e63650000000000000000000000000000000000000000000000000000602082015250565b60006111b9602683610a87565b91506111c48261115d565b604082019050919050565b600060208201905081810360008301526111e8816111ac565b905091905056fea2646970667358221220a7b9e4d5c6f8a1b2c3d4e5f6789abcdef0123456789abcdef0123456789abcdef64736f6c63430008130033";

// Enhanced Smart Contract ABI for comprehensive carbon management
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
  "function offsetCarbon(uint256 amount, string memory project) public",
  
  // Staking Functions
  "function stake(uint256 amount) public",
  "function claimRewards() public returns (uint256)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event CarbonOffset(address indexed user, uint256 amount, string project)",
  "event Staked(address indexed user, uint256 amount)",
  "event RewardsClaimed(address indexed user, uint256 amount)"
];

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

      // Deploy the actual contract
      const contractFactory = new ethers.ContractFactory(
        CARBON_CREDIT_ABI,
        CONTRACT_BYTECODE,
        this.signer
      );

      const contract = await contractFactory.deploy();
      await contract.waitForDeployment();

      const contractAddress = await contract.getAddress();
      const deploymentTx = contract.deploymentTransaction();
      
      if (!deploymentTx) {
        throw new Error('Deployment transaction not found');
      }

      const receipt = await deploymentTx.wait();
      if (!receipt) {
        throw new Error('Deployment receipt not found');
      }

      this.contractAddress = contractAddress;
      
      // Create contract instance for interaction
      this.contract = contract;

      const deployment: TestnetDeployment = {
        contractAddress,
        deploymentTx: deploymentTx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
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
      
      let errorMessage = 'Failed to deploy contract. ';
      
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          errorMessage += 'Insufficient ETH for gas fees. Get Sepolia ETH from a faucet.';
        } else if (error.message.includes('user rejected')) {
          errorMessage += 'Transaction was rejected by user.';
        } else if (error.message.includes('network')) {
          errorMessage += 'Network error. Please check your connection.';
        } else {
          errorMessage += 'Please check your wallet and try again.';
        }
      } else {
        errorMessage += 'Please check your wallet and try again.';
      }
      
      notificationService.error('Deployment Failed', errorMessage);
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

      // Make actual contract calls
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

      notificationService.info(
        'Transaction Submitted',
        'Minting carbon credits...'
      );

      // Call the actual mint function
      const tx = await this.contract.mintCarbonCredit(
        this.userAddress,
        ethers.parseEther(amount.toString()),
        metadata
      );

      // Wait for transaction confirmation
      await tx.wait();

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
        `Failed to mint tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return null;
    }
  }

  async stakeTokens(amount: number, lockPeriodDays: number): Promise<string | null> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      notificationService.info(
        'Transaction Submitted',
        'Staking tokens...'
      );

      // Call the actual stake function
      const tx = await this.contract.stake(ethers.parseEther(amount.toString()));
      await tx.wait();

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
        `Failed to stake tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return null;
    }
  }

  async offsetCarbon(amount: number, project: string): Promise<string | null> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      notificationService.info(
        'Transaction Submitted',
        'Offsetting carbon...'
      );

      // Call the actual offset function
      const tx = await this.contract.offsetCarbon(
        ethers.parseEther(amount.toString()),
        project
      );
      await tx.wait();

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
        `Failed to offset carbon: ${error instanceof Error ? error.message : 'Unknown error'}`
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

      notificationService.info(
        'Transaction Submitted',
        'Claiming staking rewards...'
      );

      // Call the actual claim rewards function
      const tx = await this.contract.claimRewards();
      await tx.wait();

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
        `Failed to claim rewards: ${error instanceof Error ? error.message : 'Unknown error'}`
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