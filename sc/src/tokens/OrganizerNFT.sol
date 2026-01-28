// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title OrganizerNFT
 * @notice Non-transferable ERC721 NFT for KYC'd organizers in ZKT DAO
 * @dev This NFT grants proposal creation rights, NOT voting power
 *      Organizers must earn vZKT through participation to vote
 *      Soulbound NFT - non-transferable to prevent organizer market
 */
contract OrganizerNFT is ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");

    uint256 private _tokenIdCounter;

    /// @notice KYC verification status for organizers
    enum OrganizerKYCStatus {
        NotRequired,     // Emergency campaigns may not require KYC
        Pending,         // KYC verification in progress
        Verified,        // KYC verified and approved
        Rejected,        // KYC rejected
        Suspended        // Temporarily suspended (e.g., pending re-verification)
    }

    /// @notice Organizer profile data
    struct OrganizerProfile {
        string organizationName;
        string description;
        string website;
        string contactEmail;
        string metadataURI;          // IPFS with org details, documents, images
    }

    /// @notice Organizer NFT data
    struct OrganizerNFTData {
        OrganizerProfile profile;
        OrganizerKYCStatus kycStatus;
        uint256 approvedAt;           // When organizer status was granted
        uint256 campaignsCreated;     // Track organizer activity
        uint256 campaignsCompleted;   // Successful campaigns (fully funded + milestones complete)
        uint256 totalFundsReceived;   // Total IDRX received across all campaigns
        string kycNotes;              // Notes from KYC oracle
        uint256 lastUpdated;          // Last profile update timestamp
        bool isActive;                // Can create new proposals
    }

    // Mappings
    mapping(uint256 => OrganizerNFTData) public organizerData;
    mapping(address => uint256) public organizerTokenId; // Each address can have only one Organizer NFT

    // Events
    event OrganizerNFTMinted(
        uint256 indexed tokenId,
        address indexed organizer,
        string organizationName,
        OrganizerKYCStatus initialStatus
    );
    event OrganizerKYCUpdated(
        uint256 indexed tokenId,
        address indexed organizer,
        OrganizerKYCStatus oldStatus,
        OrganizerKYCStatus newStatus,
        string notes
    );
    event OrganizerStatsUpdated(
        uint256 indexed tokenId,
        address indexed organizer,
        uint256 campaignsCreated,
        uint256 campaignsCompleted
    );
    event OrganizerProfileUpdated(
        uint256 indexed tokenId,
        address indexed organizer,
        string metadataURI
    );
    event OrganizerSuspended(uint256 indexed tokenId, address indexed organizer, string reason);
    event OrganizerReactivated(uint256 indexed tokenId, address indexed organizer);
    event FundsReceivedUpdated(uint256 indexed tokenId, uint256 amount);

    constructor() ERC721("ZKT Organizer NFT", "oZKT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPDATER_ROLE, msg.sender);
    }

    /**
     * @notice Mint a new Organizer NFT (called after organizer approval)
     * @param to Organizer address
     * @param organizationName Name of the organization
     * @param description Description of the organization
     * @param metadataURI IPFS URI with full org details
     * @return tokenId The minted token ID
     */
    function mintOrganizerNFT(
        address to,
        string memory organizationName,
        string memory description,
        string memory metadataURI
    )
        external
        onlyRole(MINTER_ROLE)
        returns (uint256)
    {
        require(to != address(0), "Cannot mint to zero address");
        require(organizerTokenId[to] == 0, "Organizer already has an Organizer NFT");
        require(bytes(organizationName).length > 0, "Organization name required");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(to, tokenId);

        // Initialize organizer data
        organizerData[tokenId] = OrganizerNFTData({
            profile: OrganizerProfile({
                organizationName: organizationName,
                description: description,
                website: "",
                contactEmail: "",
                metadataURI: metadataURI
            }),
            kycStatus: OrganizerKYCStatus.Pending,
            approvedAt: block.timestamp,
            campaignsCreated: 0,
            campaignsCompleted: 0,
            totalFundsReceived: 0,
            kycNotes: "Organizer NFT minted - KYC pending",
            lastUpdated: block.timestamp,
            isActive: true
        });

        organizerTokenId[to] = tokenId;

        if (bytes(metadataURI).length > 0) {
            _setTokenURI(tokenId, metadataURI);
        }

        emit OrganizerNFTMinted(tokenId, to, organizationName, OrganizerKYCStatus.Pending);

        return tokenId;
    }

    /**
     * @notice Update organizer KYC status (called by KYC Oracle or Admin)
     * @param organizer Address of the organizer
     * @param newStatus New KYC status
     * @param notes Notes about the status change
     */
    function updateOrganizerKYC(
        address organizer,
        OrganizerKYCStatus newStatus,
        string memory notes
    )
        external
        onlyRole(ADMIN_ROLE)
    {
        uint256 tokenId = organizerTokenId[organizer];
        require(tokenId != 0, "Organizer does not have an Organizer NFT");

        OrganizerKYCStatus oldStatus = organizerData[tokenId].kycStatus;
        organizerData[tokenId].kycStatus = newStatus;
        organizerData[tokenId].kycNotes = notes;
        organizerData[tokenId].lastUpdated = block.timestamp;

        // Auto-activate on verified, deactivate on rejected/suspended
        if (newStatus == OrganizerKYCStatus.Verified) {
            organizerData[tokenId].isActive = true;
        } else if (newStatus == OrganizerKYCStatus.Rejected || newStatus == OrganizerKYCStatus.Suspended) {
            organizerData[tokenId].isActive = false;
        }

        emit OrganizerKYCUpdated(tokenId, organizer, oldStatus, newStatus, notes);

        if (newStatus == OrganizerKYCStatus.Suspended) {
            emit OrganizerSuspended(tokenId, organizer, notes);
        } else if (oldStatus == OrganizerKYCStatus.Suspended && newStatus == OrganizerKYCStatus.Verified) {
            emit OrganizerReactivated(tokenId, organizer);
        }
    }

    /**
     * @notice Update organizer stats after campaign events
     * @param organizer Address of the organizer
     * @param campaignsCreatedDelta Change in campaigns created (usually +1)
     * @param campaignsCompletedDelta Change in campaigns completed
     */
    function updateOrganizerStats(
        address organizer,
        int256 campaignsCreatedDelta,
        int256 campaignsCompletedDelta
    )
        external
        onlyRole(UPDATER_ROLE)
    {
        uint256 tokenId = organizerTokenId[organizer];
        require(tokenId != 0, "Organizer does not have an Organizer NFT");

        OrganizerNFTData storage data = organizerData[tokenId];

        // Update with overflow checks
        if (campaignsCreatedDelta > 0) {
            data.campaignsCreated += uint256(campaignsCreatedDelta);
        } else if (campaignsCreatedDelta < 0) {
            uint256 decrease = uint256(-campaignsCreatedDelta);
            if (data.campaignsCreated >= decrease) {
                data.campaignsCreated -= decrease;
            }
        }

        if (campaignsCompletedDelta > 0) {
            data.campaignsCompleted += uint256(campaignsCompletedDelta);
        } else if (campaignsCompletedDelta < 0) {
            uint256 decrease = uint256(-campaignsCompletedDelta);
            if (data.campaignsCompleted >= decrease) {
                data.campaignsCompleted -= decrease;
            }
        }

        emit OrganizerStatsUpdated(tokenId, organizer, data.campaignsCreated, data.campaignsCompleted);
    }

    /**
     * @notice Record funds received by organizer (for reputation tracking)
     * @param organizer Address of the organizer
     * @param amount Amount of IDRX received
     */
    function recordFundsReceived(address organizer, uint256 amount)
        external
        onlyRole(UPDATER_ROLE)
    {
        uint256 tokenId = organizerTokenId[organizer];
        require(tokenId != 0, "Organizer does not have an Organizer NFT");

        organizerData[tokenId].totalFundsReceived += amount;
        organizerData[tokenId].lastUpdated = block.timestamp;

        emit FundsReceivedUpdated(tokenId, amount);
    }

    /**
     * @notice Update organizer profile metadata
     * @param organizer Address of the organizer
     * @param metadataURI New IPFS URI
     */
    function updateOrganizerProfile(address organizer, string memory metadataURI)
        external
        onlyRole(ADMIN_ROLE)
    {
        uint256 tokenId = organizerTokenId[organizer];
        require(tokenId != 0, "Organizer does not have an Organizer NFT");

        organizerData[tokenId].profile.metadataURI = metadataURI;
        organizerData[tokenId].lastUpdated = block.timestamp;

        if (bytes(metadataURI).length > 0) {
            _setTokenURI(tokenId, metadataURI);
        }

        emit OrganizerProfileUpdated(tokenId, organizer, metadataURI);
    }

    /**
     * @notice Check if address is a verified organizer
     * @param organizer Address to check
     * @return True if organizer is verified and active
     */
    function isVerifiedOrganizer(address organizer) external view returns (bool) {
        uint256 tokenId = organizerTokenId[organizer];
        if (tokenId == 0) {
            return false;
        }
        return
            organizerData[tokenId].kycStatus == OrganizerKYCStatus.Verified &&
            organizerData[tokenId].isActive;
    }

    /**
     * @notice Get organizer data
     * @param organizer Address to check
     * @return data Full organizer NFT data
     */
    function getOrganizerData(address organizer) external view returns (OrganizerNFTData memory) {
        uint256 tokenId = organizerTokenId[organizer];
        require(tokenId != 0, "Organizer does not have an Organizer NFT");
        return organizerData[tokenId];
    }

    /**
     * @notice Get organizer profile
     * @param organizer Address to check
     * @return profile Organizer profile data
     */
    function getOrganizerProfile(address organizer) external view returns (OrganizerProfile memory) {
        uint256 tokenId = organizerTokenId[organizer];
        require(tokenId != 0, "Organizer does not have an Organizer NFT");
        return organizerData[tokenId].profile;
    }

    /**
     * @notice Get organizer KYC status
     * @param organizer Address to check
     * @return status Current KYC status
     */
    function getOrganizerKYCStatus(address organizer) external view returns (OrganizerKYCStatus) {
        uint256 tokenId = organizerTokenId[organizer];
        if (tokenId == 0) {
            return OrganizerKYCStatus.NotRequired;
        }
        return organizerData[tokenId].kycStatus;
    }

    /**
     * @notice Check if address can create proposals
     * @param organizer Address to check
     * @return True if organizer is verified and active
     */
    function canCreateProposals(address organizer) external view returns (bool) {
        uint256 tokenId = organizerTokenId[organizer];
        if (tokenId == 0) {
            return false;
        }
        return
            organizerData[tokenId].kycStatus == OrganizerKYCStatus.Verified &&
            organizerData[tokenId].isActive;
    }

    /**
     * @notice Get token ID for an organizer
     * @param organizer Address to check
     * @return Token ID or 0 if no NFT
     */
    function getOrganizerTokenId(address organizer) external view returns (uint256) {
        return organizerTokenId[organizer];
    }

    /**
     * @notice Check if address has an Organizer NFT
     * @param organizer Address to check
     * @return True if organizer has an Organizer NFT
     */
    function hasOrganizerNFT(address organizer) external view returns (bool) {
        return organizerTokenId[organizer] != 0;
    }

    /**
     * @notice Get total number of Organizer NFTs minted
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @notice Suspend an organizer (admin only)
     * @param organizer Address to suspend
     * @param reason Reason for suspension
     */
    function suspendOrganizer(address organizer, string memory reason)
        external
        onlyRole(ADMIN_ROLE)
    {
        uint256 tokenId = organizerTokenId[organizer];
        require(tokenId != 0, "Organizer does not have an Organizer NFT");

        organizerData[tokenId].isActive = false;
        organizerData[tokenId].kycStatus = OrganizerKYCStatus.Suspended;
        organizerData[tokenId].kycNotes = reason;
        organizerData[tokenId].lastUpdated = block.timestamp;

        emit OrganizerSuspended(tokenId, organizer, reason);
    }

    /**
     * @notice Reactivate a suspended organizer
     * @param organizer Address to reactivate
     */
    function reactivateOrganizer(address organizer)
        external
        onlyRole(ADMIN_ROLE)
    {
        uint256 tokenId = organizerTokenId[organizer];
        require(tokenId != 0, "Organizer does not have an Organizer NFT");
        require(
            organizerData[tokenId].kycStatus == OrganizerKYCStatus.Suspended,
            "Organizer not suspended"
        );

        organizerData[tokenId].isActive = true;
        organizerData[tokenId].kycStatus = OrganizerKYCStatus.Verified;
        organizerData[tokenId].lastUpdated = block.timestamp;

        emit OrganizerReactivated(tokenId, organizer);
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
            "OrganizerNFT: Non-transferable (organizer status is soulbound)"
        );

        // Update organizer mapping on burn
        if (to == address(0)) {
            delete organizerTokenId[from];
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
