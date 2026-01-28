// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;
import "forge-std/Script.sol";
import "../src/tokens/MockIDRX.sol";
import "../src/tokens/DonationReceiptNFT.sol";
import "../src/tokens/VotingNFT.sol";
import "../src/tokens/OrganizerNFT.sol";
import "../src/DAO/ZKTCore.sol";
import "../src/DAO/core/ProposalManager.sol";
import "../src/DAO/core/VotingManager.sol";
import "../src/DAO/core/ShariaReviewManager.sol";
import "../src/DAO/core/PoolManager.sol";
import "../src/DAO/core/ZakatEscrowManager.sol";
import "../src/DAO/core/MilestoneManager.sol";
import "../src/DAO/core/ParticipationTracker.sol";
import "../src/DAO/verifiers/Groth16Verifier.sol";

/**
 * @title DeployZKTDAO
 * @notice Deployment script for ZKT Community DAO system on Base Sepolia
 * @dev Run with: forge script script/DeployZKT.s.sol --rpc-url <rpc> --broadcast --verify
 */
contract DeployZKT is Script {
    // Deployment addresses
    MockIDRX public idrxToken;
    DonationReceiptNFT public receiptNFT;
    VotingNFT public votingNFT;
    OrganizerNFT public organizerNFT;
    ParticipationTracker public participationTracker;
    Groth16Verifier public groth16Verifier;

    ProposalManager public proposalManager;
    VotingManager public votingManager;
    ShariaReviewManager public shariaReviewManager;
    PoolManager public poolManager;
    ZakatEscrowManager public zakatEscrowManager;
    MilestoneManager public milestoneManager;

    ZKTCore public dao;

    // Example fallback pool address
    address public exampleFallbackPool;

    function run() external {
        address deployer = msg.sender;

        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast();

        // 1. Deploy Tokens
        console.log("\n1. Deploying tokens...");
        idrxToken = new MockIDRX();
        receiptNFT = new DonationReceiptNFT();
        votingNFT = new VotingNFT();
        organizerNFT = new OrganizerNFT();
        participationTracker = new ParticipationTracker();
        console.log("Tokens deployed.");

        // 1.5. Deploy ZK Verifier
        console.log("\n1.5. Deploying ZK verifier...");
        groth16Verifier = new Groth16Verifier();
        console.log("Groth16Verifier deployed at:", address(groth16Verifier));

        // 2. Deploy Managers (Dependency Order)
        console.log("\n2. Deploying core managers...");

        proposalManager = new ProposalManager();
        console.log("ProposalManager deployed at:", address(proposalManager));

        votingManager = new VotingManager(
            address(proposalManager),
            address(votingNFT)
        );
        console.log("VotingManager deployed at:", address(votingManager));

        shariaReviewManager = new ShariaReviewManager(
            address(proposalManager),
            address(groth16Verifier)
        );
        console.log(
            "ShariaReviewManager deployed at:",
            address(shariaReviewManager)
        );

        poolManager = new PoolManager(
            address(proposalManager),
            address(idrxToken),
            address(receiptNFT)
        );
        console.log("PoolManager deployed at:", address(poolManager));

        zakatEscrowManager = new ZakatEscrowManager(
            address(proposalManager),
            address(idrxToken),
            address(receiptNFT)
        );
        console.log(
            "ZakatEscrowManager deployed at:",
            address(zakatEscrowManager)
        );

        milestoneManager = new MilestoneManager(
            address(proposalManager),
            address(votingNFT)
        );
        console.log("MilestoneManager deployed at:", address(milestoneManager));

        // 3. Deploy ZKTCore (Orchestrator)
        console.log("\n3. Deploying ZKTCore orchestrator...");
        dao = new ZKTCore(
            address(idrxToken),
            address(receiptNFT),
            address(votingNFT),
            address(organizerNFT),
            address(participationTracker),
            address(proposalManager),
            address(votingManager),
            address(shariaReviewManager),
            address(poolManager),
            address(zakatEscrowManager),
            address(milestoneManager)
        );
        console.log("ZKTCore deployed at:", address(dao));

        // 4. Link Modules and Permissions
        // We need to grant ZKTCore the necessary roles on each manager,
        // and link managers to each other where needed.
        console.log("\n4. Wiring up permissions and cross-module roles...");

        // ZKTCore permissions on ProposalManager
        proposalManager.grantRole(
            proposalManager.ORGANIZER_ROLE(),
            address(dao)
        );
        proposalManager.grantRole(
            proposalManager.KYC_ORACLE_ROLE(),
            address(dao)
        );
        proposalManager.grantRole(proposalManager.ADMIN_ROLE(), address(dao)); // To allow setVotingPeriod etc.

        // ZKTCore permissions on other managers
        votingManager.grantRole(dao.DEFAULT_ADMIN_ROLE(), address(dao));
        shariaReviewManager.grantRole(
            shariaReviewManager.SHARIA_COUNCIL_ROLE(),
            address(dao)
        );
        shariaReviewManager.grantRole(dao.DEFAULT_ADMIN_ROLE(), address(dao));

        poolManager.grantRole(poolManager.ADMIN_ROLE(), address(dao));
        poolManager.grantRole(dao.DEFAULT_ADMIN_ROLE(), address(dao));

        zakatEscrowManager.grantRole(
            zakatEscrowManager.ADMIN_ROLE(),
            address(dao)
        );
        zakatEscrowManager.grantRole(
            zakatEscrowManager.SHARIA_COUNCIL_ROLE(),
            address(dao)
        );
        zakatEscrowManager.grantRole(dao.DEFAULT_ADMIN_ROLE(), address(dao));

        milestoneManager.grantRole(
            milestoneManager.ORGANIZER_ROLE(),
            address(dao)
        );
        milestoneManager.grantRole(dao.DEFAULT_ADMIN_ROLE(), address(dao));

        // Cross-module permissions on ProposalManager
        proposalManager.grantRole(
            proposalManager.VOTING_MANAGER_ROLE(),
            address(votingManager)
        );
        proposalManager.grantRole(
            proposalManager.VOTING_MANAGER_ROLE(),
            address(shariaReviewManager)
        );
        proposalManager.grantRole(
            proposalManager.VOTING_MANAGER_ROLE(),
            address(poolManager)
        );
        proposalManager.grantRole(
            proposalManager.VOTING_MANAGER_ROLE(),
            address(zakatEscrowManager)
        );
        proposalManager.grantRole(
            proposalManager.MILESTONE_MANAGER_ROLE(),
            address(milestoneManager)
        );
        proposalManager.grantRole(
            proposalManager.MILESTONE_MANAGER_ROLE(),
            address(poolManager)
        );

        // Token minting permissions
        receiptNFT.grantRole(receiptNFT.MINTER_ROLE(), address(poolManager));
        receiptNFT.grantRole(
            receiptNFT.MINTER_ROLE(),
            address(zakatEscrowManager)
        );
        votingNFT.grantRole(votingNFT.MINTER_ROLE(), address(dao));
        votingNFT.grantRole(votingNFT.ADMIN_ROLE(), address(dao));
        votingNFT.grantRole(votingNFT.UPGRADER_ROLE(), address(dao));
        participationTracker.grantRole(participationTracker.TRACKER_ROLE(), address(dao));
        participationTracker.grantRole(participationTracker.VERIFIER_ROLE(), address(dao));

        // 5. Initial setup
        console.log("\n5. Performing initial configuration...");
        dao.grantOrganizerRole(deployer);
        dao.grantShariaCouncilRole(deployer);
        dao.grantKYCOracleRole(deployer);

        // Grant initial voting NFT to deployer
        dao.grantVotingNFT(deployer, "ipfs://deployer-voting-nft");
        dao.verifyVoter(deployer);

        // Setup default fallback pool
        exampleFallbackPool = deployer;
        dao.setDefaultFallbackPool(exampleFallbackPool);

        console.log("Deployment and configuration complete.");

        vm.stopBroadcast();
    }
}
