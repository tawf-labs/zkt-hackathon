// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ParticipationTracker
 * @notice Tracks privacy-safe participation metrics for ZKT DAO members
 * @dev This contract tracks COUNTS only, not amounts - preserving donor privacy
 *      Metrics are used for tier progression in VotingNFT
 */
contract ParticipationTracker is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TRACKER_ROLE = keccak256("TRACKER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    /// @notice Privacy-safe participation metrics (no donation amounts)
    struct ParticipationMetrics {
        // Donation metrics
        uint256 donationCount;              // Total number of donations made
        uint256 uniqueCampaignsDonated;     // Number of unique campaigns donated to
        uint256 firstDonationTimestamp;     // Platform tenure start
        uint256 lastDonationTimestamp;      // Most recent donation

        // Governance metrics
        uint256 governanceVotesCast;        // Total number of governance votes cast
        uint256 proposalsVotedOn;           // Number of unique proposals voted on
        uint256 lastVoteTimestamp;          // Most recent vote

        // Proposal/organizer metrics
        uint256 proposalsCreated;           // Number of proposals created
        uint256 proposalsApproved;          // Number of proposals that passed community vote
        uint256 proposalsCompleted;         // Number of proposals fully completed

        // Dispute/milestone metrics
        uint256 milestoneVotesCast;         // Number of milestone votes cast
        uint256 disputesRaised;             // Number of disputes initiated

        // Platform engagement
        uint256 lastActivityTimestamp;      // Last recorded activity
        bool isVerified;                    // Basic account verification status
    }

    // Mappings
    mapping(address => ParticipationMetrics) public metrics;

    // Track unique campaigns per user
    mapping(address => mapping(uint256 => bool)) public hasDonatedToCampaign;
    mapping(address => mapping(uint256 => bool)) public hasVotedOnProposal;

    // Track unique milestone votes
    mapping(address => mapping(uint256 => mapping(uint256 => bool))) public hasVotedOnMilestone;

    // Events
    event DonationRecorded(
        address indexed donor,
        uint256 indexed campaignId,
        uint256 newDonationCount,
        uint256 newUniqueCampaigns
    );
    event GovernanceVoteRecorded(
        address indexed voter,
        uint256 indexed proposalId,
        uint256 newVoteCount
    );
    event ProposalCreatedRecorded(
        address indexed organizer,
        uint256 indexed proposalId,
        uint256 newProposalCount
    );
    event ProposalApprovedRecorded(
        address indexed organizer,
        uint256 indexed proposalId,
        uint256 newApprovedCount
    );
    event ProposalCompletedRecorded(
        address indexed organizer,
        uint256 indexed proposalId,
        uint256 newCompletedCount
    );
    event MilestoneVoteRecorded(
        address indexed voter,
        uint256 indexed proposalId,
        uint256 indexed milestoneId,
        uint256 newMilestoneVoteCount
    );
    event DisputeRaisedRecorded(
        address indexed user,
        uint256 indexed proposalId,
        uint256 newDisputeCount
    );
    event VerificationUpdated(address indexed user, bool isVerified);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(TRACKER_ROLE, msg.sender);
    }

    // ============ Donation Tracking ============

    /**
     * @notice Record a donation (privacy-safe - only counts, not amounts)
     * @param donor Address of the donor
     * @param campaignId Campaign pool ID
     */
    function recordDonation(address donor, uint256 campaignId)
        external
        onlyRole(TRACKER_ROLE)
    {
        ParticipationMetrics storage m = metrics[donor];

        m.donationCount++;

        // Track unique campaigns
        if (!hasDonatedToCampaign[donor][campaignId]) {
            hasDonatedToCampaign[donor][campaignId] = true;
            m.uniqueCampaignsDonated++;
        }

        // Set first donation timestamp if new donor
        if (m.firstDonationTimestamp == 0) {
            m.firstDonationTimestamp = block.timestamp;
        }

        m.lastDonationTimestamp = block.timestamp;
        m.lastActivityTimestamp = block.timestamp;

        emit DonationRecorded(donor, campaignId, m.donationCount, m.uniqueCampaignsDonated);
    }

    // ============ Governance Voting Tracking ============

    /**
     * @notice Record a governance vote on a proposal
     * @param voter Address of the voter
     * @param proposalId Proposal ID voted on
     */
    function recordGovernanceVote(address voter, uint256 proposalId)
        external
        onlyRole(TRACKER_ROLE)
    {
        ParticipationMetrics storage m = metrics[voter];

        m.governanceVotesCast++;

        // Track unique proposals voted on
        if (!hasVotedOnProposal[voter][proposalId]) {
            hasVotedOnProposal[voter][proposalId] = true;
            m.proposalsVotedOn++;
        }

        m.lastVoteTimestamp = block.timestamp;
        m.lastActivityTimestamp = block.timestamp;

        emit GovernanceVoteRecorded(voter, proposalId, m.governanceVotesCast);
    }

    // ============ Proposal/Organizer Tracking ============

    /**
     * @notice Record proposal creation
     * @param organizer Address of the organizer
     * @param proposalId Created proposal ID
     */
    function recordProposalCreated(address organizer, uint256 proposalId)
        external
        onlyRole(TRACKER_ROLE)
    {
        ParticipationMetrics storage m = metrics[organizer];

        m.proposalsCreated++;
        m.lastActivityTimestamp = block.timestamp;

        emit ProposalCreatedRecorded(organizer, proposalId, m.proposalsCreated);
    }

    /**
     * @notice Record proposal approval (passed community vote)
     * @param organizer Address of the organizer
     * @param proposalId Approved proposal ID
     */
    function recordProposalApproved(address organizer, uint256 proposalId)
        external
        onlyRole(TRACKER_ROLE)
    {
        ParticipationMetrics storage m = metrics[organizer];

        m.proposalsApproved++;
        m.lastActivityTimestamp = block.timestamp;

        emit ProposalApprovedRecorded(organizer, proposalId, m.proposalsApproved);
    }

    /**
     * @notice Record proposal completion (all milestones done)
     * @param organizer Address of the organizer
     * @param proposalId Completed proposal ID
     */
    function recordProposalCompleted(address organizer, uint256 proposalId)
        external
        onlyRole(TRACKER_ROLE)
    {
        ParticipationMetrics storage m = metrics[organizer];

        m.proposalsCompleted++;
        m.lastActivityTimestamp = block.timestamp;

        emit ProposalCompletedRecorded(organizer, proposalId, m.proposalsCompleted);
    }

    // ============ Milestone Voting Tracking ============

    /**
     * @notice Record a milestone vote
     * @param voter Address of the voter
     * @param proposalId Proposal ID
     * @param milestoneId Milestone ID
     */
    function recordMilestoneVote(
        address voter,
        uint256 proposalId,
        uint256 milestoneId
    )
        external
        onlyRole(TRACKER_ROLE)
    {
        ParticipationMetrics storage m = metrics[voter];

        // Only count unique milestone votes
        if (!hasVotedOnMilestone[voter][proposalId][milestoneId]) {
            hasVotedOnMilestone[voter][proposalId][milestoneId] = true;
            m.milestoneVotesCast++;
        }

        m.lastActivityTimestamp = block.timestamp;

        emit MilestoneVoteRecorded(voter, proposalId, milestoneId, m.milestoneVotesCast);
    }

    // ============ Dispute Tracking ============

    /**
     * @notice Record a dispute raised by a user
     * @param user Address of the user raising the dispute
     * @param proposalId Related proposal ID
     */
    function recordDisputeRaised(address user, uint256 proposalId)
        external
        onlyRole(TRACKER_ROLE)
    {
        ParticipationMetrics storage m = metrics[user];

        m.disputesRaised++;
        m.lastActivityTimestamp = block.timestamp;

        emit DisputeRaisedRecorded(user, proposalId, m.disputesRaised);
    }

    // ============ Verification Management ============

    /**
     * @notice Set verification status for a user
     * @param user Address to verify/unverify
     * @param verified New verification status
     */
    function setVerification(address user, bool verified)
        external
        onlyRole(VERIFIER_ROLE)
    {
        metrics[user].isVerified = verified;
        emit VerificationUpdated(user, verified);
    }

    // ============ View Functions ============

    /**
     * @notice Get all participation metrics for a user
     * @param user Address to query
     * @return m Full participation metrics
     */
    function getMetrics(address user) external view returns (ParticipationMetrics memory) {
        return metrics[user];
    }

    /**
     * @notice Get tier eligibility based on metrics
     * @dev Returns which tiers a user qualifies for based on participation
     * @param user Address to query
     * @return tier1 Eligible for Tier 1 (Basic Donor)
     * @return tier2 Eligible for Tier 2 (Active Participant)
     * @return tier3 Eligible for Tier 3 (Community Leader)
     */
    function getTierEligibility(address user)
        external
        view
        returns (
            bool tier1,
            bool tier2,
            bool tier3
        )
    {
        ParticipationMetrics memory m = metrics[user];

        // Tier 1: Verified + 1+ donation
        tier1 = m.isVerified && m.donationCount >= 1;

        // Tier 2: 3+ campaigns OR 5+ governance votes OR 30+ days tenure
        bool hasCampaigns = m.uniqueCampaignsDonated >= 3;
        bool hasVotes = m.governanceVotesCast >= 5;
        bool hasTenure =
            m.firstDonationTimestamp > 0 &&
            block.timestamp >= m.firstDonationTimestamp + 30 days;
        tier2 = tier1 && (hasCampaigns || hasVotes || hasTenure);

        // Tier 3: 10+ campaigns OR approved proposal OR completed proposal
        bool hasManyCampaigns = m.uniqueCampaignsDonated >= 10;
        bool hasApprovedProposal = m.proposalsApproved >= 1;
        bool hasCompletedProposal = m.proposalsCompleted >= 1;
        tier3 = tier2 && (hasManyCampaigns || hasApprovedProposal || hasCompletedProposal);
    }

    /**
     * @notice Check if user is eligible to create proposals
     * @param user Address to query
     * @return eligible True if user can create proposals
     */
    function canCreateProposals(address user) external view returns (bool) {
        ParticipationMetrics memory m = metrics[user];
        return m.isVerified && m.donationCount >= 1;
    }

    /**
     * @notice Get platform tenure in days
     * @param user Address to query
     * @return days Number of days since first donation
     */
    function getTenureDays(address user) external view returns (uint256) {
        if (metrics[user].firstDonationTimestamp == 0) {
            return 0;
        }
        return (block.timestamp - metrics[user].firstDonationTimestamp) / 1 days;
    }

    /**
     * @notice Get donation summary for a user
     * @param user Address to query
     * @return totalDonations Total number of donations
     * @return uniqueCampaigns Number of unique campaigns donated to
     * @return firstDonation Timestamp of first donation
     * @return lastDonation Timestamp of most recent donation
     */
    function getDonationSummary(address user)
        external
        view
        returns (
            uint256 totalDonations,
            uint256 uniqueCampaigns,
            uint256 firstDonation,
            uint256 lastDonation
        )
    {
        ParticipationMetrics memory m = metrics[user];
        return (m.donationCount, m.uniqueCampaignsDonated, m.firstDonationTimestamp, m.lastDonationTimestamp);
    }

    /**
     * @notice Get governance participation summary
     * @param user Address to query
     * @return totalVotes Total governance votes cast
     * @return proposalsVoted Unique proposals voted on
     * @return milestoneVotes Total milestone votes cast
     */
    function getGovernanceSummary(address user)
        external
        view
        returns (
            uint256 totalVotes,
            uint256 proposalsVoted,
            uint256 milestoneVotes
        )
    {
        ParticipationMetrics memory m = metrics[user];
        return (m.governanceVotesCast, m.proposalsVotedOn, m.milestoneVotesCast);
    }

    /**
     * @notice Get organizer performance summary
     * @param user Address to query
     * @return created Proposals created
     * @return approved Proposals that passed community vote
     * @return completed Proposals fully completed
     * @return successRate Success rate (completed / created * 100)
     */
    function getOrganizerSummary(address user)
        external
        view
        returns (
            uint256 created,
            uint256 approved,
            uint256 completed,
            uint256 successRate
        )
    {
        ParticipationMetrics memory m = metrics[user];
        created = m.proposalsCreated;
        approved = m.proposalsApproved;
        completed = m.proposalsCompleted;

        if (created > 0) {
            successRate = (completed * 100) / created;
        } else {
            successRate = 0;
        }

        return (created, approved, completed, successRate);
    }

    /**
     * @notice Get last activity timestamp
     * @param user Address to query
     * @return timestamp Last activity timestamp
     */
    function getLastActivity(address user) external view returns (uint256) {
        return metrics[user].lastActivityTimestamp;
    }

    /**
     * @notice Check if user is considered active (activity within 90 days)
     * @param user Address to query
     * @return active True if user has recent activity
     */
    function isActiveUser(address user) external view returns (bool) {
        if (metrics[user].lastActivityTimestamp == 0) {
            return false;
        }
        return block.timestamp <= metrics[user].lastActivityTimestamp + 90 days;
    }

    /**
     * @notice Get account verification status
     * @param user Address to query
     * @return verified True if account is verified
     */
    function isVerified(address user) external view returns (bool) {
        return metrics[user].isVerified;
    }

    // ============ Batch Functions (for efficiency) ============

    /**
     * @notice Batch record donations for multiple users
     * @param donors Array of donor addresses
     * @param campaignIds Array of campaign IDs (same length as donors)
     */
    function batchRecordDonations(address[] calldata donors, uint256[] calldata campaignIds)
        external
        onlyRole(TRACKER_ROLE)
    {
        require(donors.length == campaignIds.length, "Length mismatch");
        for (uint256 i = 0; i < donors.length; i++) {
            _recordDonation(donors[i], campaignIds[i]);
        }
    }

    /**
     * @notice Internal function to record a donation (for batch operations)
     */
    function _recordDonation(address donor, uint256 campaignId) internal {
        ParticipationMetrics storage m = metrics[donor];

        m.donationCount++;

        if (!hasDonatedToCampaign[donor][campaignId]) {
            hasDonatedToCampaign[donor][campaignId] = true;
            m.uniqueCampaignsDonated++;
        }

        if (m.firstDonationTimestamp == 0) {
            m.firstDonationTimestamp = block.timestamp;
        }

        m.lastDonationTimestamp = block.timestamp;
        m.lastActivityTimestamp = block.timestamp;

        emit DonationRecorded(donor, campaignId, m.donationCount, m.uniqueCampaignsDonated);
    }

    /**
     * @notice Wipe all data for a user (admin only, for GDPR compliance)
     * @param user Address to wipe data for
     */
    function wipeUserData(address user) external onlyRole(ADMIN_ROLE) {
        delete metrics[user];

        // Clean up mappings to free gas
        // Note: We can't iterate to delete all entries, but new operations will overwrite
        emit VerificationUpdated(user, false);
    }
}
