// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./core/ProposalManager.sol";
import "./core/VotingManager.sol";
import "./core/ShariaReviewManager.sol";
import "./core/PoolManager.sol";
import "./core/ZakatEscrowManager.sol";
import "../tokens/MockIDRX.sol";
import "../tokens/DonationReceiptNFT.sol";
import "../tokens/VotingToken.sol";

/**
 * @title ZKTCore
 * @notice Orchestrator contract for the modular ZKT DAO system
 * @dev Deploys and coordinates: ProposalManager, VotingManager, ShariaReviewManager, PoolManager, ZakatEscrowManager
 * Uses VotingToken (non-transferable ERC20) for community voting power
 * Routes ZakatCompliant campaigns to ZakatEscrowManager (with 30-day timeout)
 * Routes Normal campaigns to PoolManager (no timeout restrictions)
 */
contract ZKTCore is AccessControl {
    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");
    bytes32 public constant KYC_ORACLE_ROLE = keccak256("KYC_ORACLE_ROLE");
    bytes32 public constant SHARIA_COUNCIL_ROLE = keccak256("SHARIA_COUNCIL_ROLE");

    ProposalManager public proposalManager;
    VotingManager public votingManager;
    ShariaReviewManager public shariaReviewManager;
    PoolManager public poolManager;
    ZakatEscrowManager public zakatEscrowManager;
    
    MockIDRX public idrxToken;
    DonationReceiptNFT public receiptNFT;
    VotingToken public votingToken;
    
    constructor(address _idrxToken, address _receiptNFT, address _votingToken) {
        require(_idrxToken != address(0), "Invalid IDRX token");
        require(_receiptNFT != address(0), "Invalid receipt NFT");
        require(_votingToken != address(0), "Invalid Voting token");
        
        idrxToken = MockIDRX(_idrxToken);
        receiptNFT = DonationReceiptNFT(_receiptNFT);
        votingToken = VotingToken(_votingToken);
        
        // Deploy core modules (they will grant DEFAULT_ADMIN_ROLE to msg.sender, which is this contract)
        proposalManager = new ProposalManager();
        votingManager = new VotingManager(address(proposalManager), _votingToken);
        shariaReviewManager = new ShariaReviewManager(address(proposalManager));
        poolManager = new PoolManager(address(proposalManager), _idrxToken, _receiptNFT);
        zakatEscrowManager = new ZakatEscrowManager(address(proposalManager), _idrxToken, _receiptNFT);

        // Grant CommunityDAO all functional roles so it can delegate calls
        proposalManager.grantRole(proposalManager.ORGANIZER_ROLE(), address(this));
        proposalManager.grantRole(proposalManager.KYC_ORACLE_ROLE(), address(this));
        shariaReviewManager.grantRole(shariaReviewManager.SHARIA_COUNCIL_ROLE(), address(this));
        poolManager.grantRole(poolManager.ADMIN_ROLE(), address(this));
        zakatEscrowManager.grantRole(zakatEscrowManager.ADMIN_ROLE(), address(this));
        zakatEscrowManager.grantRole(zakatEscrowManager.SHARIA_COUNCIL_ROLE(), address(this));
        
        // Grant cross-module permissions
        proposalManager.grantRole(proposalManager.VOTING_MANAGER_ROLE(), address(votingManager));
        proposalManager.grantRole(proposalManager.VOTING_MANAGER_ROLE(), address(shariaReviewManager));
        proposalManager.grantRole(proposalManager.VOTING_MANAGER_ROLE(), address(poolManager));
        proposalManager.grantRole(proposalManager.VOTING_MANAGER_ROLE(), address(zakatEscrowManager));
        
        // Setup deployer as DEFAULT_ADMIN_ROLE to grant initial roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    // ============ Role Management Helpers ============
    
    function grantOrganizerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ORGANIZER_ROLE, account);
    }
    
    function grantVotingPower(address account, uint256 amount) external {
        // Permissionless - anyone can request voting tokens (in production, add faucet-style rate limits)
        votingToken.mint(account, amount, "Voting power granted");
    }
    
    function revokeVotingPower(address account, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        votingToken.burn(account, amount, "Admin revoked voting power");
    }
    
    function grantShariaCouncilRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(SHARIA_COUNCIL_ROLE, account);
    }
    
    function grantKYCOracleRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(KYC_ORACLE_ROLE, account);
    }
    
    // ============ Re-export Core Functions for Ease of Use ============
    
    // Proposal functions
    function createProposal(
        string memory title,
        string memory description,
        uint256 fundingGoal,
        bool isEmergency,
        bytes32 mockZKKYCProof,
        string[] memory zakatChecklistItems,
        string memory metadataURI
    ) external onlyRole(ORGANIZER_ROLE) returns (uint256) {
        return proposalManager.createProposal(
            msg.sender,  // Pass actual caller as organizer
            title,
            description,
            fundingGoal,
            isEmergency,
            mockZKKYCProof,
            zakatChecklistItems,
            metadataURI
        );
    }
    
    function updateKYCStatus(
        uint256 proposalId,
        IProposalManager.KYCStatus newStatus,
        string memory notes
    ) external onlyRole(KYC_ORACLE_ROLE) {
        proposalManager.updateKYCStatus(proposalId, newStatus, notes);
    }
    
    function submitForCommunityVote(uint256 proposalId) external onlyRole(ORGANIZER_ROLE) {
        proposalManager.submitForCommunityVote(proposalId);
    }
    
    function cancelProposal(uint256 proposalId) external onlyRole(ORGANIZER_ROLE) {
        proposalManager.cancelProposal(proposalId);
    }
    
    // Voting functions
    function castVote(uint256 proposalId, uint8 support) external {
        votingManager.castVote(msg.sender, proposalId, support);  // Pass actual voter
    }
    
    function finalizeCommunityVote(uint256 proposalId) external {
        bool passed = votingManager.finalizeCommunityVote(proposalId);
        if (passed) {
            shariaReviewManager.checkAndCreateBundle();
        }
    }
    
    // Sharia review functions
    function checkAndCreateBundle() external {
        shariaReviewManager.checkAndCreateBundle();
    }
    
    function createShariaReviewBundle(uint256[] memory proposalIds) external onlyRole(SHARIA_COUNCIL_ROLE) returns (uint256) {
        return shariaReviewManager.createShariaReviewBundle(proposalIds);
    }
    
    function reviewProposal(
        uint256 bundleId,
        uint256 proposalId,
        bool approved,
        IProposalManager.CampaignType campaignType,
        bytes32 mockZKReviewProof
    ) external onlyRole(SHARIA_COUNCIL_ROLE) {
        shariaReviewManager.reviewProposal(msg.sender, bundleId, proposalId, approved, campaignType, mockZKReviewProof);
    }
    
    function finalizeShariaBundle(uint256 bundleId) external onlyRole(SHARIA_COUNCIL_ROLE) {
        shariaReviewManager.finalizeShariaBundle(bundleId);
    }
    
    // Pool functions

    /**
     * @notice Internal function to create campaign pool with routing
     * @dev Routes to ZakatEscrowManager for Zakat campaigns, PoolManager for Normal campaigns
     */
    function _createCampaignPoolInternal(
        uint256 proposalId,
        address fallbackPool
    ) internal returns (uint256) {
        IProposalManager.Proposal memory proposal = proposalManager.getProposal(proposalId);
        require(msg.sender == proposal.organizer, "Only proposal organizer");
        require(proposal.status == IProposalManager.ProposalStatus.ShariaApproved, "Not Sharia approved");

        // Route based on campaign type
        if (proposal.campaignType == IProposalManager.CampaignType.ZakatCompliant) {
            // Zakat campaigns go to ZakatEscrowManager with timeout enforcement
            return zakatEscrowManager.createZakatPool(proposalId, fallbackPool);
        } else {
            // Normal campaigns go to PoolManager without timeout
            return poolManager.createCampaignPool(proposalId);
        }
    }

    /**
     * @notice Create campaign pool with automatic routing based on campaign type
     * @dev ZakatCompliant campaigns route to ZakatEscrowManager (30-day timeout)
     *      Normal campaigns route to PoolManager (no timeout)
     * @param proposalId Approved proposal ID
     * @param fallbackPool Fallback pool for Zakat redistribution (ignored for Normal campaigns)
     * @return poolId Created pool ID
     */
    function createCampaignPool(uint256 proposalId, address fallbackPool) external returns (uint256) {
        return _createCampaignPoolInternal(proposalId, fallbackPool);
    }

    /**
     * @notice Create campaign pool (legacy compatibility - uses default fallback for Zakat)
     */
    function createCampaignPool(uint256 proposalId) external returns (uint256) {
        return _createCampaignPoolInternal(proposalId, address(0));
    }

    /**
     * @notice Donate to a campaign pool
     */
    function donate(uint256 poolId, uint256 amount, string memory ipfsCID) external {
        // Route to appropriate manager based on pool existence
        // Try ZakatEscrowManager first, then fallback to PoolManager
        try zakatEscrowManager.donate(msg.sender, poolId, amount, ipfsCID) {
            return; // Success - was a Zakat pool
        } catch {
            // Fallback to PoolManager
            poolManager.donate(msg.sender, poolId, amount, ipfsCID);
        }
    }

    /**
     * @notice Make a private donation using Pedersen commitment
     */
    function donatePrivate(uint256 poolId, uint256 amount, bytes32 commitment, string memory ipfsCID) external {
        // Route to appropriate manager based on pool existence
        try zakatEscrowManager.donatePrivate(msg.sender, poolId, amount, commitment, ipfsCID) {
            return; // Success - was a Zakat pool
        } catch {
            // Fallback to PoolManager
            poolManager.donatePrivate(msg.sender, poolId, amount, commitment, ipfsCID);
        }
    }

    /**
     * @notice Withdraw funds from campaign pool
     */
    function withdrawFunds(uint256 poolId) external {
        // Route to appropriate manager based on pool existence
        try zakatEscrowManager.withdrawFunds(msg.sender, poolId) {
            return; // Success - was a Zakat pool
        } catch {
            // Fallback to PoolManager
            poolManager.withdrawFunds(msg.sender, poolId);
        }
    }

    // ============ Zakat-Specific Functions ============

    /**
     * @notice Check timeout status of a Zakat pool
     */
    function checkZakatTimeout(uint256 poolId) external {
        zakatEscrowManager.checkTimeout(poolId);
    }

    /**
     * @notice Sharia council grants extension to Zakat pool deadline
     */
    function councilExtendZakatDeadline(uint256 poolId, string memory reasoning)
        external
        onlyRole(SHARIA_COUNCIL_ROLE)
    {
        zakatEscrowManager.councilExtendDeadline(poolId, reasoning);
    }

    /**
     * @notice Execute redistribution to fallback pool
     */
    function executeZakatRedistribution(uint256 poolId) external {
        zakatEscrowManager.executeRedistribution(poolId);
    }

    /**
     * @notice Propose a fallback pool for Zakat redistribution
     */
    function proposeFallbackPool(address pool, string memory reasoning) external {
        zakatEscrowManager.proposeFallbackPool(pool, reasoning);
    }

    /**
     * @notice Sharia council approves a proposed fallback pool
     */
    function vetFallbackPool(address pool) external onlyRole(SHARIA_COUNCIL_ROLE) {
        zakatEscrowManager.vetFallbackPool(pool);
    }

    /**
     * @notice Set default fallback pool for Zakat redistribution
     */
    function setDefaultFallbackPool(address pool) external {
        zakatEscrowManager.setDefaultFallbackPool(pool);
    }

    // ============ View Functions ============

    function proposalCount() external view returns (uint256) {
        return proposalManager.proposalCount();
    }

    function poolCount() external view returns (uint256) {
        return poolManager.poolCount();
    }

    function bundleCount() external view returns (uint256) {
        return shariaReviewManager.bundleCount();
    }
    
    function getProposal(uint256 proposalId) external view returns (IProposalManager.Proposal memory) {
        return proposalManager.getProposal(proposalId);
    }
    
    function getProposalChecklistItems(uint256 proposalId) external view returns (string[] memory) {
        return proposalManager.getProposalChecklistItems(proposalId);
    }
    
    function getBundle(uint256 bundleId) external view returns (ShariaReviewManager.ShariaReviewBundle memory) {
        return shariaReviewManager.getBundle(bundleId);
    }
    
    function getPool(uint256 poolId) external view returns (PoolManager.CampaignPool memory) {
        return poolManager.getPool(poolId);
    }
    
    function getPoolDonors(uint256 poolId) external view returns (address[] memory) {
        return poolManager.getPoolDonors(poolId);
    }
    
    function getDonorContribution(uint256 poolId, address donor) external view returns (uint256) {
        return poolManager.getDonorContribution(poolId, donor);
    }
    
    // ============ Configuration Functions (DEFAULT_ADMIN_ROLE for initial setup) ============
    
    function setVotingPeriod(uint256 _votingPeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
        proposalManager.setVotingPeriod(_votingPeriod);
    }
    
    function setQuorumPercentage(uint256 _quorumPercentage) external onlyRole(DEFAULT_ADMIN_ROLE) {
        votingManager.setQuorumPercentage(_quorumPercentage);
    }
    
    function setPassThreshold(uint256 _passThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        votingManager.setPassThreshold(_passThreshold);
    }
    
    function setShariaQuorum(uint256 _quorum) external onlyRole(DEFAULT_ADMIN_ROLE) {
        shariaReviewManager.setShariaQuorum(_quorum);
    }
    
    // ============ Module Access (for advanced users) ============
    
    function getProposalManagerAddress() external view returns (address) {
        return address(proposalManager);
    }
    
    function getVotingManagerAddress() external view returns (address) {
        return address(votingManager);
    }
    
    function getShariaReviewManagerAddress() external view returns (address) {
        return address(shariaReviewManager);
    }
    
    function getPoolManagerAddress() external view returns (address) {
        return address(poolManager);
    }

    function getZakatEscrowManagerAddress() external view returns (address) {
        return address(zakatEscrowManager);
    }

    // ============ Zakat Pool View Functions ============

    /**
     * @notice Get Zakat pool details
     */
    function getZakatPool(uint256 poolId) external view returns (ZakatEscrowManager.ZakatPool memory) {
        return zakatEscrowManager.getPool(poolId);
    }

    /**
     * @notice Get time remaining for Zakat pool withdrawal
     */
    function getZakatTimeRemaining(uint256 poolId)
        external
        view
        returns (
            uint256 remaining,
            bool inGracePeriod,
            bool canRedistribute
        )
    {
        return zakatEscrowManager.getTimeRemaining(poolId);
    }

    /**
     * @notice Check if Zakat pool is ready for redistribution
     */
    function isZakatReadyForRedistribution(uint256 poolId) external view returns (bool) {
        return zakatEscrowManager.isReadyForRedistribution(poolId);
    }

    /**
     * @notice Get Zakat pool status as string
     */
    function getZakatPoolStatusString(uint256 poolId) external view returns (string memory) {
        return zakatEscrowManager.getPoolStatusString(poolId);
    }

    /**
     * @notice Get fallback pool details
     */
    function getFallbackPool(address pool) external view returns (ZakatEscrowManager.FallbackPoolData memory) {
        return zakatEscrowManager.getFallbackPool(pool);
    }

    /**
     * @notice Get all fallback pools
     */
    function getAllFallbackPools() external view returns (address[] memory) {
        return zakatEscrowManager.getAllFallbackPools();
    }
}
