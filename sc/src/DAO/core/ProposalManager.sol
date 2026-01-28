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
    bytes32 public constant MILESTONE_MANAGER_ROLE = keccak256("MILESTONE_MANAGER_ROLE");

    uint256 public proposalCount;
    uint256 public votingPeriod = 7 days;
    uint256 public constant MAX_MILESTONES = 10;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => Milestone[]) public proposalMilestones;
    
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
        string[] memory zakatChecklistItems,
        string memory metadataURI,
        MilestoneInput[] memory milestoneInputs
    ) external onlyRole(ORGANIZER_ROLE) returns (uint256) {
        require(organizer != address(0), "Invalid organizer address");
        require(fundingGoal > 0, "Funding goal must be > 0");
        require(bytes(title).length > 0, "Title cannot be empty");

        // Milestone validation
        if (milestoneInputs.length > 0) {
            require(!isEmergency, "Emergency campaigns cannot have milestones");
            require(milestoneInputs.length <= MAX_MILESTONES, "Too many milestones");

            uint256 totalMilestoneAmount = 0;
            for (uint256 i = 0; i < milestoneInputs.length; i++) {
                require(milestoneInputs[i].targetAmount > 0, "Milestone amount must be > 0");
                require(bytes(milestoneInputs[i].description).length > 0, "Milestone description required");
                require(
                    bytes(milestoneInputs[i].description).length <= 500,
                    "Milestone description too long"
                );
                totalMilestoneAmount += milestoneInputs[i].targetAmount;
            }
            require(totalMilestoneAmount <= fundingGoal, "Milestone total exceeds funding goal");
        }

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
        proposal.metadataURI = metadataURI;
        proposal.currentMilestoneIndex = 0;
        proposal.totalReleasedAmount = 0;

        if (isEmergency) {
            proposal.kycStatus = KYCStatus.NotRequired;
        } else {
            proposal.kycStatus = KYCStatus.Pending;
        }

        // Map MilestoneInput to full Milestone struct
        // Only description and targetAmount come from user input
        // All other fields are initialized to safe defaults by the contract
        for (uint256 i = 0; i < milestoneInputs.length; i++) {
            proposalMilestones[proposalId].push(Milestone({
                milestoneId: i,
                description: milestoneInputs[i].description,
                targetAmount: milestoneInputs[i].targetAmount,
                proofIPFS: "",
                status: MilestoneStatus.Pending,
                proofSubmittedAt: 0,
                voteStart: 0,
                voteEnd: 0,
                votesFor: 0,
                votesAgainst: 0,
                votesAbstain: 0,
                releasedAt: 0
            }));
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

    // ============ Milestone Management Functions ============

    function getMilestone(uint256 proposalId, uint256 milestoneId)
        external
        view
        returns (Milestone memory)
    {
        require(milestoneId < proposalMilestones[proposalId].length, "Milestone does not exist");
        return proposalMilestones[proposalId][milestoneId];
    }

    function getMilestones(uint256 proposalId) external view returns (Milestone[] memory) {
        return proposalMilestones[proposalId];
    }

    function getMilestoneCount(uint256 proposalId) external view returns (uint256) {
        return proposalMilestones[proposalId].length;
    }

    function updateMilestoneStatus(
        uint256 proposalId,
        uint256 milestoneId,
        MilestoneStatus newStatus,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 votesAbstain
    ) external onlyRole(MILESTONE_MANAGER_ROLE) {
        require(milestoneId < proposalMilestones[proposalId].length, "Milestone does not exist");

        Milestone storage milestone = proposalMilestones[proposalId][milestoneId];
        milestone.status = newStatus;
        milestone.votesFor = votesFor;
        milestone.votesAgainst = votesAgainst;
        milestone.votesAbstain = votesAbstain;

        // Set timestamps based on status
        if (newStatus == MilestoneStatus.ProofSubmitted) {
            milestone.proofSubmittedAt = block.timestamp;
        } else if (newStatus == MilestoneStatus.Voting) {
            milestone.voteStart = block.timestamp;
            milestone.voteEnd = block.timestamp + votingPeriod;
        } else if (newStatus == MilestoneStatus.Completed) {
            milestone.releasedAt = block.timestamp;
        }

        emit MilestoneStatusUpdated(proposalId, milestoneId, newStatus);
    }

    function updateMilestoneProof(uint256 proposalId, uint256 milestoneId, string memory ipfsCID)
        external
        onlyRole(MILESTONE_MANAGER_ROLE)
    {
        require(milestoneId < proposalMilestones[proposalId].length, "Milestone does not exist");
        require(bytes(ipfsCID).length > 0, "IPFS CID required");

        proposalMilestones[proposalId][milestoneId].proofIPFS = ipfsCID;

        emit MilestoneProofSubmitted(proposalId, milestoneId, ipfsCID);
    }

    function advanceToNextMilestone(uint256 proposalId)
        external
        onlyRole(MILESTONE_MANAGER_ROLE)
    {
        Proposal storage proposal = proposals[proposalId];
        require(
            proposal.currentMilestoneIndex < proposalMilestones[proposalId].length,
            "All milestones completed"
        );

        proposal.currentMilestoneIndex++;

        // If all milestones completed, mark proposal as completed
        if (proposal.currentMilestoneIndex >= proposalMilestones[proposalId].length) {
            proposal.status = ProposalStatus.Completed;
        }
    }

    function addToReleasedAmount(uint256 proposalId, uint256 amount)
        external
        onlyRole(MILESTONE_MANAGER_ROLE)
    {
        proposals[proposalId].totalReleasedAmount += amount;
    }
}

