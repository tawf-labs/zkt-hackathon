// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;
/**
 * @title IProposalManager
 * @notice Interface for proposal creation and KYC management
 */
interface IProposalManager {
    enum ProposalStatus {
        Draft,
        CommunityVote,
        CommunityPassed,
        CommunityRejected,
        ShariaReview,
        ShariaApproved,
        ShariaRejected,
        PoolCreated,
        Completed,
        Canceled
    }
    
    enum KYCStatus {
        NotRequired,
        Pending,
        Verified,
        Rejected
    }
    
    enum CampaignType {
        Normal,
        ZakatCompliant
    }
    
    struct Proposal {
        uint256 proposalId;
        address organizer;
        string title;
        string description;
        uint256 fundingGoal;
        KYCStatus kycStatus;
        bool isEmergency;
        bytes32 mockZKKYCProof;
        string kycNotes;
        uint256 createdAt;
        uint256 communityVoteStart;
        uint256 communityVoteEnd;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        ProposalStatus status;
        CampaignType campaignType;
        uint256 poolId;
        string[] zakatChecklistItems;
    }
    
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed organizer,
        string title,
        uint256 fundingGoal,
        bool isEmergency
    );
    event KYCStatusUpdated(uint256 indexed proposalId, KYCStatus status, string notes);
    event ProposalSubmitted(uint256 indexed proposalId, uint256 voteStart, uint256 voteEnd);
    event ProposalCanceled(uint256 indexed proposalId);
    
    function createProposal(
        address organizer,
        string memory title,
        string memory description,
        uint256 fundingGoal,
        bool isEmergency,
        bytes32 mockZKKYCProof,
        string[] memory zakatChecklistItems
    ) external returns (uint256);
    
    function updateKYCStatus(
        uint256 proposalId,
        KYCStatus newStatus,
        string memory notes
    ) external;
    
    function submitForCommunityVote(uint256 proposalId) external;
    function cancelProposal(uint256 proposalId) external;
    function updateProposalStatus(
        uint256 proposalId,
        ProposalStatus newStatus,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 votesAbstain
    ) external;
    function updateProposalCampaignType(uint256 proposalId, CampaignType campaignType) external;
    function updateProposalPoolId(uint256 proposalId, uint256 poolId) external;
    function getProposal(uint256 proposalId) external view returns (Proposal memory);
    function getProposalChecklistItems(uint256 proposalId) external view returns (string[] memory);
}
