// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title BlueCarbon Registry
 * @dev Comprehensive registry for blue carbon ecosystem restoration projects
 * @dev Includes MRV (Monitoring, Reporting, Verification) capabilities
 * @dev Supports multiple stakeholder types and project verification workflows
 */
contract BlueCarbonRegistry is AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant DATA_COLLECTOR_ROLE = keccak256("DATA_COLLECTOR_ROLE");
    bytes32 public constant STAKEHOLDER_ROLE = keccak256("STAKEHOLDER_ROLE");
    
    // Counters for IDs
    Counters.Counter private _projectIdCounter;
    Counters.Counter private _mrvDataIdCounter;
    Counters.Counter private _stakeholderIdCounter;
    
    // Enums
    enum ProjectStatus { 
        Pending,        // Newly created, awaiting review
        Active,         // Approved and operational
        Verified,       // Fully verified and eligible for credits
        Suspended,      // Temporarily suspended
        Completed,      // Project completed successfully
        Rejected        // Project rejected
    }
    
    enum EcosystemType { 
        Mangrove,       // Mangrove forests
        Seagrass,       // Seagrass beds
        SaltMarsh,      // Salt marshes
        TidalMarsh,     // Tidal marshes
        CoastalWetland  // Other coastal wetlands
    }
    
    enum StakeholderType { 
        NGO,            // Non-governmental organization
        Community,      // Local community group
        Panchayat,      // Local government body
        Researcher,     // Academic/research institution
        Government,     // Government agency
        Private         // Private organization
    }
    
    enum MRVStatus {
        Submitted,      // Data submitted by collector
        UnderReview,    // Being reviewed by verifier
        Verified,       // Verified and accepted
        Rejected,       // Rejected due to issues
        RequiresUpdate  // Needs additional information
    }
    
    // Data structures
    struct Project {
        uint256 id;
        string name;
        string description;
        string location;
        string coordinates; // GPS coordinates as string
        uint256 area; // in hectares (multiplied by 100 for precision)
        EcosystemType ecosystemType;
        address owner;
        ProjectStatus status;
        uint256 createdAt;
        uint256 lastUpdated;
        uint256 verifiedAt;
        address verifiedBy;
        string[] documentHashes; // IPFS hashes of project documents
        uint256 estimatedCarbonCredits; // Estimated credits in tons CO2e
        uint256 actualCarbonCredits; // Actual verified credits
        uint256 totalAreaRestored; // Total area successfully restored
        bool isActive;
    }
    
    struct Stakeholder {
        uint256 id;
        address stakeholderAddress;
        string name;
        string organization;
        StakeholderType stakeholderType;
        string location;
        string contactInfo; // Email or other contact
        bool isApproved;
        bool isActive;
        uint256 registeredAt;
        uint256 approvedAt;
        address approvedBy;
        uint256[] ownedProjects;
        uint256 reputationScore; // 0-1000 reputation score
        string profileHash; // IPFS hash of detailed profile
    }
    
    struct MRVData {
        uint256 id;
        uint256 projectId;
        address collector;
        uint256 timestamp;
        string dataHash; // IPFS hash of measurement data
        string coordinates; // GPS coordinates
        string methodologyUsed;
        uint256 carbonSequestration; // tons CO2 equivalent (multiplied by 100)
        uint256 biomassGrowth; // biomass growth data
        uint256 areaMonitored; // area covered in this measurement
        MRVStatus status;
        address verifier;
        uint256 verifiedAt;
        string verificationNotes;
        string[] attachmentHashes; // IPFS hashes of photos/documents
        bool isValid;
    }
    
    struct VerificationCriteria {
        uint256 minDataPoints;
        uint256 maxAgeInDays;
        uint256 minAreaCoverage;
        bool requiresPhysicalVerification;
        bool requiresThirdPartyAudit;
    }
    
    struct ProjectStatistics {
        uint256 totalMRVSubmissions;
        uint256 verifiedMRVSubmissions;
        uint256 lastMRVSubmission;
        uint256 averageCarbonSequestration;
        uint256 totalBiomassGrowth;
        uint256 complianceScore; // 0-100 compliance score
    }
    
    // Storage mappings
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Stakeholder) public stakeholders;
    mapping(address => uint256) public stakeholderByAddress;
    mapping(uint256 => MRVData) public mrvData;
    mapping(uint256 => uint256[]) public projectMRVData; // projectId => mrvDataIds[]
    mapping(uint256 => ProjectStatistics) public projectStats;
    mapping(address => uint256[]) public stakeholderProjects;
    mapping(EcosystemType => VerificationCriteria) public verificationCriteria;
    
    // Global statistics
    uint256 public totalProjects;
    uint256 public totalVerifiedProjects;
    uint256 public totalStakeholders;
    uint256 public totalApprovedStakeholders;
    uint256 public totalCarbonSequestered;
    uint256 public totalAreaUnderRestoration;
    
    // Events
    event ProjectRegistered(
        uint256 indexed projectId,
        address indexed owner,
        string name,
        EcosystemType ecosystemType
    );
    
    event ProjectStatusChanged(
        uint256 indexed projectId,
        ProjectStatus oldStatus,
        ProjectStatus newStatus,
        address changedBy
    );
    
    event ProjectVerified(
        uint256 indexed projectId,
        address indexed verifier,
        uint256 carbonCredits
    );
    
    event StakeholderRegistered(
        uint256 indexed stakeholderId,
        address indexed stakeholderAddress,
        StakeholderType stakeholderType
    );
    
    event StakeholderApproved(
        uint256 indexed stakeholderId,
        address indexed stakeholder,
        address indexed approvedBy
    );
    
    event MRVDataSubmitted(
        uint256 indexed dataId,
        uint256 indexed projectId,
        address indexed collector,
        uint256 carbonSequestration
    );
    
    event MRVDataVerified(
        uint256 indexed dataId,
        uint256 indexed projectId,
        address indexed verifier,
        MRVStatus status
    );
    
    event CarbonCreditsUpdated(
        uint256 indexed projectId,
        uint256 oldCredits,
        uint256 newCredits
    );
    
    event ReputationScoreUpdated(
        uint256 indexed stakeholderId,
        uint256 oldScore,
        uint256 newScore
    );
    
    // Constructor
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        
        // Initialize verification criteria for different ecosystem types
        _initializeVerificationCriteria();
    }
    
    // Initialize default verification criteria
    function _initializeVerificationCriteria() private {
        verificationCriteria[EcosystemType.Mangrove] = VerificationCriteria({
            minDataPoints: 5,
            maxAgeInDays: 90,
            minAreaCoverage: 80, // 80% of project area
            requiresPhysicalVerification: true,
            requiresThirdPartyAudit: true
        });
        
        verificationCriteria[EcosystemType.Seagrass] = VerificationCriteria({
            minDataPoints: 8,
            maxAgeInDays: 60,
            minAreaCoverage: 70,
            requiresPhysicalVerification: true,
            requiresThirdPartyAudit: true
        });
        
        verificationCriteria[EcosystemType.SaltMarsh] = VerificationCriteria({
            minDataPoints: 6,
            maxAgeInDays: 75,
            minAreaCoverage: 75,
            requiresPhysicalVerification: true,
            requiresThirdPartyAudit: false
        });
        
        verificationCriteria[EcosystemType.TidalMarsh] = VerificationCriteria({
            minDataPoints: 6,
            maxAgeInDays: 75,
            minAreaCoverage: 75,
            requiresPhysicalVerification: true,
            requiresThirdPartyAudit: false
        });
        
        verificationCriteria[EcosystemType.CoastalWetland] = VerificationCriteria({
            minDataPoints: 4,
            maxAgeInDays: 120,
            minAreaCoverage: 60,
            requiresPhysicalVerification: false,
            requiresThirdPartyAudit: false
        });
    }
    
    // Stakeholder Management
    function registerStakeholder(
        string memory name,
        string memory organization,
        StakeholderType stakeholderType,
        string memory location,
        string memory contactInfo,
        string memory profileHash
    ) external whenNotPaused returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(organization).length > 0, "Organization cannot be empty");
        require(stakeholderByAddress[msg.sender] == 0, "Stakeholder already registered");
        
        _stakeholderIdCounter.increment();
        uint256 stakeholderId = _stakeholderIdCounter.current();
        
        uint256[] memory emptyProjects;
        
        stakeholders[stakeholderId] = Stakeholder({
            id: stakeholderId,
            stakeholderAddress: msg.sender,
            name: name,
            organization: organization,
            stakeholderType: stakeholderType,
            location: location,
            contactInfo: contactInfo,
            isApproved: false,
            isActive: true,
            registeredAt: block.timestamp,
            approvedAt: 0,
            approvedBy: address(0),
            ownedProjects: emptyProjects,
            reputationScore: 500, // Start with neutral score
            profileHash: profileHash
        });
        
        stakeholderByAddress[msg.sender] = stakeholderId;
        totalStakeholders++;
        
        emit StakeholderRegistered(stakeholderId, msg.sender, stakeholderType);
        return stakeholderId;
    }
    
    function approveStakeholder(uint256 stakeholderId) 
        external 
        onlyRole(ADMIN_ROLE) 
        whenNotPaused 
    {
        require(stakeholders[stakeholderId].id != 0, "Stakeholder does not exist");
        require(!stakeholders[stakeholderId].isApproved, "Stakeholder already approved");
        
        stakeholders[stakeholderId].isApproved = true;
        stakeholders[stakeholderId].approvedAt = block.timestamp;
        stakeholders[stakeholderId].approvedBy = msg.sender;
        
        // Grant stakeholder role
        _grantRole(STAKEHOLDER_ROLE, stakeholders[stakeholderId].stakeholderAddress);
        
        // Also grant data collector role
        _grantRole(DATA_COLLECTOR_ROLE, stakeholders[stakeholderId].stakeholderAddress);
        
        totalApprovedStakeholders++;
        
        emit StakeholderApproved(
            stakeholderId,
            stakeholders[stakeholderId].stakeholderAddress,
            msg.sender
        );
    }
    
    // Project Management
    function registerProject(
        string memory name,
        string memory description,
        string memory location,
        string memory coordinates,
        uint256 area,
        EcosystemType ecosystemType,
        string[] memory documentHashes,
        uint256 estimatedCarbonCredits
    ) external onlyRole(STAKEHOLDER_ROLE) whenNotPaused returns (uint256) {
        require(bytes(name).length > 0, "Project name cannot be empty");
        require(bytes(location).length > 0, "Project location cannot be empty");
        require(area > 0, "Project area must be greater than zero");
        
        uint256 stakeholderId = stakeholderByAddress[msg.sender];
        require(stakeholderId != 0, "Stakeholder not registered");
        require(stakeholders[stakeholderId].isApproved, "Stakeholder not approved");
        
        _projectIdCounter.increment();
        uint256 projectId = _projectIdCounter.current();
        
        projects[projectId] = Project({
            id: projectId,
            name: name,
            description: description,
            location: location,
            coordinates: coordinates,
            area: area,
            ecosystemType: ecosystemType,
            owner: msg.sender,
            status: ProjectStatus.Pending,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp,
            verifiedAt: 0,
            verifiedBy: address(0),
            documentHashes: documentHashes,
            estimatedCarbonCredits: estimatedCarbonCredits,
            actualCarbonCredits: 0,
            totalAreaRestored: 0,
            isActive: true
        });
        
        // Update stakeholder's project list
        stakeholders[stakeholderId].ownedProjects.push(projectId);
        stakeholderProjects[msg.sender].push(projectId);
        
        // Initialize project statistics
        projectStats[projectId] = ProjectStatistics({
            totalMRVSubmissions: 0,
            verifiedMRVSubmissions: 0,
            lastMRVSubmission: 0,
            averageCarbonSequestration: 0,
            totalBiomassGrowth: 0,
            complianceScore: 100
        });
        
        totalProjects++;
        totalAreaUnderRestoration += area;
        
        emit ProjectRegistered(projectId, msg.sender, name, ecosystemType);
        return projectId;
    }
    
    function updateProjectStatus(
        uint256 projectId,
        ProjectStatus newStatus,
        string memory reason
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        require(projects[projectId].id != 0, "Project does not exist");
        require(projects[projectId].isActive, "Project is not active");
        
        ProjectStatus oldStatus = projects[projectId].status;
        require(oldStatus != newStatus, "Status is already set to this value");
        
        projects[projectId].status = newStatus;
        projects[projectId].lastUpdated = block.timestamp;
        
        // Update counters based on status change
        if (oldStatus != ProjectStatus.Verified && newStatus == ProjectStatus.Verified) {
            totalVerifiedProjects++;
            projects[projectId].verifiedAt = block.timestamp;
            projects[projectId].verifiedBy = msg.sender;
        } else if (oldStatus == ProjectStatus.Verified && newStatus != ProjectStatus.Verified) {
            totalVerifiedProjects--;
        }
        
        emit ProjectStatusChanged(projectId, oldStatus, newStatus, msg.sender);
        
        if (newStatus == ProjectStatus.Verified) {
            emit ProjectVerified(projectId, msg.sender, projects[projectId].actualCarbonCredits);
        }
    }
    
    // MRV Data Management
    function submitMRVData(
        uint256 projectId,
        string memory dataHash,
        string memory coordinates,
        string memory methodologyUsed,
        uint256 carbonSequestration,
        uint256 biomassGrowth,
        uint256 areaMonitored,
        string[] memory attachmentHashes
    ) external onlyRole(DATA_COLLECTOR_ROLE) whenNotPaused returns (uint256) {
        require(projects[projectId].id != 0, "Project does not exist");
        require(projects[projectId].isActive, "Project is not active");
        require(projects[projectId].status == ProjectStatus.Active || 
                projects[projectId].status == ProjectStatus.Verified, 
                "Project must be active or verified");
        require(bytes(dataHash).length > 0, "Data hash cannot be empty");
        require(carbonSequestration > 0, "Carbon sequestration must be greater than zero");
        
        _mrvDataIdCounter.increment();
        uint256 dataId = _mrvDataIdCounter.current();
        
        mrvData[dataId] = MRVData({
            id: dataId,
            projectId: projectId,
            collector: msg.sender,
            timestamp: block.timestamp,
            dataHash: dataHash,
            coordinates: coordinates,
            methodologyUsed: methodologyUsed,
            carbonSequestration: carbonSequestration,
            biomassGrowth: biomassGrowth,
            areaMonitored: areaMonitored,
            status: MRVStatus.Submitted,
            verifier: address(0),
            verifiedAt: 0,
            verificationNotes: "",
            attachmentHashes: attachmentHashes,
            isValid: false
        });
        
        // Add to project's MRV data list
        projectMRVData[projectId].push(dataId);
        
        // Update project statistics
        ProjectStatistics storage stats = projectStats[projectId];
        stats.totalMRVSubmissions++;
        stats.lastMRVSubmission = block.timestamp;
        
        // Update project last updated timestamp
        projects[projectId].lastUpdated = block.timestamp;
        
        emit MRVDataSubmitted(dataId, projectId, msg.sender, carbonSequestration);
        return dataId;
    }
    
    function verifyMRVData(
        uint256 dataId,
        MRVStatus verificationStatus,
        string memory verificationNotes
    ) external onlyRole(VERIFIER_ROLE) whenNotPaused {
        require(mrvData[dataId].id != 0, "MRV data does not exist");
        require(mrvData[dataId].status == MRVStatus.Submitted || 
                mrvData[dataId].status == MRVStatus.UnderReview, 
                "Data not in verifiable status");
        require(verificationStatus != MRVStatus.Submitted, "Cannot set status back to submitted");
        
        MRVData storage data = mrvData[dataId];
        data.status = verificationStatus;
        data.verifier = msg.sender;
        data.verifiedAt = block.timestamp;
        data.verificationNotes = verificationNotes;
        data.isValid = (verificationStatus == MRVStatus.Verified);
        
        uint256 projectId = data.projectId;
        ProjectStatistics storage stats = projectStats[projectId];
        
        if (verificationStatus == MRVStatus.Verified) {
            stats.verifiedMRVSubmissions++;
            
            // Update project's actual carbon credits
            projects[projectId].actualCarbonCredits += data.carbonSequestration;
            totalCarbonSequestered += data.carbonSequestration;
            
            // Update project's restored area
            projects[projectId].totalAreaRestored += data.areaMonitored;
            
            // Update average carbon sequestration
            if (stats.verifiedMRVSubmissions > 0) {
                uint256 totalSequestration = 0;
                uint256[] memory dataIds = projectMRVData[projectId];
                uint256 verifiedCount = 0;
                
                for (uint256 i = 0; i < dataIds.length; i++) {
                    if (mrvData[dataIds[i]].isValid) {
                        totalSequestration += mrvData[dataIds[i]].carbonSequestration;
                        verifiedCount++;
                    }
                }
                
                if (verifiedCount > 0) {
                    stats.averageCarbonSequestration = totalSequestration / verifiedCount;
                }
            }
            
            // Update compliance score based on verification rate
            if (stats.totalMRVSubmissions > 0) {
                stats.complianceScore = (stats.verifiedMRVSubmissions * 100) / stats.totalMRVSubmissions;
            }
            
            // Update stakeholder reputation
            _updateStakeholderReputation(projects[projectId].owner, true);
            
            emit CarbonCreditsUpdated(
                projectId, 
                projects[projectId].actualCarbonCredits - data.carbonSequestration,
                projects[projectId].actualCarbonCredits
            );
        } else if (verificationStatus == MRVStatus.Rejected) {
            // Decrease stakeholder reputation for rejected data
            _updateStakeholderReputation(projects[projectId].owner, false);
        }
        
        emit MRVDataVerified(dataId, projectId, msg.sender, verificationStatus);
    }
    
    // Internal function to update stakeholder reputation
    function _updateStakeholderReputation(address stakeholderAddress, bool positive) private {
        uint256 stakeholderId = stakeholderByAddress[stakeholderAddress];
        if (stakeholderId == 0) return;
        
        Stakeholder storage stakeholder = stakeholders[stakeholderId];
        uint256 oldScore = stakeholder.reputationScore;
        
        if (positive) {
            // Increase reputation (max 1000)
            stakeholder.reputationScore = stakeholder.reputationScore + 10 > 1000 ? 
                1000 : stakeholder.reputationScore + 10;
        } else {
            // Decrease reputation (min 0)
            stakeholder.reputationScore = stakeholder.reputationScore < 20 ? 
                0 : stakeholder.reputationScore - 20;
        }
        
        if (oldScore != stakeholder.reputationScore) {
            emit ReputationScoreUpdated(stakeholderId, oldScore, stakeholder.reputationScore);
        }
    }
    
    // View Functions
    function getProject(uint256 projectId) external view returns (Project memory) {
        require(projects[projectId].id != 0, "Project does not exist");
        return projects[projectId];
    }
    
    function getStakeholder(address stakeholderAddress) external view returns (Stakeholder memory) {
        uint256 stakeholderId = stakeholderByAddress[stakeholderAddress];
        require(stakeholderId != 0, "Stakeholder not found");
        return stakeholders[stakeholderId];
    }
    
    function getStakeholderById(uint256 stakeholderId) external view returns (Stakeholder memory) {
        require(stakeholders[stakeholderId].id != 0, "Stakeholder does not exist");
        return stakeholders[stakeholderId];
    }
    
    function getMRVData(uint256 dataId) external view returns (MRVData memory) {
        require(mrvData[dataId].id != 0, "MRV data does not exist");
        return mrvData[dataId];
    }
    
    function getProjectMRVData(uint256 projectId) external view returns (uint256[] memory) {
        require(projects[projectId].id != 0, "Project does not exist");
        return projectMRVData[projectId];
    }
    
    function getProjectStatistics(uint256 projectId) external view returns (ProjectStatistics memory) {
        require(projects[projectId].id != 0, "Project does not exist");
        return projectStats[projectId];
    }
    
    function getStakeholderProjects(address stakeholderAddress) external view returns (uint256[] memory) {
        return stakeholderProjects[stakeholderAddress];
    }
    
    function getRegistryStatistics() external view returns (
        uint256 _totalProjects,
        uint256 _totalVerifiedProjects,
        uint256 _totalStakeholders,
        uint256 _totalApprovedStakeholders,
        uint256 _totalCarbonSequestered,
        uint256 _totalAreaUnderRestoration
    ) {
        return (
            totalProjects,
            totalVerifiedProjects,
            totalStakeholders,
            totalApprovedStakeholders,
            totalCarbonSequestered,
            totalAreaUnderRestoration
        );
    }
    
    function getVerificationCriteria(EcosystemType ecosystemType) 
        external 
        view 
        returns (VerificationCriteria memory) 
    {
        return verificationCriteria[ecosystemType];
    }
    
    function isProjectEligibleForVerification(uint256 projectId) external view returns (bool) {
        require(projects[projectId].id != 0, "Project does not exist");
        
        Project memory project = projects[projectId];
        VerificationCriteria memory criteria = verificationCriteria[project.ecosystemType];
        ProjectStatistics memory stats = projectStats[projectId];
        
        // Check minimum data points
        if (stats.verifiedMRVSubmissions < criteria.minDataPoints) {
            return false;
        }
        
        // Check data freshness
        if (block.timestamp - stats.lastMRVSubmission > criteria.maxAgeInDays * 1 days) {
            return false;
        }
        
        // Check area coverage
        uint256 coveragePercentage = (project.totalAreaRestored * 100) / project.area;
        if (coveragePercentage < criteria.minAreaCoverage) {
            return false;
        }
        
        // Check compliance score
        if (stats.complianceScore < 80) {
            return false;
        }
        
        return true;
    }
    
    // Admin Functions
    function updateVerificationCriteria(
        EcosystemType ecosystemType,
        uint256 minDataPoints,
        uint256 maxAgeInDays,
        uint256 minAreaCoverage,
        bool requiresPhysicalVerification,
        bool requiresThirdPartyAudit
    ) external onlyRole(ADMIN_ROLE) {
        verificationCriteria[ecosystemType] = VerificationCriteria({
            minDataPoints: minDataPoints,
            maxAgeInDays: maxAgeInDays,
            minAreaCoverage: minAreaCoverage,
            requiresPhysicalVerification: requiresPhysicalVerification,
            requiresThirdPartyAudit: requiresThirdPartyAudit
        });
    }
    
    function grantVerifierRole(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(VERIFIER_ROLE, account);
    }
    
    function revokeVerifierRole(address account) external onlyRole(ADMIN_ROLE) {
        _revokeRole(VERIFIER_ROLE, account);
    }
    
    function grantDataCollectorRole(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(DATA_COLLECTOR_ROLE, account);
    }
    
    function revokeDataCollectorRole(address account) external onlyRole(ADMIN_ROLE) {
        _revokeRole(DATA_COLLECTOR_ROLE, account);
    }
    
    function pauseContract() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpauseContract() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    function deactivateProject(uint256 projectId) external onlyRole(ADMIN_ROLE) {
        require(projects[projectId].id != 0, "Project does not exist");
        projects[projectId].isActive = false;
        projects[projectId].lastUpdated = block.timestamp;
    }
    
    function deactivateStakeholder(uint256 stakeholderId) external onlyRole(ADMIN_ROLE) {
        require(stakeholders[stakeholderId].id != 0, "Stakeholder does not exist");
        stakeholders[stakeholderId].isActive = false;
        
        // Revoke roles
        address stakeholderAddress = stakeholders[stakeholderId].stakeholderAddress;
        _revokeRole(STAKEHOLDER_ROLE, stakeholderAddress);
        _revokeRole(DATA_COLLECTOR_ROLE, stakeholderAddress);
    }
    
    // Emergency Functions
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }
    
    // Utility Functions
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    // Receive function to accept ETH
    receive() external payable {
        // Contract can receive ETH for gas fees or other purposes
    }
    
    // Fallback function
    fallback() external payable {
        revert("Function not found");
    }
}
