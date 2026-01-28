// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IProposalManager.sol";
import "./ProposalManager.sol";
import "../../tokens/VotingToken.sol";

/**
 * @title MilestoneManager
 * @notice Manages milestone completion proof submission, voting, and approval
 * @dev Reuses voting mechanism similar to VotingManager for milestone approvals
 */
contract MilestoneManager is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");

    ProposalManager public proposalManager;
    VotingToken public votingToken;

    uint256 public votingPeriod = 7 days;
    uint256 public quorumPercentage = 10; // 10% of total vZKT supply
    uint256 public passThreshold = 51; // 51% of valid votes (excludes abstain)

    // Track votes per milestone: proposalId => milestoneId => voter => hasVoted
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasVoted;

    event MilestoneProofSubmitted(
        uint256 indexed proposalId,
        uint256 indexed milestoneId,
        address indexed organizer,
        string ipfsCID
    );
    event MilestoneVotingStarted(
        uint256 indexed proposalId,
        uint256 indexed milestoneId,
        uint256 voteStart,
        uint256 voteEnd
    );
    event MilestoneVoteCast(
        uint256 indexed proposalId,
        uint256 indexed milestoneId,
        address indexed voter,
        uint8 support,
        uint256 weight
    );
    event MilestoneVoteFinalized(
        uint256 indexed proposalId,
        uint256 indexed milestoneId,
        bool approved,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 votesAbstain
    );

    constructor(address _proposalManager, address _votingToken) {
        require(_proposalManager != address(0), "Invalid proposal manager");
        require(_votingToken != address(0), "Invalid voting token");

        proposalManager = ProposalManager(_proposalManager);
        votingToken = VotingToken(_votingToken);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Organizer submits proof document for milestone completion
     * @param organizer Address of the organizer
     * @param proposalId Proposal ID containing the milestone
     * @param milestoneId Index of the milestone in the proposal
     * @param ipfsCID IPFS CID of the proof document (Pinata private)
     */
    function submitMilestoneProof(
        address organizer,
        uint256 proposalId,
        uint256 milestoneId,
        string memory ipfsCID
    ) external onlyRole(ORGANIZER_ROLE) {
        IProposalManager.Proposal memory proposal = proposalManager.getProposal(proposalId);

        require(proposal.organizer == organizer, "Not proposal organizer");
        require(proposal.status == IProposalManager.ProposalStatus.PoolCreated, "Pool not created");
        require(bytes(ipfsCID).length > 0, "IPFS CID required");

        IProposalManager.Milestone memory milestone = proposalManager.getMilestone(proposalId, milestoneId);

        require(milestone.milestoneId == milestoneId, "Milestone does not exist");
        require(
            milestone.status == IProposalManager.MilestoneStatus.Pending ||
                milestone.status == IProposalManager.MilestoneStatus.Rejected,
            "Invalid milestone status"
        );
        require(milestoneId == proposal.currentMilestoneIndex, "Must complete milestones sequentially");

        // Update milestone proof
        proposalManager.updateMilestoneProof(proposalId, milestoneId, ipfsCID);
        proposalManager.updateMilestoneStatus(
            proposalId,
            milestoneId,
            IProposalManager.MilestoneStatus.ProofSubmitted,
            0,
            0,
            0
        );

        emit MilestoneProofSubmitted(proposalId, milestoneId, organizer, ipfsCID);
    }

    /**
     * @notice Start voting period for milestone approval
     * @param proposalId Proposal ID containing the milestone
     * @param milestoneId Index of the milestone
     */
    function startMilestoneVoting(uint256 proposalId, uint256 milestoneId) external {
        IProposalManager.Milestone memory milestone = proposalManager.getMilestone(proposalId, milestoneId);

        require(milestone.milestoneId == milestoneId, "Milestone does not exist");
        require(
            milestone.status == IProposalManager.MilestoneStatus.ProofSubmitted,
            "Proof not submitted"
        );

        // Update milestone to Voting status with timestamps
        proposalManager.updateMilestoneStatus(
            proposalId,
            milestoneId,
            IProposalManager.MilestoneStatus.Voting,
            0,
            0,
            0
        );

        emit MilestoneVotingStarted(
            proposalId,
            milestoneId,
            block.timestamp,
            block.timestamp + votingPeriod
        );
    }

    /**
     * @notice Cast vote on milestone completion
     * @param voter Address of the voter
     * @param proposalId Proposal ID containing the milestone
     * @param milestoneId Index of the milestone
     * @param support Vote type: 0 = Against, 1 = For, 2 = Abstain
     */
    function voteMilestone(
        address voter,
        uint256 proposalId,
        uint256 milestoneId,
        uint8 support
    ) external nonReentrant {
        require(support <= 2, "Invalid vote type");

        IProposalManager.Milestone memory milestone = proposalManager.getMilestone(proposalId, milestoneId);

        require(milestone.milestoneId == milestoneId, "Milestone does not exist");
        require(milestone.status == IProposalManager.MilestoneStatus.Voting, "Not in voting period");
        require(block.timestamp >= milestone.voteStart, "Voting not started");
        require(block.timestamp <= milestone.voteEnd, "Voting period ended");
        require(!hasVoted[proposalId][milestoneId][voter], "Already voted");

        uint256 voteWeight = votingToken.balanceOf(voter);
        require(voteWeight > 0, "No voting power");

        hasVoted[proposalId][milestoneId][voter] = true;

        // Update vote counts
        uint256 newVotesFor = milestone.votesFor;
        uint256 newVotesAgainst = milestone.votesAgainst;
        uint256 newVotesAbstain = milestone.votesAbstain;

        if (support == 0) {
            newVotesAgainst += voteWeight;
        } else if (support == 1) {
            newVotesFor += voteWeight;
        } else {
            newVotesAbstain += voteWeight;
        }

        proposalManager.updateMilestoneStatus(
            proposalId,
            milestoneId,
            IProposalManager.MilestoneStatus.Voting,
            newVotesFor,
            newVotesAgainst,
            newVotesAbstain
        );

        emit MilestoneVoteCast(proposalId, milestoneId, voter, support, voteWeight);
    }

    /**
     * @notice Finalize milestone vote and determine approval
     * @param proposalId Proposal ID containing the milestone
     * @param milestoneId Index of the milestone
     */
    function finalizeMilestoneVote(uint256 proposalId, uint256 milestoneId) external {
        IProposalManager.Milestone memory milestone = proposalManager.getMilestone(proposalId, milestoneId);

        require(milestone.milestoneId == milestoneId, "Milestone does not exist");
        require(milestone.status == IProposalManager.MilestoneStatus.Voting, "Not in voting period");
        require(block.timestamp > milestone.voteEnd, "Voting period not ended");

        uint256 totalSupply = votingToken.totalSupply();
        uint256 totalVotes = milestone.votesFor + milestone.votesAgainst + milestone.votesAbstain;
        uint256 validVotes = milestone.votesFor + milestone.votesAgainst; // Exclude abstain

        // Check quorum (10% of total supply must participate)
        uint256 requiredQuorum = (totalSupply * quorumPercentage) / 100;
        bool quorumReached = totalVotes >= requiredQuorum;

        // Check pass threshold (51% of valid votes must be For)
        bool passed = false;
        if (quorumReached && validVotes > 0) {
            uint256 forPercentage = (milestone.votesFor * 100) / validVotes;
            passed = forPercentage >= passThreshold;
        }

        IProposalManager.MilestoneStatus newStatus = passed
            ? IProposalManager.MilestoneStatus.Approved
            : IProposalManager.MilestoneStatus.Rejected;

        proposalManager.updateMilestoneStatus(
            proposalId,
            milestoneId,
            newStatus,
            milestone.votesFor,
            milestone.votesAgainst,
            milestone.votesAbstain
        );

        emit MilestoneVoteFinalized(
            proposalId,
            milestoneId,
            passed,
            milestone.votesFor,
            milestone.votesAgainst,
            milestone.votesAbstain
        );
    }

    /**
     * @notice Get milestone details
     * @param proposalId Proposal ID
     * @param milestoneId Milestone index
     * @return milestone Milestone struct
     */
    function getMilestone(uint256 proposalId, uint256 milestoneId)
        external
        view
        returns (IProposalManager.Milestone memory)
    {
        return proposalManager.getMilestone(proposalId, milestoneId);
    }

    /**
     * @notice Get all milestones for a proposal
     * @param proposalId Proposal ID
     * @return milestones Array of Milestone structs
     */
    function getMilestones(uint256 proposalId)
        external
        view
        returns (IProposalManager.Milestone[] memory)
    {
        return proposalManager.getMilestones(proposalId);
    }

    /**
     * @notice Check if voter has voted on milestone
     * @param proposalId Proposal ID
     * @param milestoneId Milestone index
     * @param voter Voter address
     * @return voted True if already voted
     */
    function hasVotedOnMilestone(uint256 proposalId, uint256 milestoneId, address voter)
        external
        view
        returns (bool)
    {
        return hasVoted[proposalId][milestoneId][voter];
    }

    // ============ Configuration Functions ============

    function setVotingPeriod(uint256 _votingPeriod) external onlyRole(ADMIN_ROLE) {
        votingPeriod = _votingPeriod;
    }

    function setQuorumPercentage(uint256 _quorumPercentage) external onlyRole(ADMIN_ROLE) {
        require(_quorumPercentage <= 100, "Invalid quorum");
        quorumPercentage = _quorumPercentage;
    }

    function setPassThreshold(uint256 _passThreshold) external onlyRole(ADMIN_ROLE) {
        require(_passThreshold <= 100, "Invalid threshold");
        passThreshold = _passThreshold;
    }
}
