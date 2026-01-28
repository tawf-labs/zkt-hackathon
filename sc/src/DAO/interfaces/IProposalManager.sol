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

    enum MilestoneStatus {
        Pending,          // Initial state after proposal approval
        ProofSubmitted,   // Organizer uploaded proof document
        Voting,           // Community voting in progress
        Approved,         // Voting passed, funds can be released
        Rejected,         // Voting failed
        Completed         // Funds released
    }

    /// @notice Input struct for creating milestones - only contains user-provided fields
    /// @dev This prevents users from specifying sensitive fields like status or votes
    struct MilestoneInput {
        string description;            // Milestone goal description
        uint256 targetAmount;          // IDRX amount to release (in wei)
    }

    /// @notice Full milestone struct with all fields (managed by contract)
    struct Milestone {
        uint256 milestoneId;           // Index in array (0, 1, 2...)
        string description;            // Milestone goal description
        uint256 targetAmount;          // IDRX amount to release (in wei)
        string proofIPFS;              // IPFS CID of completion proof (Pinata private)
        MilestoneStatus status;        // Current milestone state
        uint256 proofSubmittedAt;      // Timestamp when proof submitted
        uint256 voteStart;             // Voting period start
        uint256 voteEnd;               // Voting period end
        uint256 votesFor;              // Approval votes
        uint256 votesAgainst;          // Rejection votes
        uint256 votesAbstain;          // Abstain votes
        uint256 releasedAt;            // Timestamp when funds released
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
        string metadataURI; // IPFS URI containing full campaign metadata (images, category, location, etc.)
        uint256 currentMilestoneIndex; // Next milestone to complete
        uint256 totalReleasedAmount;   // Cumulative released funds
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
    event MilestoneProofSubmitted(uint256 indexed proposalId, uint256 indexed milestoneId, string ipfsCID);
    event MilestoneVotingStarted(uint256 indexed proposalId, uint256 indexed milestoneId, uint256 voteStart, uint256 voteEnd);
    event MilestoneStatusUpdated(uint256 indexed proposalId, uint256 indexed milestoneId, MilestoneStatus status);
    
    function createProposal(
        address organizer,
        string memory title,
        string memory description,
        uint256 fundingGoal,
        bool isEmergency,
        bytes32 mockZKKYCProof,
        string[] memory zakatChecklistItems,
        string memory metadataURI,
        MilestoneInput[] memory milestoneInputs
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

    // Milestone management functions
    function getMilestone(uint256 proposalId, uint256 milestoneId) external view returns (Milestone memory);
    function getMilestones(uint256 proposalId) external view returns (Milestone[] memory);
    function getMilestoneCount(uint256 proposalId) external view returns (uint256);
    function updateMilestoneStatus(
        uint256 proposalId,
        uint256 milestoneId,
        MilestoneStatus newStatus,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 votesAbstain
    ) external;
    function updateMilestoneProof(uint256 proposalId, uint256 milestoneId, string memory ipfsCID) external;
    function advanceToNextMilestone(uint256 proposalId) external;
    function addToReleasedAmount(uint256 proposalId, uint256 amount) external;
}
