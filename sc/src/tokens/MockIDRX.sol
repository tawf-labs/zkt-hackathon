// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MockIDRX
 * @notice Mock Indonesian Rupiah (IDRX) token for testnet use
 * @dev ERC20 token with faucet functionality and admin minting
 * This is a testnet-only token. Production version should integrate with real IDRX stablecoin.
 */
contract MockIDRX is ERC20, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Faucet configuration
    uint256 public constant FAUCET_AMOUNT = 1000 * 10**18; // 1000 IDRX per claim
    uint256 public constant FAUCET_COOLDOWN = 24 hours;
    
    // Track last faucet claim per address
    mapping(address => uint256) public lastFaucetClaim;
    
    // Events
    event FaucetClaimed(address indexed user, uint256 amount, uint256 nextClaimTime);
    event AdminMinted(address indexed to, uint256 amount, address indexed admin);
    
    constructor() ERC20("Mock Indonesian Rupiah", "IDRX") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        // Mint initial supply to deployer for testing
        _mint(msg.sender, 1_000_000 * 10**18); // 1M IDRX
    }
    
    /**
     * @notice Claim free IDRX tokens from faucet (testnet only)
     * @dev Users can claim once every 24 hours
     */
    function faucet() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "MockIDRX: Faucet cooldown not expired"
        );
        
        lastFaucetClaim[msg.sender] = block.timestamp;
        uint256 nextClaimTime = block.timestamp + FAUCET_COOLDOWN;
        
        _mint(msg.sender, FAUCET_AMOUNT);
        
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT, nextClaimTime);
    }
    
    /**
     * @notice Admin can mint tokens to any address
     * @param to Recipient address
     * @param amount Amount to mint (in wei, 18 decimals)
     */
    function adminMint(address to, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(to != address(0), "MockIDRX: Cannot mint to zero address");
        require(amount > 0, "MockIDRX: Amount must be greater than 0");
        
        _mint(to, amount);
        
        emit AdminMinted(to, amount, msg.sender);
    }
    
    /**
     * @notice Check time remaining until user can claim faucet again
     * @param user Address to check
     * @return timeRemaining Seconds until next claim (0 if can claim now)
     */
    function timeUntilNextClaim(address user) external view returns (uint256) {
        uint256 nextClaimTime = lastFaucetClaim[user] + FAUCET_COOLDOWN;
        if (block.timestamp >= nextClaimTime) {
            return 0;
        }
        return nextClaimTime - block.timestamp;
    }
    
    /**
     * @notice Check if user can claim from faucet
     * @param user Address to check
     * @return canClaim True if user can claim now
     */
    function canClaimFaucet(address user) external view returns (bool) {
        return block.timestamp >= lastFaucetClaim[user] + FAUCET_COOLDOWN;
    }
}
