// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title VotingNFT
 * @notice Non-transferable ERC721 NFT for tiered voting power in ZKT DAO
 * @dev Voting power increases with participation (Tier 1 = 1 vote, Tier 2 = 2 votes, Tier 3 = 3 votes)
 *      This NFT is soulbound - non-transferable to prevent vote buying
 */
contract VotingNFT is ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    uint256 private _tokenIdCounter;

    /// @notice Voting tiers with different voting weights
    enum VotingTier {
        Tier1,  // 1 vote - Basic Donor (1+ donation + verified)
        Tier2,  // 2 votes - Active Participant (3+ campaigns OR 5+ votes OR 30+ days)
        Tier3   // 3 votes - Community Leader (10+ campaigns OR approved proposal)
    }

    /// @notice Participation metrics for each voter (privacy-safe - no amounts tracked)
    struct VoterMetrics {
        uint256 donationsCount;          // Number of campaigns donated to (not amounts)
        uint256 governanceVotes;         // Number of governance votes cast
        uint256 firstDonationTimestamp;  // Platform tenure tracking
        uint256 successfulProposals;     // Number of approved proposals created
        uint256 campaignsParticipated;   // Number of unique campaigns donated to
        bool isVerified;                 // Basic account verification
    }

    /// @notice NFT data combining tier and metrics
    struct VotingNFTData {
        VotingTier tier;
        VoterMetrics metrics;
        string metadataURI;              // IPFS URI with additional metadata
        uint256 mintedAt;                // When NFT was minted
        uint256 lastTierUpgrade;         // Last tier upgrade timestamp
    }

    // Mappings
    mapping(uint256 => VotingNFTData) public tokenData;
    mapping(address => uint256) public voterTokenId; // Each voter can have only one NFT

    // Events
    event VotingNFTMinted(
        uint256 indexed tokenId,
        address indexed voter,
        VotingTier initialTier,
        string metadataURI
    );
    event TierUpgraded(
        uint256 indexed tokenId,
        address indexed voter,
        VotingTier oldTier,
        VotingTier newTier,
        string reason
    );
    event DonationRecorded(
        uint256 indexed tokenId,
        address indexed voter,
        uint256 newDonationCount
    );
    event GovernanceVoteRecorded(
        uint256 indexed tokenId,
        address indexed voter,
        uint256 newVoteCount
    );
    event ProposalRecorded(
        uint256 indexed tokenId,
        address indexed voter,
        bool approved,
        uint256 newSuccessfulCount
    );
    event CampaignParticipationRecorded(
        uint256 indexed tokenId,
        address indexed voter,
        uint256 newCampaignsCount
    );
    event VoterVerified(uint256 indexed tokenId, address indexed voter);

    constructor() ERC721("ZKT Voting NFT", "vZKT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    /**
     * @notice Mint a new Voting NFT to a voter
     * @param to Recipient address
     * @param metadataURI IPFS URI with additional metadata
     * @return tokenId The minted token ID
     */
    function mintVotingNFT(address to, string memory metadataURI)
        external
        onlyRole(MINTER_ROLE)
        returns (uint256)
    {
        require(to != address(0), "Cannot mint to zero address");
        require(voterTokenId[to] == 0, "Voter already has a Voting NFT");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(to, tokenId);

        // Initialize at Tier 1 (not verified until verified flag set)
        tokenData[tokenId] = VotingNFTData({
            tier: VotingTier.Tier1,
            metrics: VoterMetrics({
                donationsCount: 0,
                governanceVotes: 0,
                firstDonationTimestamp: 0,
                successfulProposals: 0,
                campaignsParticipated: 0,
                isVerified: false
            }),
            metadataURI: metadataURI,
            mintedAt: block.timestamp,
            lastTierUpgrade: block.timestamp
        });

        voterTokenId[to] = tokenId;

        if (bytes(metadataURI).length > 0) {
            _setTokenURI(tokenId, metadataURI);
        }

        emit VotingNFTMinted(tokenId, to, VotingTier.Tier1, metadataURI);

        return tokenId;
    }

    /**
     * @notice Upgrade voter's tier based on participation metrics
     * @param voter Address of the voter
     * @param newTier New tier to assign
     * @param reason Reason for tier upgrade
     */
    function upgradeTier(address voter, VotingTier newTier, string memory reason)
        external
        onlyRole(UPGRADER_ROLE)
    {
        uint256 tokenId = voterTokenId[voter];
        require(tokenId != 0, "Voter does not have a Voting NFT");

        VotingTier oldTier = tokenData[tokenId].tier;

        // Only allow upgrading (not downgrading)
        require(newTier >= oldTier, "Cannot downgrade tier");
        require(newTier > oldTier, "Already at this tier or higher");

        tokenData[tokenId].tier = newTier;
        tokenData[tokenId].lastTierUpgrade = block.timestamp;

        emit TierUpgraded(tokenId, voter, oldTier, newTier, reason);
    }

    /**
     * @notice Auto-calculate and upgrade tier based on participation metrics
     * @dev This function can be called by anyone to trigger tier auto-upgrade
     * @param voter Address of the voter
     */
    function autoUpgradeTier(address voter) external returns (bool) {
        uint256 tokenId = voterTokenId[voter];
        require(tokenId != 0, "Voter does not have a Voting NFT");

        VotingTier currentTier = tokenData[tokenId].tier;
        VoterMetrics storage metrics = tokenData[tokenId].metrics;

        // Must be verified for any tier
        if (!metrics.isVerified) {
            return false;
        }

        VotingTier newTier = currentTier;

        // Check for Tier 3 (Community Leader)
        // Requirements: 10+ campaigns OR approved proposal
        if (metrics.campaignsParticipated >= 10 || metrics.successfulProposals >= 1) {
            newTier = VotingTier.Tier3;
        }
        // Check for Tier 2 (Active Participant)
        // Requirements: 3+ campaigns OR 5+ governance votes OR 30+ days tenure
        else if (
            metrics.campaignsParticipated >= 3 ||
            metrics.governanceVotes >= 5 ||
            (block.timestamp >= metrics.firstDonationTimestamp + 30 days)
        ) {
            newTier = VotingTier.Tier2;
        }

        if (newTier > currentTier) {
            tokenData[tokenId].tier = newTier;
            tokenData[tokenId].lastTierUpgrade = block.timestamp;

            emit TierUpgraded(tokenId, voter, currentTier, newTier, "Auto-upgraded based on participation");
            return true;
        }

        return false;
    }

    /**
     * @notice Record a donation (increment donation count)
     * @param voter Address of the donor
     * @param isFirstDonation Whether this is the first donation (sets tenure start)
     */
    function recordDonation(address voter, bool isFirstDonation) external onlyRole(MINTER_ROLE) {
        uint256 tokenId = voterTokenId[voter];
        require(tokenId != 0, "Voter does not have a Voting NFT");

        VoterMetrics storage metrics = tokenData[tokenId].metrics;

        if (isFirstDonation && metrics.firstDonationTimestamp == 0) {
            metrics.firstDonationTimestamp = block.timestamp;
        }

        metrics.donationsCount++;

        emit DonationRecorded(tokenId, voter, metrics.donationsCount);
    }

    /**
     * @notice Record a governance vote
     * @param voter Address of the voter
     */
    function recordGovernanceVote(address voter) external onlyRole(MINTER_ROLE) {
        uint256 tokenId = voterTokenId[voter];
        require(tokenId != 0, "Voter does not have a Voting NFT");

        VoterMetrics storage metrics = tokenData[tokenId].metrics;
        metrics.governanceVotes++;

        emit GovernanceVoteRecorded(tokenId, voter, metrics.governanceVotes);
    }

    /**
     * @notice Record a proposal outcome (used for tier progression)
     * @param voter Address of the proposal creator
     * @param approved Whether the proposal was approved
     */
    function recordProposal(address voter, bool approved) external onlyRole(MINTER_ROLE) {
        uint256 tokenId = voterTokenId[voter];
        require(tokenId != 0, "Voter does not have a Voting NFT");

        if (approved) {
            VoterMetrics storage metrics = tokenData[tokenId].metrics;
            metrics.successfulProposals++;

            emit ProposalRecorded(tokenId, voter, approved, metrics.successfulProposals);
        }
    }

    /**
     * @notice Record campaign participation (unique campaigns donated to)
     * @param voter Address of the donor
     */
    function recordCampaignParticipation(address voter) external onlyRole(MINTER_ROLE) {
        uint256 tokenId = voterTokenId[voter];
        require(tokenId != 0, "Voter does not have a Voting NFT");

        VoterMetrics storage metrics = tokenData[tokenId].metrics;
        metrics.campaignsParticipated++;

        emit CampaignParticipationRecorded(tokenId, voter, metrics.campaignsParticipated);
    }

    /**
     * @notice Mark voter as verified (required for tier progression)
     * @param voter Address to verify
     */
    function verifyVoter(address voter) external onlyRole(ADMIN_ROLE) {
        uint256 tokenId = voterTokenId[voter];
        require(tokenId != 0, "Voter does not have a Voting NFT");

        VoterMetrics storage metrics = tokenData[tokenId].metrics;
        require(!metrics.isVerified, "Voter already verified");

        metrics.isVerified = true;

        emit VoterVerified(tokenId, voter);
    }

    /**
     * @notice Get voting power for an address based on their tier
     * @param voter Address to check
     * @return Voting power (1, 2, or 3 based on tier)
     */
    function getVotingPower(address voter) external view returns (uint256) {
        uint256 tokenId = voterTokenId[voter];
        if (tokenId == 0) {
            return 0;
        }

        VotingTier tier = tokenData[tokenId].tier;

        if (tier == VotingTier.Tier3) {
            return 3;
        } else if (tier == VotingTier.Tier2) {
            return 2;
        } else {
            return 1;
        }
    }

    /**
     * @notice Get voting tier for an address
     * @param voter Address to check
     * @return Current voting tier
     */
    function getTier(address voter) external view returns (VotingTier) {
        uint256 tokenId = voterTokenId[voter];
        if (tokenId == 0) {
            return VotingTier.Tier1; // Default to Tier 1 (no power anyway without NFT)
        }
        return tokenData[tokenId].tier;
    }

    /**
     * @notice Get full participation metrics for a voter
     * @param voter Address to check
     * @return metrics Voter's participation metrics
     */
    function getParticipationMetrics(address voter) external view returns (VoterMetrics memory) {
        uint256 tokenId = voterTokenId[voter];
        if (tokenId == 0) {
            return VoterMetrics({
                donationsCount: 0,
                governanceVotes: 0,
                firstDonationTimestamp: 0,
                successfulProposals: 0,
                campaignsParticipated: 0,
                isVerified: false
            });
        }
        return tokenData[tokenId].metrics;
    }

    /**
     * @notice Get full NFT data for a voter
     * @param voter Address to check
     * @return data Full VotingNFTData including tier and metrics
     */
    function getVotingNFTData(address voter) external view returns (VotingNFTData memory) {
        uint256 tokenId = voterTokenId[voter];
        require(tokenId != 0, "Voter does not have a Voting NFT");
        return tokenData[tokenId];
    }

    /**
     * @notice Check if address has a Voting NFT
     * @param voter Address to check
     * @return True if voter has a Voting NFT
     */
    function hasVotingNFT(address voter) external view returns (bool) {
        return voterTokenId[voter] != 0;
    }

    /**
     * @notice Get token ID for a voter
     * @param voter Address to check
     * @return Token ID or 0 if no NFT
     */
    function getVoterTokenId(address voter) external view returns (uint256) {
        return voterTokenId[voter];
    }

    /**
     * @notice Get total number of Voting NFTs minted
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @notice Check if voter meets minimum requirements for voting
     * @param voter Address to check
     * @return True if voter is verified and has a Voting NFT
     */
    function canVote(address voter) external view returns (bool) {
        uint256 tokenId = voterTokenId[voter];
        if (tokenId == 0) {
            return false;
        }
        return tokenData[tokenId].metrics.isVerified;
    }

    /**
     * @notice Override transfer functions to make token non-transferable (soulbound)
     * @dev Only allow minting (from == address(0)) and burning (to == address(0))
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0)) and burning (to == address(0))
        require(
            from == address(0) || to == address(0),
            "VotingNFT: Non-transferable (voting power is soulbound)"
        );

        // Update voter mapping on burn
        if (to == address(0)) {
            address owner = tokenData[tokenId].metrics.isVerified ? from : from;
            delete voterTokenId[owner];
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Required override for AccessControl + ERC721
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
