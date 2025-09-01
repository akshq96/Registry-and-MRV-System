// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title BlueCarbonRegistry
 * @dev Registry for blue carbon ecosystem restoration projects with MRV capabilities
 */
contract BlueCarbonRegistry is AccessControl, ReentrancyGuard, Pausable {
    
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant DATA_COLLECTOR_ROLE = keccak256("DATA_COLLECTOR_ROLE");
    
    // Enums
    enum ProjectStatus { Pending, Active, Verified, Suspended }
    enum EcosystemType { Mangrove, Seagrass, SaltMarsh, TidalMarsh }
    enum StakeholderType { NGO, Community, Panchayat, Researcher, Government }
    
    // Structures
    struct Project {
        uint256 id;
        string name;
        string location;
        uint256 area; // in hectares
        EcosystemType ecosystemType;
        address owner;
        ProjectStatus status;
        uint256 createdAt;
        uint256 verifiedAt;
        string[] documentHashes; // IPFS hashes
        uint256 estimatedCredits;
        uint256 actualCredits;
    }
    
    struct Stakeholder {
        address stakeholderAddress;
        string name;
        string organization;
        StakeholderType stakeholderType;
        string location;
        bool approved;
        uint256 registeredAt;
        uint256[] projectIds;
    }
    
    struct MRVData {
        uint256 projectId;
        address collector;
        uint256 timestamp;
        string dataHash; // IPFS hash of measurement data
        string coordinates;
        uint256 carbonSequestration; // tons CO2 equivalent
        bool verified;
        address verifier;
        uint256 verifiedAt;
    }
    
    // State variables
    mapping(uint256 => Project) public projects;
    mapping(address => Stakeholder) public stakeholders;
    mapping(uint256 => MRVData[]) public projectMRVData;
    mapping(uint256 => MRVData) public mrvDataById;
    
    uint256 public nextProjectId = 1;
    uint256 public nextMRVDataId = 1;
    uint256 public totalProjects;
    uint256 public totalVerifiedProjects;
    uint256 public totalCarbonSequestered;
    
    // Events
    event ProjectRegistered(uint256 indexed projectId, address indexed owner, string name);
    event ProjectVerified(uint256 indexed projectId, address indexed verifier);
    event StakeholderRegistered(address indexed stakeholder, StakeholderType stakeholderType);
    event StakeholderApproved(address indexed stakeholder, address indexed admin);
    event MRVDataSubmitted(uint256 indexed projectId, uint256 indexed dataId, address indexed collector);
    event MRVDataVerified(uint256 indexed dataId, address indexed verifier);
    event ProjectStatusChanged(uint256 indexed projectId, ProjectStatus newStatus);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }
    
    /**
     * @dev Register a new blue carbon project
     */
    function registerProject(
        string memory name,
        string memory location,
        uint256 area,
        EcosystemType ecosystemType,
        string[] memory documentHashes,
        uint256 estimatedCredits
    ) external whenNotPaused {
        require(bytes(name).length > 0, "Project name required");
        require(bytes(location).length > 0, "Project location required");
        require(area > 0, "Project area must be greater than zero");
        require(stakeholders[msg.sender].approved, "Stakeholder not approved");
        
        uint256 projectId = nextProjectId;
        
        projects[projectId] = Project({
            id: projectId,
            name: name,
            location: location,
            area: area,
            ecosystemType: ecosystemType,
            owner: msg.sender,
            status: ProjectStatus.Pending,
            createdAt: block.timestamp,
            verifiedAt: 0,
            documentHashes: documentHashes,
            estimatedCredits: estimatedCredits,
            actualCredits: 0
        });
        
        // Add project to stakeholder's project list
        stakeholders[msg.sender].projectIds.push(projectId);
        
        totalProjects++;
        nextProjectId++;
        
        emit ProjectRegistered(projectId, msg.sender, name);
    }
    
    /**
     * @dev Register a stakeholder
     */
    function registerStakeholder(
        string memory name,
        string memory organization,
        StakeholderType stakeholderType,
        string memory location
    ) external whenNotPaused {
        require(stakeholders[msg.sender].stakeholderAddress == address(0), "Stakeholder already registered");
        require(bytes(name).length > 0, "Name required");
        require(bytes(organization).length > 0, "Organization required");
        
        uint256[] memory emptyProjects;
        
        stakeholders[msg.sender] = Stakeholder({
            stakeholderAddress: msg.sender,
            name: name,
            organization: organization,
            stakeholderType: stakeholderType,
            location: location,
            approved: false, // Requires admin approval
            registeredAt: block.timestamp,
            projectIds: emptyProjects
        });
        
        emit StakeholderRegistered(msg.sender, stakeholderType);
    }
    
    /**
     * @dev Approve a stakeholder (admin only)
     */
    function approveStakeholder(address stakeholder) external onlyRole(ADMIN_ROLE) {
        require(stakeholders[stakeholder].stakeholderAddress != address(0), "Stakeholder not registered");
        require(!stakeholders[stakeholder].approved, "Stakeholder already approved");
        
        stakeholders[stakeholder].approved = true;
        
        // Grant data collector role
        _grantRole(DATA_COLLECTOR_ROLE, stakeholder);
        
        emit StakeholderApproved(stakeholder, msg.sender);
    }
    
    /**
     * @dev Submit MRV data for a project
     */
    function submitMRVData(
        uint256 projectId,
        string memory dataHash,
        string memory coordinates,
        uint256 carbonSequestration
    ) external onlyRole(DATA_COLLECTOR_ROLE) whenNotPaused {
        require(projects[projectId].id != 0, "Project does not exist");
        require(projects[projectId].status == ProjectStatus.Active, "Project not active");
        require(bytes(dataHash).length > 0, "Data hash required");
        require(carbonSequestration > 0, "Carbon sequestration must be greater than zero");
        
        uint256 dataId = nextMRVDataId;
        
        MRVData memory newData = MRVData({
            projectId: projectId,
            collector: msg.sender,
            timestamp: block.timestamp,
            dataHash: dataHash,
            coordinates: coordinates,
            carbonSequestration: carbonSequestration,
            verified: false,
            verifier: address(0),
            verifiedAt: 0
        });
        
        projectMRVData[projectId].push(newData);
        mrvDataById[dataId] = newData;
        
        nextMRVDataId++;
        
        emit MRVDataSubmitted(projectId, dataId, msg.sender);
    }
    
    /**
     * @dev Verify MRV data
     */
    function verifyMRVData(uint256 dataId) external onlyRole(VERIFIER_ROLE) {
        require(mrvDataById[dataId].timestamp != 0, "MRV data does not exist");
        require(!mrvDataById[dataId].verified, "Data already verified");
        
        mrvDataById[dataId].verified = true;
        mrvDataById[dataId].verifier = msg.sender;
        mrvDataById[dataId].verifiedAt = block.timestamp;
        
        // Update project's actual credits
        uint256 projectId = mrvDataById[dataId].projectId;
        projects[projectId].actualCredits += mrvDataById[dataId].carbonSequestration;
        totalCarbonSequestered += mrvDataById[dataId].carbonSequestration;
        
        emit MRVDataVerified(dataId, msg.sender);
    }
    
    /**
     * @dev Verify a project
     */
    function verifyProject(uint256 projectId) external onlyRole(VERIFIER_ROLE) {
        require(projects[projectId].id != 0, "Project does not exist");
        require(projects[projectId].status == ProjectStatus.Pending || projects[projectId].status == ProjectStatus.Active, "Invalid project status");
        
        projects[projectId].status = ProjectStatus.Verified;
        projects[projectId].verifiedAt = block.timestamp;
        
        if (projects[projectId].status != ProjectStatus.Verified) {
            totalVerifiedProjects++;
        }
        
        emit ProjectVerified(projectId, msg.sender);
        emit ProjectStatusChanged(projectId, ProjectStatus.Verified);
    }
    
    /**
     * @dev Change project status (admin only)
     */
    function changeProjectStatus(uint256 projectId, ProjectStatus newStatus) external onlyRole(ADMIN_ROLE) {
        require(projects[projectId].id != 0, "Project does not exist");
        require(projects[projectId].status != newStatus, "Status unchanged");
        
        ProjectStatus oldStatus = projects[projectId].status;
        projects[projectId].status = newStatus;
        
        // Update counters
        if (oldStatus == ProjectStatus.Verified && newStatus != ProjectStatus.Verified) {
            totalVerifiedProjects--;
        } else if (oldStatus != ProjectStatus.Verified && newStatus == ProjectStatus.Verified) {
            totalVerifiedProjects++;
            projects[projectId].verifiedAt = block.timestamp;
        }
        
        emit ProjectStatusChanged(projectId, newStatus);
    }
    
    /**
     * @dev Get project details
     */
    function getProject(uint256 projectId) external view returns (Project memory) {
        require(projects[projectId].id != 0, "Project does not exist");
        return projects[projectId];
    }
    
    /**
     * @dev Get stakeholder details
     */
    function getStakeholder(address stakeholderAddress) external view returns (Stakeholder memory) {
        require(stakeholders[stakeholderAddress].stakeholderAddress != address(0), "Stakeholder not found");
        return stakeholders[stakeholderAddress];
    }
    
    /**
     * @dev Get MRV data for a project
     */
    function getProjectMRVData(uint256 projectId) external view returns (MRVData[] memory) {
        return projectMRVData[projectId];
    }
    
    /**
     * @dev Get projects by stakeholder
     */
    function getStakeholderProjects(address stakeholderAddress) external view returns (uint256[] memory) {
        require(stakeholders[stakeholderAddress].stakeholderAddress != address(0), "Stakeholder not found");
        return stakeholders[stakeholderAddress].projectIds;
    }
    
    /**
     * @dev Get registry statistics
     */
    function getRegistryStatistics() external view returns (
        uint256 _totalProjects,
        uint256 _totalVerifiedProjects,
        uint256 _totalCarbonSequestered,
        uint256 _totalStakeholders
    ) {
        // Count total stakeholders (this is simplified - in production, you'd track this more efficiently)
        uint256 stakeholderCount = 0;
        // This would require additional data structures to track efficiently
        
        return (
            totalProjects,
            totalVerifiedProjects,
            totalCarbonSequestered,
            stakeholderCount
        );
    }
    
    /**
     * @dev Pause contract (emergency use)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Grant verifier role
     */
    function grantVerifierRole(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(VERIFIER_ROLE, account);
    }
    
    /**
     * @dev Revoke verifier role
     */
    function revokeVerifierRole(address account) external onlyRole(ADMIN_ROLE) {
        _revokeRole(VERIFIER_ROLE, account);
    }
}
