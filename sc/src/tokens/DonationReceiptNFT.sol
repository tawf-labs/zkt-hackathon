// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title DonationReceiptNFT
 * @notice Non-transferable NFT for ZKT donation receipts
 * @dev Each donation mints a new NFT as an immutable receipt
 * One NFT = One donation transaction proof (soulbound to donor)
 */
contract DonationReceiptNFT is ERC721URIStorage, AccessControl {
    using Strings for uint256;
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    uint256 private _tokenIdCounter;
    
    // Token metadata (immutable after minting)
    struct SBTMetadata {
        uint256 poolId;
        address donor;
        uint256 donationAmount;
        uint256 donatedAt;
        string campaignTitle;
        string campaignType; // "Zakat" or "Normal"
        string ipfsCID; // IPFS CID for full receipt metadata (reports, images, etc.)
        bool isActive;
    }
    
    // Mappings
    mapping(uint256 => SBTMetadata) public tokenMetadata;
    mapping(address => uint256[]) public donorTokens; // donor => array of tokenIds
    
    // Events
    event SBTMinted(
        uint256 indexed tokenId,
        address indexed donor,
        uint256 indexed poolId,
        uint256 amount,
        string campaignType
    );
    event SBTBurned(uint256 indexed tokenId, address indexed donor, string reason);
    
    constructor() ERC721("ZKT Donation Receipt", "ZKT-RECEIPT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    /**
     * @notice Mint a new SBT receipt for each donation
     * @param to Donor address
     * @param poolId Campaign pool ID
     * @param amount Donation amount
     * @param campaignTitle Campaign name
     * @param campaignType "Zakat" or "Normal"
     * @param ipfsCID IPFS CID containing full receipt metadata (uploaded via Pinata)
     * @return tokenId The minted token ID
     */
    function mint(
        address to,
        uint256 poolId,
        uint256 amount,
        string memory campaignTitle,
        string memory campaignType,
        string memory ipfsCID
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(to != address(0), "DonationReceiptNFT: Cannot mint to zero address");
        require(amount > 0, "DonationReceiptNFT: Amount must be greater than 0");
        
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        _safeMint(to, tokenId);
        
        // Store immutable metadata
        tokenMetadata[tokenId] = SBTMetadata({
            poolId: poolId,
            donor: to,
            donationAmount: amount,
            donatedAt: block.timestamp,
            campaignTitle: campaignTitle,
            campaignType: campaignType,
            ipfsCID: ipfsCID,
            isActive: true
        });
        
        // Track donor's receipts
        donorTokens[to].push(tokenId);
        
        // Set token URI to IPFS (Pinata-hosted metadata)
        if (bytes(ipfsCID).length > 0) {
            string memory uri = string(abi.encodePacked("ipfs://", ipfsCID));
            _setTokenURI(tokenId, uri);
        }
        
        emit SBTMinted(tokenId, to, poolId, amount, campaignType);
        
        return tokenId;
    }
    
    /**
     * @notice Burn SBT (admin only, e.g., fraudulent donation refunded)
     * @param tokenId Token ID to burn
     * @param reason Reason for burning
     */
    function burn(uint256 tokenId, string memory reason) external onlyRole(ADMIN_ROLE) {
        require(_ownerOf(tokenId) != address(0), "DonationReceiptNFT: Token does not exist");
        
        address donor = tokenMetadata[tokenId].donor;
        tokenMetadata[tokenId].isActive = false;
        
        _burn(tokenId);
        
        emit SBTBurned(tokenId, donor, reason);
    }
    
    /**
     * @notice Generate on-chain JSON metadata for donation receipt (DEPRECATED: Use IPFS)
     * @dev Kept for fallback if IPFS CID is not provided
     * @param tokenId Token ID
     * @return Base64-encoded JSON metadata URI
     */
    function _generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        SBTMetadata memory meta = tokenMetadata[tokenId];
        
        bytes memory json = abi.encodePacked(
            '{"name": "ZKT Donation Receipt #',
            tokenId.toString(),
            '", "description": "Immutable proof of donation to campaign: ',
            meta.campaignTitle,
            '", "image": "ipfs://QmZKTReceiptBadge", "attributes": [',
            '{"trait_type": "Campaign Title", "value": "',
            meta.campaignTitle,
            '"}, {"trait_type": "Pool ID", "value": "',
            meta.poolId.toString(),
            '"}, {"trait_type": "Campaign Type", "value": "',
            meta.campaignType,
            '"}, {"trait_type": "Donation Amount", "value": "',
            meta.donationAmount.toString(),
            ' IDRX"}, {"trait_type": "Donated At", "value": "',
            meta.donatedAt.toString(),
            '"}, {"trait_type": "Status", "value": "',
            meta.isActive ? "Active" : "Burned",
            '"}], "external_url": "https://zkt.app/receipts/',
            tokenId.toString(),
            '"}'
        );
        
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(json)
            )
        );
    }
    
    /**
     * @notice Get all donation receipts for a donor
     * @param donor Donor address
     * @return Array of token IDs
     */
    function getDonorReceipts(address donor) external view returns (uint256[] memory) {
        return donorTokens[donor];
    }
    
    /**
     * @notice Get total donations count for a donor
     */
    function getDonorReceiptCount(address donor) external view returns (uint256) {
        return donorTokens[donor].length;
    }
    
    /**
     * @notice Override transfer functions to make token non-transferable (soulbound)
     * @dev Only allow transfers during minting (from address(0)) and burning (to address(0))
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
            "DonationReceiptNFT: Non-transferable receipt"
        );
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @notice Get total number of SBTs minted
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
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
