// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CarbonToken
 * @dev ERC20 token for carbon credit rewards and staking
 */
contract CarbonToken is ERC20, Ownable, ReentrancyGuard {
    
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lastRewardTime;
    }
    
    mapping(address => StakeInfo) public stakes;
    mapping(address => uint256) public pendingRewards;
    
    uint256 public constant REWARD_RATE = 100; // 1% per year (100 basis points)
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    uint256 public totalStaked;
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsEarned(address indexed user, uint256 amount);
    
    constructor() ERC20("CarbonToken", "CARB") {
        // Mint initial supply to contract owner
        _mint(msg.sender, 1000000 * 10**decimals()); // 1 million tokens
    }
    
    /**
     * @dev Stake tokens to earn rewards
     */
    function stake(uint256 amount) public nonReentrant {
        require(amount > 0, "Cannot stake 0 tokens");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Update rewards before changing stake
        updateRewards(msg.sender);
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Update stake info
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].startTime = block.timestamp;
        stakes[msg.sender].lastRewardTime = block.timestamp;
        
        totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @dev Unstake tokens
     */
    function unstake(uint256 amount) public nonReentrant {
        require(amount > 0, "Cannot unstake 0 tokens");
        require(stakes[msg.sender].amount >= amount, "Insufficient staked amount");
        
        // Update rewards before changing stake
        updateRewards(msg.sender);
        
        // Update stake info
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;
        
        // Transfer tokens back to user
        _transfer(address(this), msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }
    
    /**
     * @dev Claim pending rewards
     */
    function claimRewards() public nonReentrant {
        updateRewards(msg.sender);
        
        uint256 reward = pendingRewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        
        pendingRewards[msg.sender] = 0;
        
        // Mint new tokens as rewards
        _mint(msg.sender, reward);
        
        emit RewardsClaimed(msg.sender, reward);
    }
    
    /**
     * @dev Update rewards for a user
     */
    function updateRewards(address user) internal {
        StakeInfo storage userStake = stakes[user];
        
        if (userStake.amount > 0) {
            uint256 timeElapsed = block.timestamp - userStake.lastRewardTime;
            uint256 reward = (userStake.amount * REWARD_RATE * timeElapsed) / (SECONDS_PER_YEAR * 10000);
            
            pendingRewards[user] += reward;
            userStake.lastRewardTime = block.timestamp;
            
            if (reward > 0) {
                emit RewardsEarned(user, reward);
            }
        }
    }
    
    /**
     * @dev Get pending rewards for a user
     */
    function getPendingRewards(address user) public view returns (uint256) {
        StakeInfo memory userStake = stakes[user];
        
        if (userStake.amount == 0) {
            return pendingRewards[user];
        }
        
        uint256 timeElapsed = block.timestamp - userStake.lastRewardTime;
        uint256 newReward = (userStake.amount * REWARD_RATE * timeElapsed) / (SECONDS_PER_YEAR * 10000);
        
        return pendingRewards[user] + newReward;
    }
    
    /**
     * @dev Get staking info for a user
     */
    function getStakeInfo(address user) public view returns (uint256 amount, uint256 startTime, uint256 pendingReward) {
        StakeInfo memory userStake = stakes[user];
        return (userStake.amount, userStake.startTime, getPendingRewards(user));
    }
    
    /**
     * @dev Mint tokens for carbon credit rewards
     */
    function mintReward(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Get APY for staking
     */
    function getAPY() public pure returns (uint256) {
        return REWARD_RATE; // Returns basis points (100 = 1%)
    }
}