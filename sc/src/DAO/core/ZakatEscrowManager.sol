// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../tokens/DonationReceiptNFT.sol";
import "../interfaces/IProposalManager.sol";
import "./ProposalManager.sol";

/**
 * @title ZakatEscrowManager
 * @notice Manages Zakat-compliant campaign pools with Shafi'i madhhab compliant timeout rules
 * @dev Implements 30-day hard limit with 7-day grace period and one-time 14-day council extension
 * @custom:security Only ZakatCompliant campaigns use this contract; Normal campaigns use PoolManager
 */
contract ZakatEscrowManager is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SHARIA_COUNCIL_ROLE = keccak256("SHARIA_COUNCIL_ROLE");

    // ============ Time Period Constants ============

    /// @notice Hard deadline for Zakat distribution (Shafi'i ruling: must distribute without delay)
    uint256 public constant ZAKAT_PERIOD = 30 days;

    /// @notice Grace period for Sharia council to grant extension or intervene
    uint256 public constant GRACE_PERIOD = 7 days;

    /// @notice One-time extension duration granted by Sharia council
    uint256 public constant EXTENSION_DURATION = 14 days;

    // ============ Enums ============

    /// @notice Pool status following Shafi'i compliance requirements
    enum PoolStatus {
        Active,           // Organizer can withdraw (0-30 days, or 0-44 days with extension)
        GracePeriod,      // Past deadline, 7-day council override window
        Redistributed,    // Funds moved to fallback pool
        Completed         // Organizer successfully distributed funds
    }

    /// @notice Fallback pool approval states (simplified: propose -> council approves)
    enum FallbackStatus {
        None,             // Not proposed
        Proposed,         // Community proposed
        Approved          // Sharia council approved (final)
    }

    // ============ Structs ============

    /**
     * @notice Zakat pool with timeout enforcement
     * @dev Only for ZakatCompliant campaigns per Shafi'i requirements
     */
    struct ZakatPool {
        uint256 poolId;
        uint256 proposalId;
        address organizer;
        uint256 fundingGoal;
        uint256 raisedAmount;
        string campaignTitle;
        uint256 createdAt;         // Pool creation timestamp
        uint256 deadline;          // Hard deadline (createdAt + ZAKAT_PERIOD, + EXTENSION if granted)
        uint256 gracePeriodEnd;    // End of grace period (deadline + GRACE_PERIOD)
        address fallbackPool;      // Approved fallback Zakat distributor
        FallbackStatus fallbackStatus;
        PoolStatus status;
        bool redistributed;        // Whether auto-redistribution occurred
        bool extensionUsed;        // One-time council extension used
        bool extensionGranted;     // Council has granted extension
        uint256 extensionGrantedAt;// When extension was granted
        address[] donors;
        bool fundsWithdrawn;
    }

    /**
     * @notice Fallback pool data for receiving redistributed Zakat funds
     */
    struct FallbackPoolData {
        address pool;
        FallbackStatus status;
        uint256 proposedAt;
        address proposer;
        string reasoning;  // IPFS CID for proposal documentation
    }

    // ============ State Variables ============

    ProposalManager public proposalManager;
    IERC20 public idrxToken;
    DonationReceiptNFT public receiptNFT;

    uint256 public poolCount;
    mapping(uint256 => ZakatPool) public zakatPools;
    mapping(uint256 => mapping(address => uint256)) public poolDonations;
    mapping(uint256 => uint256) public proposalToPool;

    // Fallback pool management
    mapping(address => FallbackPoolData) public fallbackPools;
    address[] public fallbackPoolList;

    // Default fallback pool if none specified
    address public defaultFallbackPool;

    // Private donation support (reuse from PoolManager)
    mapping(bytes32 => bool) public usedCommitments;

    // ============ Events ============

    event ZakatPoolCreated(
        uint256 indexed poolId,
        uint256 indexed proposalId,
        address organizer,
        uint256 deadline,
        address fallbackPool
    );

    event DonationReceived(
        uint256 indexed poolId,
        address indexed donor,
        uint256 amount,
        uint256 receiptTokenId
    );

    event PrivateDonationReceived(
        uint256 indexed poolId,
        bytes32 indexed commitment,
        uint256 amount,
        uint256 receiptTokenId
    );

    event FundsWithdrawn(
        uint256 indexed poolId,
        address indexed organizer,
        uint256 amount
    );

    event PoolEnteredGracePeriod(
        uint256 indexed poolId,
        uint256 gracePeriodEnd
    );

    event DeadlineExtended(
        uint256 indexed poolId,
        uint256 newDeadline,
        string reasoning  // IPFS CID
    );

    event FundsRedistributed(
        uint256 indexed poolId,
        address indexed fallbackPool,
        uint256 amount
    );

    event FallbackPoolProposed(
        address indexed pool,
        address indexed proposer,
        string reasoning
    );

    event FallbackPoolVetted(
        address indexed pool,
        address indexed councilMember
    );

    event FallbackPoolApproved(
        address indexed pool
    );

    event FallbackPoolRevoked(
        address indexed pool
    );

    event DefaultFallbackPoolSet(
        address indexed pool
    );

    // ============ Errors ============

    error PoolNotFound();
    error PoolNotActive();
    error NotOrganizer();
    error NoFundsToWithdraw();
    error FundsAlreadyWithdrawn();
    error WithdrawalPeriodExpired();
    error StillInWithdrawalPeriod();
    error NotInGracePeriod();
    error ExtensionAlreadyUsed();
    error ExtensionAlreadyGranted();
    error NotShariaCouncil();
    error InvalidFallbackPool();
    error FallbackPoolNotApproved();
    error PoolNotRedistributable();
    error AlreadyRedistributed();
    error InvalidCommitment();

    // ============ Constructor ============

    constructor(
        address _proposalManager,
        address _idrxToken,
        address _receiptNFT
    ) {
        require(_proposalManager != address(0), "Invalid proposal manager");
        require(_idrxToken != address(0), "Invalid IDRX token");
        require(_receiptNFT != address(0), "Invalid receipt NFT");

        proposalManager = ProposalManager(_proposalManager);
        idrxToken = IERC20(_idrxToken);
        receiptNFT = DonationReceiptNFT(_receiptNFT);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(SHARIA_COUNCIL_ROLE, msg.sender);
    }

    // ============ Pool Creation ============

    /**
     * @notice Create a Zakat pool with timeout enforcement
     * @dev Only for ZakatCompliant campaigns
     * @param proposalId Approved proposal ID
     * @param fallbackPool Approved fallback distributor (use defaultFallbackPool if zero)
     * @return poolId Newly created pool ID
     */
    function createZakatPool(
        uint256 proposalId,
        address fallbackPool
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        IProposalManager.Proposal memory proposal = proposalManager.getProposal(proposalId);

        require(proposal.status == IProposalManager.ProposalStatus.ShariaApproved, "Not approved");
        require(proposal.campaignType == IProposalManager.CampaignType.ZakatCompliant, "Not Zakat compliant");
        require(proposalToPool[proposalId] == 0, "Pool already created");

        poolCount++;
        uint256 poolId = poolCount;

        uint256 createdAt = block.timestamp;
        uint256 deadline = createdAt + ZAKAT_PERIOD;
        uint256 gracePeriodEnd = deadline + GRACE_PERIOD;

        // Use default fallback if none specified
        if (fallbackPool == address(0)) {
            fallbackPool = defaultFallbackPool;
            require(fallbackPool != address(0), "No default fallback pool set");
        }

        // Verify fallback pool is approved
        require(
            fallbackPools[fallbackPool].status == FallbackStatus.Approved,
            "Fallback pool not approved"
        );

        ZakatPool storage pool = zakatPools[poolId];
        pool.poolId = poolId;
        pool.proposalId = proposalId;
        pool.organizer = proposal.organizer;
        pool.fundingGoal = proposal.fundingGoal;
        pool.campaignTitle = proposal.title;
        pool.createdAt = createdAt;
        pool.deadline = deadline;
        pool.gracePeriodEnd = gracePeriodEnd;
        pool.fallbackPool = fallbackPool;
        pool.fallbackStatus = fallbackPools[fallbackPool].status;
        pool.status = PoolStatus.Active;
        pool.redistributed = false;
        pool.extensionUsed = false;
        pool.extensionGranted = false;

        proposalToPool[proposalId] = poolId;
        proposalManager.updateProposalPoolId(proposalId, poolId);
        proposalManager.updateProposalStatus(
            proposalId,
            IProposalManager.ProposalStatus.PoolCreated,
            0,
            0,
            0
        );

        emit ZakatPoolCreated(poolId, proposalId, proposal.organizer, deadline, fallbackPool);

        return poolId;
    }

    // ============ Donation Functions ============

    /**
     * @notice Donate to a Zakat pool
     * @param donor Address making the donation
     * @param poolId Zakat pool ID
     * @param amount Amount to donate
     * @param ipfsCID IPFS CID containing donation metadata
     */
    function donate(
        address donor,
        uint256 poolId,
        uint256 amount,
        string memory ipfsCID
    ) external nonReentrant {
        ZakatPool storage pool = zakatPools[poolId];

        require(pool.status == PoolStatus.Active || pool.status == PoolStatus.GracePeriod, "Pool not accepting donations");
        require(amount > 0, "Amount must be > 0");
        require(bytes(ipfsCID).length > 0, "IPFS CID required");

        require(idrxToken.transferFrom(donor, address(this), amount), "IDRX transfer failed");

        bool isFirstDonation = poolDonations[poolId][donor] == 0;

        if (isFirstDonation) {
            pool.donors.push(donor);
        }

        poolDonations[poolId][donor] += amount;
        pool.raisedAmount += amount;

        // Mint NFT receipt
        uint256 receiptTokenId = receiptNFT.mint(
            donor,
            poolId,
            amount,
            pool.campaignTitle,
            "Zakat",
            ipfsCID
        );

        emit DonationReceived(poolId, donor, amount, receiptTokenId);
    }

    /**
     * @notice Make a private donation using Pedersen commitment
     * @param donor Address making the donation (for NFT receipt)
     * @param poolId Zakat pool ID
     * @param amount Amount to donate
     * @param commitment Pedersen commitment
     * @param ipfsCID IPFS CID containing donation metadata
     */
    function donatePrivate(
        address donor,
        uint256 poolId,
        uint256 amount,
        bytes32 commitment,
        string memory ipfsCID
    ) external nonReentrant {
        ZakatPool storage pool = zakatPools[poolId];

        require(pool.status == PoolStatus.Active || pool.status == PoolStatus.GracePeriod, "Pool not accepting donations");
        require(amount > 0, "Amount must be > 0");
        require(commitment != bytes32(0), "Invalid commitment");
        require(bytes(ipfsCID).length > 0, "IPFS CID required");
        require(!usedCommitments[commitment], "Commitment already used");

        usedCommitments[commitment] = true;

        require(idrxToken.transferFrom(donor, address(this), amount), "IDRX transfer failed");

        poolDonations[poolId][donor] += amount;
        pool.raisedAmount += amount;

        uint256 receiptTokenId = receiptNFT.mint(
            donor,
            poolId,
            amount,
            pool.campaignTitle,
            "Zakat",
            ipfsCID
        );

        emit PrivateDonationReceived(poolId, commitment, amount, receiptTokenId);
    }

    // ============ Withdrawal Functions ============

    /**
     * @notice Organizer withdraws funds (only before deadline)
     * @dev Enforces 30-day hard limit per Shafi'i ruling
     * @param organizer Address of the organizer
     * @param poolId Zakat pool ID
     */
    function withdrawFunds(
        address organizer,
        uint256 poolId
    ) external nonReentrant {
        ZakatPool storage pool = zakatPools[poolId];

        if (pool.organizer != organizer) revert NotOrganizer();
        if (pool.fundsWithdrawn) revert FundsAlreadyWithdrawn();
        if (pool.raisedAmount == 0) revert NoFundsToWithdraw();
        if (pool.status != PoolStatus.Active) revert PoolNotActive();

        // Check if still within withdrawal period
        uint256 currentDeadline = pool.deadline;
        if (block.timestamp >= currentDeadline) {
            revert WithdrawalPeriodExpired();
        }

        pool.fundsWithdrawn = true;
        pool.status = PoolStatus.Completed;

        uint256 amount = pool.raisedAmount;
        proposalManager.updateProposalStatus(
            pool.proposalId,
            IProposalManager.ProposalStatus.Completed,
            0,
            0,
            0
        );

        require(idrxToken.transfer(organizer, amount), "Transfer failed");

        emit FundsWithdrawn(poolId, organizer, amount);
    }

    // ============ Timeout & Redistribution Functions ============

    /**
     * @notice Check if pool has exceeded deadline and update status
     * @dev Anyone can call this to trigger status update
     * @param poolId Zakat pool ID
     */
    function checkTimeout(uint256 poolId) external {
        ZakatPool storage pool = zakatPools[poolId];

        if (pool.poolId == 0) revert PoolNotFound();

        // If already redistributed or completed, nothing to do
        if (pool.status == PoolStatus.Redistributed || pool.status == PoolStatus.Completed) {
            return;
        }

        // Check if we've passed the deadline
        if (block.timestamp >= pool.deadline && pool.status == PoolStatus.Active) {
            pool.status = PoolStatus.GracePeriod;
            emit PoolEnteredGracePeriod(poolId, pool.gracePeriodEnd);
        }

        // Check if grace period has ended
        if (block.timestamp >= pool.gracePeriodEnd && pool.status == PoolStatus.GracePeriod) {
            // Auto-redistribute will be triggered separately
            // This just marks the pool as ready for redistribution
        }
    }

    /**
     * @notice Sharia council grants one-time 14-day extension during grace period
     * @dev Only callable during grace period, only once per pool
     * @param poolId Zakat pool ID
     * @param reasoning IPFS CID documenting the reason for extension
     */
    function councilExtendDeadline(
        uint256 poolId,
        string memory reasoning
    ) external onlyRole(SHARIA_COUNCIL_ROLE) {
        ZakatPool storage pool = zakatPools[poolId];

        if (pool.poolId == 0) revert PoolNotFound();
        if (pool.status != PoolStatus.GracePeriod) revert NotInGracePeriod();
        if (pool.extensionUsed) revert ExtensionAlreadyUsed();

        // Grant extension
        pool.extensionGranted = true;
        pool.extensionUsed = true;
        pool.extensionGrantedAt = block.timestamp;
        pool.status = PoolStatus.Active;

        pool.deadline = block.timestamp + EXTENSION_DURATION;
        pool.gracePeriodEnd = pool.deadline + GRACE_PERIOD;

        emit DeadlineExtended(poolId, pool.deadline, reasoning);
    }

    /**
     * @notice Execute redistribution to fallback pool after grace period ends
     * @dev Anyone can trigger this once grace period expires
     * @param poolId Zakat pool ID
     */
    function executeRedistribution(uint256 poolId) external nonReentrant {
        ZakatPool storage pool = zakatPools[poolId];

        if (pool.poolId == 0) revert PoolNotFound();
        if (pool.redistributed) revert AlreadyRedistributed();
        if (pool.raisedAmount == 0) revert NoFundsToWithdraw();

        // Must be past grace period
        if (block.timestamp < pool.gracePeriodEnd) {
            revert PoolNotRedistributable();
        }

        // Verify fallback pool is still approved
        address fallbackAddr = pool.fallbackPool;
        if (fallbackAddr == address(0)) {
            fallbackAddr = defaultFallbackPool;
        }
        if (fallbackAddr == address(0)) {
            revert InvalidFallbackPool(); // No fallback pool configured
        }
        if (fallbackPools[fallbackAddr].status != FallbackStatus.Approved) {
            revert FallbackPoolNotApproved();
        }

        pool.redistributed = true;
        pool.status = PoolStatus.Redistributed;

        uint256 amount = pool.raisedAmount;

        // Transfer to fallback pool
        require(idrxToken.transfer(fallbackAddr, amount), "Transfer to fallback failed");

        // Update proposal status
        proposalManager.updateProposalStatus(
            pool.proposalId,
            IProposalManager.ProposalStatus.Canceled, // Using Canceled to indicate redirected
            0,
            0,
            0
        );

        emit FundsRedistributed(poolId, fallbackAddr, amount);
    }

    // ============ Fallback Pool Management ============

    /**
     * @notice Propose a fallback pool for Zakat redistribution
     * @dev Permissionless - anyone can propose
     * @param pool Address of the proposed fallback pool
     * @param reasoning IPFS CID with proposal documentation
     */
    function proposeFallbackPool(
        address pool,
        string memory reasoning
    ) external {
        require(pool != address(0), "Invalid pool address");
        require(bytes(reasoning).length > 0, "Reasoning required");

        FallbackPoolData storage fallbackData = fallbackPools[pool];

        if (fallbackData.status == FallbackStatus.None) {
            fallbackPoolList.push(pool);
        }

        fallbackData.pool = pool;
        fallbackData.status = FallbackStatus.Proposed;
        fallbackData.proposedAt = block.timestamp;
        fallbackData.proposer = msg.sender;
        fallbackData.reasoning = reasoning;

        emit FallbackPoolProposed(pool, msg.sender, reasoning);
    }

    /**
     * @notice Sharia council approves a proposed fallback pool
     * @param pool Address of the fallback pool to approve
     */
    function vetFallbackPool(address pool) external onlyRole(SHARIA_COUNCIL_ROLE) {
        FallbackPoolData storage fallbackData = fallbackPools[pool];

        require(fallbackData.status == FallbackStatus.Proposed, "Pool not proposed");

        // Sharia council approval is final - no need for additional ratification
        fallbackData.status = FallbackStatus.Approved;

        emit FallbackPoolVetted(pool, msg.sender);
        emit FallbackPoolApproved(pool);
    }

    /**
     * @notice Revoke approval of a fallback pool
     * @param pool Address of the fallback pool to revoke
     */
    function revokeFallbackPool(address pool) external onlyRole(SHARIA_COUNCIL_ROLE) {
        FallbackPoolData storage fallbackData = fallbackPools[pool];

        require(fallbackData.status != FallbackStatus.None, "Pool not proposed");
        require(fallbackData.status != FallbackStatus.Approved || !fallbackHasFunds(pool), "Pool has redistributed funds");

        fallbackData.status = FallbackStatus.Proposed; // Reset to proposed

        emit FallbackPoolRevoked(pool);
    }

    /**
     * @notice Set default fallback pool
     * @param pool Address of the default fallback pool
     */
    function setDefaultFallbackPool(address pool) external onlyRole(ADMIN_ROLE) {
        require(pool != address(0), "Invalid pool address");

        // Auto-approve default fallback pool
        if (fallbackPools[pool].status == FallbackStatus.None) {
            fallbackPoolList.push(pool);
        }

        fallbackPools[pool].pool = pool;
        fallbackPools[pool].status = FallbackStatus.Approved;
        defaultFallbackPool = pool;

        emit DefaultFallbackPoolSet(pool);
    }

    // ============ View Functions ============

    /**
     * @notice Get Zakat pool details
     * @param poolId Zakat pool ID
     * @return pool Zakat pool data
     */
    function getPool(uint256 poolId) external view returns (ZakatPool memory) {
        return zakatPools[poolId];
    }

    /**
     * @notice Get pool donors
     * @param poolId Zakat pool ID
     * @return donors Array of donor addresses
     */
    function getPoolDonors(uint256 poolId) external view returns (address[] memory) {
        return zakatPools[poolId].donors;
    }

    /**
     * @notice Get donor contribution
     * @param poolId Zakat pool ID
     * @param donor Donor address
     * @return amount Total contribution amount
     */
    function getDonorContribution(
        uint256 poolId,
        address donor
    ) external view returns (uint256) {
        return poolDonations[poolId][donor];
    }

    /**
     * @notice Get pool by proposal ID
     * @param proposalId Proposal ID
     * @return poolId Corresponding Zakat pool ID
     */
    function getPoolByProposal(uint256 proposalId) external view returns (uint256) {
        return proposalToPool[proposalId];
    }

    /**
     * @notice Get time remaining for withdrawal
     * @param poolId Zakat pool ID
     * @return remaining Seconds remaining, 0 if expired
     * @return inGracePeriod Whether pool is in grace period
     * @return canRedistribute Whether redistribution can be triggered
     */
    function getTimeRemaining(uint256 poolId)
        external
        view
        returns (
            uint256 remaining,
            bool inGracePeriod,
            bool canRedistribute
        )
    {
        ZakatPool storage pool = zakatPools[poolId];

        if (block.timestamp < pool.deadline) {
            remaining = pool.deadline - block.timestamp;
            inGracePeriod = false;
            canRedistribute = false;
        } else if (block.timestamp < pool.gracePeriodEnd) {
            remaining = 0;
            inGracePeriod = true;
            canRedistribute = false;
        } else {
            remaining = 0;
            inGracePeriod = false;
            canRedistribute = !pool.redistributed && pool.raisedAmount > 0;
        }
    }

    /**
     * @notice Get fallback pool details
     * @param pool Fallback pool address
     * @return fallback Fallback pool data
     */
    function getFallbackPool(address pool) external view returns (FallbackPoolData memory) {
        return fallbackPools[pool];
    }

    /**
     * @notice Get all fallback pools
     * @return pools Array of all fallback pool addresses
     */
    function getAllFallbackPools() external view returns (address[] memory) {
        return fallbackPoolList;
    }

    /**
     * @notice Check if pool is ready for redistribution
     * @param poolId Zakat pool ID
     * @return ready True if ready for redistribution
     */
    function isReadyForRedistribution(uint256 poolId) external view returns (bool) {
        ZakatPool storage pool = zakatPools[poolId];
        return
            block.timestamp >= pool.gracePeriodEnd &&
            !pool.redistributed &&
            pool.raisedAmount > 0 &&
            pool.status != PoolStatus.Completed;
    }

    // ============ Internal Functions ============

    /**
     * @notice Check if a fallback pool has received redistributed funds
     * @dev Used to prevent revocation of pools with funds
     */
    function fallbackHasFunds(address pool) internal view returns (bool) {
        // Check all pools to see if any have redistributed to this fallback
        for (uint256 i = 1; i <= poolCount; i++) {
            if (
                zakatPools[i].fallbackPool == pool &&
                zakatPools[i].redistributed
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Get pool status as a string for frontend display
     * @param poolId Zakat pool ID
     * @return statusString Human-readable status
     */
    function getPoolStatusString(uint256 poolId) external view returns (string memory) {
        ZakatPool storage pool = zakatPools[poolId];

        if (pool.status == PoolStatus.Active) {
            return "Active";
        } else if (pool.status == PoolStatus.GracePeriod) {
            return "Grace Period";
        } else if (pool.status == PoolStatus.Redistributed) {
            return "Redistributed";
        } else if (pool.status == PoolStatus.Completed) {
            return "Completed";
        }
        return "Unknown";
    }
}
