// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;
import "forge-std/Script.sol";
import "../src/tokens/MockIDRX.sol";
import "../src/tokens/DonationReceiptNFT.sol";
import "../src/tokens/VotingToken.sol";
import "../src/DAO/ZKTCore.sol";

/**
 * @title DeployZKTDAO
 * @notice Deployment script for ZKT Community DAO system on Base Sepolia
 * @dev Run with: forge script script/DeployDAO.s.sol:DeployDAO --rpc-url base_sepolia --broadcast --verify
 */
contract DeployZKT is Script {
    // Deployment addresses (will be set after deployment)
    MockIDRX public idrxToken;
    DonationReceiptNFT public receiptNFT;
    VotingToken public votingToken;
    ZKTCore public dao;
    
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy MockIDRX token
        console.log("\n1. Deploying MockIDRX token...");
        idrxToken = new MockIDRX();
        console.log("MockIDRX deployed at:", address(idrxToken));
        
        // 2. Deploy DonationReceiptNFT
        console.log("\n2. Deploying DonationReceiptNFT...");
        receiptNFT = new DonationReceiptNFT();
        console.log("DonationReceiptNFT deployed at:", address(receiptNFT));
        
        // 3. Deploy VotingToken
        console.log("\n3. Deploying VotingToken...");
        votingToken = new VotingToken();
        console.log("VotingToken deployed at:", address(votingToken));
        
        // 4. Deploy ZKTCore
        console.log("\n4. Deploying ZKTCore (orchestrator + all managers)...");
        dao = new ZKTCore(address(idrxToken), address(receiptNFT), address(votingToken));
        console.log("ZKTCore deployed at:", address(dao));
        console.log("ProposalManager deployed at:", dao.getProposalManagerAddress());
        console.log("VotingManager deployed at:", dao.getVotingManagerAddress());
        console.log("ShariaReviewManager deployed at:", dao.getShariaReviewManagerAddress());
        console.log("PoolManager deployed at:", dao.getPoolManagerAddress());
        
        // 5. Grant MINTER_ROLE to PoolManager for DonationReceiptNFT
        console.log("\n5. Granting MINTER_ROLE to PoolManager...");
        receiptNFT.grantRole(receiptNFT.MINTER_ROLE(), dao.getPoolManagerAddress());
        console.log("MINTER_ROLE granted to PoolManager");
        
        // 6. Grant MINTER_ROLE to DAO in VotingToken
        console.log("\n6. Granting MINTER_ROLE to DAO for VotingToken...");
        votingToken.grantRole(votingToken.MINTER_ROLE(), address(dao));
        console.log("MINTER_ROLE granted to DAO");
        
        // 7. Setup initial roles for deployer (for testing)
        // Note: Deployer has DEFAULT_ADMIN_ROLE for initial setup only
        // After configuration, consider renouncing DEFAULT_ADMIN_ROLE for full decentralization
        console.log("\n7. Setting up initial roles...");
        dao.grantOrganizerRole(deployer);
        dao.grantShariaCouncilRole(deployer);
        dao.grantKYCOracleRole(deployer);
        console.log("Initial roles granted to deployer (ORGANIZER, SHARIA_COUNCIL, KYC_ORACLE)");
        
        // 8. Grant initial voting power to deployer (for testing)
        console.log("\n8. Granting initial voting power...");
        dao.grantVotingPower(deployer, 1000 * 10**18); // 1000 voting tokens
        console.log("Granted 1000 voting tokens to deployer");
        
        vm.stopBroadcast();
        
        // Print deployment summary
        console.log("\n====== DEPLOYMENT SUMMARY ======");
        console.log("Network: Base Sepolia");
        console.log("Deployer:", deployer);
        console.log("\nToken Contract Addresses:");
        console.log("MockIDRX:", address(idrxToken));
        console.log("DonationReceiptNFT:", address(receiptNFT));
        console.log("VotingToken:", address(votingToken));
        console.log("\nDAO Contract Addresses:");
        console.log("ZKTCore (Orchestrator):", address(dao));
        console.log("ProposalManager:", dao.getProposalManagerAddress());
        console.log("VotingManager:", dao.getVotingManagerAddress());
        console.log("ShariaReviewManager:", dao.getShariaReviewManagerAddress());
        console.log("PoolManager:", dao.getPoolManagerAddress());
        console.log("\nConfiguration:");
        console.log("Deployer has ORGANIZER, SHARIA_COUNCIL, and KYC_ORACLE roles");
        console.log("Deployer has 1000 voting tokens");
        console.log("Deployer has DEFAULT_ADMIN_ROLE for initial setup");
        console.log("\nNext Steps:");
        console.log("1. Verify contracts on Basescan");
        console.log("2. Grant organizer roles: dao.grantOrganizerRole(address)");
        console.log("3. Grant voting power: dao.grantVotingPower(address, amount)");
        console.log("4. Grant Sharia council roles: dao.grantShariaCouncilRole(address)");
        console.log("5. Test the IDRX faucet: cast send", address(idrxToken), "\"faucet()\" --rpc-url base_sepolia --private-key $PRIVATE_KEY");
        console.log("6. [OPTIONAL] Renounce DEFAULT_ADMIN_ROLE for full decentralization");
        console.log("\nArchitecture Notes:");
        console.log("- Fully decentralized: No ADMIN_ROLE, only DEFAULT_ADMIN_ROLE for initial setup");
        console.log("- Pool creation: Organizer-only (no admin needed after Sharia approval)");
        console.log("- One non-transferable receipt NFT minted per donation (not per pool)");
        console.log("- VotingToken (non-transferable ERC20) used for community voting");
        console.log("- Modular design: ProposalManager, VotingManager, ShariaReviewManager, PoolManager");
        console.log("================================\n");
    }
}
