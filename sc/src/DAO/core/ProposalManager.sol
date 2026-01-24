// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IProposalManager.sol";

/**
 * @title ProposalManager
 * @notice Manages proposal creation, KYC verification, and lifecycle
 */
contract ProposalManager is AccessControl, IProposalManager {
    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant KYC_ORACLE_ROLE = keccak256("KYC_ORACLE_ROLE");
    bytes32 public constant VOTING_MANAGER_ROLE = keccak256("VOTING_MANAGER_ROLE");
    
    uint256 public proposalCount;
    uint256 public votingPeriod = 7 days;
    
    mapping(uint256 => Proposal) public proposals;
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    function createProposal(
        address organizer,
        string memory title,
        string memory description,
        uint256 fundingGoal,
        bool isEmergency,
        bytes32 mockZKKYCProof,
        string[] memory zakatChecklistItems
    ) external onlyRole(ORGANIZER_ROLE) returns (uint256) {
        require(organizer != address(0), "Invalid organizer address");
        require(fundingGoal > 0, "Funding goal must be > 0");
        require(bytes(title).length > 0, "Title cannot be empty");
        
        proposalCount++;
        uint256 proposalId = proposalCount;
        
        Proposal storage proposal = proposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.organizer = organizer;
        proposal.title = title;
        proposal.description = description;
        proposal.fundingGoal = fundingGoal;
        proposal.isEmergency = isEmergency;
        proposal.mockZKKYCProof = mockZKKYCProof;
        proposal.createdAt = block.timestamp;
        proposal.status = ProposalStatus.Draft;
        proposal.zakatChecklistItems = zakatChecklistItems;
        
        if (isEmergency) {
            proposal.kycStatus = KYCStatus.NotRequired;
        } else {
            proposal.kycStatus = KYCStatus.Pending;
        }
        
        emit ProposalCreated(proposalId, msg.sender, title, fundingGoal, isEmergency);
        
        return proposalId;
    }
    
    function updateKYCStatus(
        uint256 proposalId,
        KYCStatus newStatus,
        string memory notes
    ) external {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(KYC_ORACLE_ROLE, msg.sender),
            "Not authorized"
        );
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        proposal.kycStatus = newStatus;
        proposal.kycNotes = notes;
        
        emit KYCStatusUpdated(proposalId, newStatus, notes);
    }
    
    function submitForCommunityVote(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        
        require(
            proposal.organizer == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        require(proposal.status == ProposalStatus.Draft, "Invalid status");
        
        if (!proposal.isEmergency) {
            require(
                proposal.kycStatus == KYCStatus.Verified,
                "KYC must be verified first"
            );
        }
        
        proposal.communityVoteStart = block.timestamp;
        proposal.communityVoteEnd = block.timestamp + votingPeriod;
        proposal.status = ProposalStatus.CommunityVote;
        
        emit ProposalSubmitted(proposalId, proposal.communityVoteStart, proposal.communityVoteEnd);
    }
    
    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        
        require(
            proposal.organizer == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        require(
            proposal.status != ProposalStatus.PoolCreated &&
            proposal.status != ProposalStatus.Completed,
            "Cannot cancel active/completed pool"
        );
        
        proposal.status = ProposalStatus.Canceled;
        
        emit ProposalCanceled(proposalId);
    }
    
    function updateProposalStatus(
        uint256 proposalId,
        ProposalStatus newStatus,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 votesAbstain
    ) external onlyRole(VOTING_MANAGER_ROLE) {
        Proposal storage proposal = proposals[proposalId];
        proposal.status = newStatus;
        proposal.votesFor = votesFor;
        proposal.votesAgainst = votesAgainst;
        proposal.votesAbstain = votesAbstain;
    }
    
    function updateProposalCampaignType(uint256 proposalId, CampaignType campaignType)
        external
        onlyRole(VOTING_MANAGER_ROLE)
    {
        proposals[proposalId].campaignType = campaignType;
    }
    
    function updateProposalPoolId(uint256 proposalId, uint256 poolId)
        external
        onlyRole(VOTING_MANAGER_ROLE)
    {
        proposals[proposalId].poolId = poolId;
    }
    
    function setVotingPeriod(uint256 _votingPeriod) external onlyRole(ADMIN_ROLE) {
        votingPeriod = _votingPeriod;
    }
    
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }
    
    function getProposalChecklistItems(uint256 proposalId) 
        external 
        view 
        returns (string[] memory) 
    {
        return proposals[proposalId].zakatChecklistItems;
    }
}
