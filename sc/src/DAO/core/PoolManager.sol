// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../tokens/DonationReceiptNFT.sol";
import "../interfaces/IProposalManager.sol";
import "./ProposalManager.sol";

/**
 * @title PoolManager
 * @notice Handles campaign pool creation and fundraising
 */
contract PoolManager is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    struct CampaignPool {
        uint256 poolId;
        uint256 proposalId;
        address organizer;
        uint256 fundingGoal;
        uint256 raisedAmount;
        IProposalManager.CampaignType campaignType;
        string campaignTitle;
        bool isActive;
        uint256 createdAt;
        address[] donors;
        bool fundsWithdrawn;
    }
    
    mapping(uint256 => uint256) public proposalToPool;
    
    ProposalManager public proposalManager;
    IERC20 public idrxToken;
    DonationReceiptNFT public receiptNFT;
    
    uint256 public poolCount;
    
    mapping(uint256 => CampaignPool) public campaignPools;
    mapping(uint256 => mapping(address => uint256)) public poolDonations;
    
    event CampaignPoolCreated(
        uint256 indexed poolId,
        uint256 indexed proposalId,
        IProposalManager.CampaignType campaignType
    );
    event DonationReceived(
        uint256 indexed poolId,
        address indexed donor,
        uint256 amount,
        uint256 receiptTokenId
    );
    event FundingGoalReached(uint256 indexed poolId, uint256 totalRaised);
    event FundsWithdrawn(uint256 indexed poolId, address indexed organizer, uint256 amount);
    
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
    }
    
    function createCampaignPool(uint256 proposalId) 
        external 
        onlyRole(ADMIN_ROLE) 
        returns (uint256) 
    {
        IProposalManager.Proposal memory proposal = proposalManager.getProposal(proposalId);
        
        require(proposal.status == IProposalManager.ProposalStatus.ShariaApproved, "Not approved");
        require(proposalToPool[proposalId] == 0, "Pool already created");
        
        poolCount++;
        uint256 poolId = poolCount;
        
        CampaignPool storage pool = campaignPools[poolId];
        pool.poolId = poolId;
        pool.proposalId = proposalId;
        pool.organizer = proposal.organizer;
        pool.fundingGoal = proposal.fundingGoal;
        pool.campaignType = proposal.campaignType;
        pool.campaignTitle = proposal.title;
        pool.isActive = true;
        pool.createdAt = block.timestamp;
        
        proposalToPool[proposalId] = poolId;
        proposalManager.updateProposalPoolId(proposalId, poolId);
        proposalManager.updateProposalStatus(proposalId, IProposalManager.ProposalStatus.PoolCreated, 0, 0, 0);
        
        emit CampaignPoolCreated(poolId, proposalId, proposal.campaignType);
        
        return poolId;
    }
    
    function donate(address donor, uint256 poolId, uint256 amount, string memory ipfsCID) external nonReentrant {
        CampaignPool storage pool = campaignPools[poolId];
        
        require(pool.isActive, "Pool not active");
        require(amount > 0, "Amount must be > 0");
        require(bytes(ipfsCID).length > 0, "IPFS CID required");
        
        require(
            idrxToken.transferFrom(donor, address(this), amount),
            "IDRX transfer failed"
        );
        
        bool isFirstDonation = poolDonations[poolId][donor] == 0;
        
        if (isFirstDonation) {
            pool.donors.push(donor);
        }
        
        poolDonations[poolId][donor] += amount;
        pool.raisedAmount += amount;
        
        // Mint new NFT receipt for EVERY donation (one receipt per donation)
        // IPFS CID contains full metadata: campaign reports, images, donation proof, etc.
        string memory campaignTypeStr = pool.campaignType == IProposalManager.CampaignType.ZakatCompliant 
            ? "Zakat" 
            : "Normal";
        uint256 receiptTokenId = receiptNFT.mint(donor, poolId, amount, pool.campaignTitle, campaignTypeStr, ipfsCID);
        
        emit DonationReceived(poolId, donor, amount, receiptTokenId);
        
        if (pool.raisedAmount >= pool.fundingGoal) {
            emit FundingGoalReached(poolId, pool.raisedAmount);
        }
    }
    
    function withdrawFunds(address organizer, uint256 poolId) external nonReentrant {
        CampaignPool storage pool = campaignPools[poolId];
        
        require(pool.organizer == organizer, "Not organizer");
        require(!pool.fundsWithdrawn, "Funds already withdrawn");
        require(pool.raisedAmount > 0, "No funds to withdraw");
        
        pool.fundsWithdrawn = true;
        pool.isActive = false;
        
        uint256 amount = pool.raisedAmount;
        proposalManager.updateProposalStatus(pool.proposalId, IProposalManager.ProposalStatus.Completed, 0, 0, 0);
        
        require(idrxToken.transfer(organizer, amount), "Transfer failed");
        
        emit FundsWithdrawn(poolId, organizer, amount);
    }
    
    function getPool(uint256 poolId) external view returns (CampaignPool memory) {
        return campaignPools[poolId];
    }
    
    function getPoolDonors(uint256 poolId) external view returns (address[] memory) {
        return campaignPools[poolId].donors;
    }
    
    function getDonorContribution(uint256 poolId, address donor) 
        external 
        view 
        returns (uint256) 
    {
        return poolDonations[poolId][donor];
    }
}
