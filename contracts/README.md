# CarbonAI Smart Contracts

This directory contains the smart contracts for the CarbonAI platform, including carbon credit NFTs and staking tokens.

## Contracts

### CarbonCredit.sol
- **Type**: ERC721 NFT Contract
- **Purpose**: Represents carbon credits as NFTs
- **Features**:
  - Mint carbon credits with metadata
  - Verify credits through authorized verifiers
  - List credits for sale
  - Purchase credits with ETH
  - Track ownership and trading history

### CarbonToken.sol
- **Type**: ERC20 Token Contract
- **Purpose**: CARB utility token for rewards and staking
- **Features**:
  - Stake tokens to earn rewards
  - 1% APY for staking
  - Claim accumulated rewards
  - Unstake tokens anytime

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Compile contracts:
```bash
npm run compile
```

4. Run tests:
```bash
npm run test
```

## Deployment

### Local Development
```bash
# Start local Hardhat node
npx hardhat node

# Deploy to local network
npm run deploy:local
```

### Testnet (Sepolia)
```bash
npm run deploy:sepolia
```

### Mainnet
```bash
npm run deploy:mainnet
```

## Contract Addresses

After deployment, update your frontend `.env` file with the contract addresses:

```env
VITE_CONTRACT_ADDRESS=0x... # CarbonCredit contract
VITE_TOKEN_ADDRESS=0x...    # CarbonToken contract
```

## Verification

Contracts are automatically verified on Etherscan after deployment to public networks.

## Security

- All contracts use OpenZeppelin libraries for security
- ReentrancyGuard protection on financial functions
- Access control for administrative functions
- Comprehensive testing coverage

## Gas Optimization

- Optimized for minimal gas usage
- Batch operations where possible
- Efficient storage patterns
- Gas reporter enabled for monitoring