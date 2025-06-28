// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CarbonCredit
 * @dev NFT contract for carbon credits with verification and trading capabilities
 */
contract CarbonCredit is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    struct CreditData {
        uint256 amount; // Amount of CO2 offset in tons
        string projectType; // Type of carbon offset project
        string location; // Geographic location
        uint256 vintage; // Year of carbon offset
        bool verified; // Verification status
        address verifier; // Address of verifying authority
        uint256 price; // Price per ton in wei
        bool forSale; // Whether the credit is for sale
    }
    
    mapping(uint256 => CreditData) public creditData;
    mapping(address => bool) public verifiers;
    mapping(address => uint256) public userRewards;
    
    event CreditMinted(uint256 indexed tokenId, address indexed to, uint256 amount, string projectType);
    event CreditVerified(uint256 indexed tokenId, address indexed verifier);
    event CreditListed(uint256 indexed tokenId, uint256 price);
    event CreditSold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price);
    event RewardEarned(address indexed user, uint256 amount);
    
    constructor() ERC721("CarbonCredit", "CARB") {}
    
    /**
     * @dev Mint a new carbon credit NFT
     */
    function mintCredit(
        address to,
        uint256 amount,
        string memory projectType,
        string memory location,
        uint256 vintage,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        creditData[tokenId] = CreditData({
            amount: amount,
            projectType: projectType,
            location: location,
            vintage: vintage,
            verified: false,
            verifier: address(0),
            price: 0,
            forSale: false
        });
        
        emit CreditMinted(tokenId, to, amount, projectType);
        return tokenId;
    }
    
    /**
     * @dev Verify a carbon credit
     */
    function verifyCredit(uint256 tokenId) public {
        require(verifiers[msg.sender], "Not authorized verifier");
        require(_exists(tokenId), "Token does not exist");
        
        creditData[tokenId].verified = true;
        creditData[tokenId].verifier = msg.sender;
        
        emit CreditVerified(tokenId, msg.sender);
    }
    
    /**
     * @dev List a carbon credit for sale
     */
    function listCredit(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(creditData[tokenId].verified, "Credit not verified");
        
        creditData[tokenId].price = price;
        creditData[tokenId].forSale = true;
        
        emit CreditListed(tokenId, price);
    }
    
    /**
     * @dev Purchase a carbon credit
     */
    function purchaseCredit(uint256 tokenId) public payable nonReentrant {
        require(creditData[tokenId].forSale, "Credit not for sale");
        require(msg.value >= creditData[tokenId].price, "Insufficient payment");
        
        address seller = ownerOf(tokenId);
        uint256 price = creditData[tokenId].price;
        
        creditData[tokenId].forSale = false;
        creditData[tokenId].price = 0;
        
        _transfer(seller, msg.sender, tokenId);
        
        // Transfer payment to seller
        payable(seller).transfer(price);
        
        // Refund excess payment
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
        
        // Award rewards to buyer
        uint256 reward = price / 100; // 1% reward
        userRewards[msg.sender] += reward;
        
        emit CreditSold(tokenId, seller, msg.sender, price);
        emit RewardEarned(msg.sender, reward);
    }
    
    /**
     * @dev Add a verifier
     */
    function addVerifier(address verifier) public onlyOwner {
        verifiers[verifier] = true;
    }
    
    /**
     * @dev Remove a verifier
     */
    function removeVerifier(address verifier) public onlyOwner {
        verifiers[verifier] = false;
    }
    
    /**
     * @dev Get all credits owned by an address
     */
    function getCreditsOwnedBy(address owner) public view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (_exists(i) && ownerOf(i) == owner) {
                tokens[index] = i;
                index++;
            }
        }
        
        return tokens;
    }
    
    /**
     * @dev Get credits available for sale
     */
    function getCreditsForSale() public view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count credits for sale
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (_exists(i) && creditData[i].forSale) {
                count++;
            }
        }
        
        uint256[] memory tokens = new uint256[](count);
        uint256 index = 0;
        
        // Populate array
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (_exists(i) && creditData[i].forSale) {
                tokens[index] = i;
                index++;
            }
        }
        
        return tokens;
    }
    
    /**
     * @dev Withdraw rewards
     */
    function withdrawRewards() public nonReentrant {
        uint256 reward = userRewards[msg.sender];
        require(reward > 0, "No rewards to withdraw");
        
        userRewards[msg.sender] = 0;
        payable(msg.sender).transfer(reward);
    }
    
    // Override required functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}