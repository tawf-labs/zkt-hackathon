// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title VotingToken
 * @notice Non-transferable ERC20 token used for community DAO voting
 * @dev Each token = 1 vote. Tokens can only be minted/burned, not transferred.
 * Similar to soulbound tokens but using ERC20 standard for voting weight.
 */
contract VotingToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Track token history for transparency
    mapping(address => uint256) public totalMinted;
    mapping(address => uint256) public totalBurned;
    
    event VotingTokensMinted(address indexed to, uint256 amount, string reason);
    event VotingTokensBurned(address indexed from, uint256 amount, string reason);
    
    constructor() ERC20("ZKT Voting Token", "vZKT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    /**
     * @notice Mint voting tokens to a community member
     * @param to Recipient address
     * @param amount Amount of voting tokens
     * @param reason Reason for minting (e.g., "New member onboarding")
     */
    function mint(address to, uint256 amount, string memory reason) 
        external 
        onlyRole(MINTER_ROLE) 
    {
        require(to != address(0), "VotingToken: Cannot mint to zero address");
        require(amount > 0, "VotingToken: Amount must be > 0");
        
        _mint(to, amount);
        totalMinted[to] += amount;
        
        emit VotingTokensMinted(to, amount, reason);
    }
    
    /**
     * @notice Burn voting tokens (e.g., member removed or violation)
     * @param from Address to burn from
     * @param amount Amount to burn
     * @param reason Reason for burning
     */
    function burn(address from, uint256 amount, string memory reason) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(from != address(0), "VotingToken: Cannot burn from zero address");
        require(balanceOf(from) >= amount, "VotingToken: Insufficient balance");
        
        _burn(from, amount);
        totalBurned[from] += amount;
        
        emit VotingTokensBurned(from, amount, reason);
    }
    
    /**
     * @notice Override transfer to make token non-transferable
     * @dev Only allow minting (from == 0) and burning (to == 0)
     */
    function _update(address from, address to, uint256 value)
        internal
        override
    {
        require(
            from == address(0) || to == address(0),
            "VotingToken: Token is non-transferable (voting power is soulbound)"
        );
        
        super._update(from, to, value);
    }
    
    /**
     * @notice Get voting power (same as balance)
     */
    function getVotingPower(address account) external view returns (uint256) {
        return balanceOf(account);
    }
}
