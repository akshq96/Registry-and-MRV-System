// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title CarbonCreditToken
 * @dev ERC20 token representing Blue Carbon Credits (BCT)
 * Each token represents 1 ton of CO2 equivalent sequestered by blue carbon ecosystems
 */
contract CarbonCreditToken is ERC20, Ownable, Pausable {
    
    // Events
    event CreditsMinted(address indexed to, uint256 amount, uint256 projectId, string reason);
    event CreditsRetired(address indexed from, uint256 amount, string reason);
    event ProjectVerified(uint256 indexed projectId, address indexed verifier);
    
    // Structures
    struct CreditBatch {
        uint256 projectId;
        uint256 amount;
        uint256 mintedAt;
        string verificationHash;
        bool retired;
    }
    
    // State variables
    mapping(uint256 => CreditBatch) public creditBatches;
    mapping(address => bool) public verifiers;
    mapping(uint256 => bool) public verifiedProjects;
    mapping(address => uint256[]) public userCreditBatches;
    
    uint256 public nextBatchId = 1;
    uint256 public totalRetiredCredits;
    
    // Modifiers
    modifier onlyVerifier() {
        require(verifiers[msg.sender] || msg.sender == owner(), "Not authorized verifier");
        _;
    }
    
    modifier validProject(uint256 projectId) {
        require(verifiedProjects[projectId], "Project not verified");
        _;
    }
    
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        // Set deployer as initial verifier
        verifiers[msg.sender] = true;
    }
    
    /**
     * @dev Mint carbon credits for a verified project
     * @param to Address to receive the credits
     * @param amount Amount of credits to mint (in wei)
     * @param projectId ID of the verified project
     * @param verificationHash IPFS hash of verification documents
     */
    function mintCredits(
        address to,
        uint256 amount,
        uint256 projectId,
        string memory verificationHash
    ) external onlyVerifier validProject(projectId) whenNotPaused {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(bytes(verificationHash).length > 0, "Verification hash required");
        
        // Create credit batch
        creditBatches[nextBatchId] = CreditBatch({
            projectId: projectId,
            amount: amount,
            mintedAt: block.timestamp,
            verificationHash: verificationHash,
            retired: false
        });
        
        // Track user's credit batches
        userCreditBatches[to].push(nextBatchId);
        
        // Mint tokens
        _mint(to, amount);
        
        emit CreditsMinted(to, amount, projectId, "Project verification completed");
        nextBatchId++;
    }
    
    /**
     * @dev Retire carbon credits (remove from circulation)
     * @param amount Amount of credits to retire
     * @param reason Reason for retirement
     */
    function retireCredits(uint256 amount, string memory reason) external whenNotPaused {
        require(balanceOf(msg.sender) >= amount, "Insufficient credits to retire");
        require(amount > 0, "Amount must be greater than zero");
        
        _burn(msg.sender, amount);
        totalRetiredCredits += amount;
        
        emit CreditsRetired(msg.sender, amount, reason);
    }
    
    /**
     * @dev Verify a project (only verifiers can do this)
     * @param projectId ID of the project to verify
     */
    function verifyProject(uint256 projectId) external onlyVerifier {
        require(projectId > 0, "Invalid project ID");
        require(!verifiedProjects[projectId], "Project already verified");
        
        verifiedProjects[projectId] = true;
        
        emit ProjectVerified(projectId, msg.sender);
    }
    
    /**
     * @dev Add or remove verifier status
     * @param verifier Address to modify
     * @param status True to add, false to remove
     */
    function setVerifier(address verifier, bool status) external onlyOwner {
        require(verifier != address(0), "Invalid verifier address");
        verifiers[verifier] = status;
    }
    
    /**
     * @dev Get credit batches for a user
     * @param user Address of the user
     * @return Array of batch IDs
     */
    function getUserCreditBatches(address user) external view returns (uint256[] memory) {
        return userCreditBatches[user];
    }
    
    /**
     * @dev Get detailed information about a credit batch
     * @param batchId ID of the batch
     * @return CreditBatch struct
     */
    function getCreditBatch(uint256 batchId) external view returns (CreditBatch memory) {
        return creditBatches[batchId];
    }
    
    /**
     * @dev Check if a project is verified
     * @param projectId ID of the project
     * @return True if verified, false otherwise
     */
    function isProjectVerified(uint256 projectId) external view returns (bool) {
        return verifiedProjects[projectId];
    }
    
    /**
     * @dev Get total supply minus retired credits (active credits)
     * @return Amount of active credits in circulation
     */
    function activeSupply() external view returns (uint256) {
        return totalSupply();
    }
    
    /**
     * @dev Pause contract (emergency use)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override transfer to add pausable functionality
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        require(!paused(), "Token transfers paused");
    }
}
