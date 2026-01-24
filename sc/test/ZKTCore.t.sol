// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;
import "forge-std/Test.sol";
import "../src/tokens/MockIDRX.sol";
import "../src/tokens/DonationReceiptNFT.sol";
import "../src/tokens/VotingToken.sol";
import "../src/DAO/ZKTCore.sol";
import "../src/DAO/interfaces/IProposalManager.sol";
import "../src/DAO/core/PoolManager.sol";

contract ZKTCoreTest is Test {
    MockIDRX public idrxToken;
    DonationReceiptNFT public receiptNFT;
    VotingToken public votingToken;
    ZKTCore public dao;
    
    address public deployer = address(this);
    address public organizer = address(0x1);
    address public member1 = address(0x2);
    address public member2 = address(0x3);
    address public member3 = address(0x4);
    address public shariaCouncil1 = address(0x5);
    address public shariaCouncil2 = address(0x6);
    address public shariaCouncil3 = address(0x7);
    address public donor1 = address(0x8);
    address public donor2 = address(0x9);
    
    function setUp() public {
        // Deploy contracts
        idrxToken = new MockIDRX();
        receiptNFT = new DonationReceiptNFT();
        votingToken = new VotingToken();
        dao = new ZKTCore(address(idrxToken), address(receiptNFT), address(votingToken));
        
        // Grant MINTER_ROLE to PoolManager
        receiptNFT.grantRole(receiptNFT.MINTER_ROLE(), dao.getPoolManagerAddress());
        
        // Grant MINTER_ROLE to DAO for VotingToken
        votingToken.grantRole(votingToken.MINTER_ROLE(), address(dao));
        
        // Setup roles (no ADMIN_ROLE - fully decentralized)
        dao.grantOrganizerRole(organizer);
        dao.grantShariaCouncilRole(shariaCouncil1);
        dao.grantShariaCouncilRole(shariaCouncil2);
        dao.grantShariaCouncilRole(shariaCouncil3);
        dao.grantKYCOracleRole(deployer);  // Grant deployer KYC oracle role for tests
        
        // Grant voting power (1 token = 1 vote)
        dao.grantVotingPower(member1, 100 * 10**18);
        dao.grantVotingPower(member2, 100 * 10**18);
        dao.grantVotingPower(member3, 100 * 10**18);
        
        // Give IDRX to donors
        idrxToken.adminMint(donor1, 10000 * 10**18);
        idrxToken.adminMint(donor2, 10000 * 10**18);
    }
    
    function testCreateProposal() public {
        vm.startPrank(organizer);
        
        string[] memory checklist = new string[](2);
        checklist[0] = "Funds go to eligible recipients";
        checklist[1] = "No personal benefit for organizer";
        
        uint256 proposalId = dao.createProposal(
            "Build School in Village",
            "Detailed description of school project",
            1000 * 10**18,
            false,
            keccak256("mock_kyc_proof"),
            checklist
        );
        
        vm.stopPrank();
        
        assertEq(proposalId, 1);
        assertEq(dao.proposalCount(), 1);
        
        IProposalManager.Proposal memory proposal = dao.getProposal(1);
        assertEq(proposal.organizer, organizer);
        assertEq(proposal.title, "Build School in Village");
        assertEq(proposal.fundingGoal, 1000 * 10**18);
        assertEq(uint8(proposal.status), uint8(IProposalManager.ProposalStatus.Draft));
        assertEq(uint8(proposal.kycStatus), uint8(IProposalManager.KYCStatus.Pending));
    }
    
    function testEmergencyProposal() public {
        vm.startPrank(organizer);
        
        uint256 proposalId = dao.createProposal(
            "Emergency Flood Relief",
            "Urgent flood relief needed",
            500 * 10**18,
            true, // emergency
            bytes32(0),
            new string[](0)
        );
        
        vm.stopPrank();
        
        IProposalManager.Proposal memory proposal = dao.getProposal(proposalId);
        assertTrue(proposal.isEmergency);
        assertEq(uint8(proposal.kycStatus), uint8(IProposalManager.KYCStatus.NotRequired));
    }
    
    function testKYCUpdate() public {
        vm.prank(organizer);
        uint256 proposalId = dao.createProposal(
            "Test Proposal",
            "Description",
            1000 * 10**18,
            false,
            keccak256("kyc_hash"),
            new string[](0)
        );
        
        // Update KYC status
        dao.updateKYCStatus(
            proposalId,
            IProposalManager.KYCStatus.Verified,
            "KYC verified via mock ZK proof"
        );
        
        IProposalManager.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(uint8(proposal.kycStatus), uint8(IProposalManager.KYCStatus.Verified));
    }
    
    function testCommunityVoteFlow() public {
        // Create and verify proposal
        vm.prank(organizer);
        uint256 proposalId = dao.createProposal(
            "Test Campaign",
            "Description",
            1000 * 10**18,
            false,
            keccak256("kyc"),
            new string[](0)
        );
        
        dao.updateKYCStatus(proposalId, IProposalManager.KYCStatus.Verified, "Verified");
        
        // Submit for vote
        vm.prank(organizer);
        dao.submitForCommunityVote(proposalId);
        
        IProposalManager.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(uint8(proposal.status), uint8(IProposalManager.ProposalStatus.CommunityVote));
        
        // Cast votes
        vm.prank(member1);
        dao.castVote(proposalId, 1); // For
        
        vm.prank(member2);
        dao.castVote(proposalId, 1); // For
        
        vm.prank(member3);
        dao.castVote(proposalId, 0); // Against
        
        // Fast forward time
        vm.warp(block.timestamp + 8 days);
        
        // Finalize vote
        dao.finalizeCommunityVote(proposalId);
        
        proposal = dao.getProposal(proposalId);
        // After finalization with passing vote, automatic bundling occurs
        // Status changes from CommunityPassed → ShariaReview
        assertEq(uint8(proposal.status), uint8(IProposalManager.ProposalStatus.ShariaReview));
        // Each member has 100 * 10^18 voting tokens, so votes are weighted
        assertEq(proposal.votesFor, 200 * 10**18);  // member1 + member2
        assertEq(proposal.votesAgainst, 100 * 10**18);  // member3
    }
    
    function testShariaReviewFlow() public {
        // Create passed proposal
        vm.prank(organizer);
        uint256 proposalId = dao.createProposal(
            "Test Campaign",
            "Description",
            1000 * 10**18,
            true, // emergency
            bytes32(0),
            new string[](0)
        );
        
        vm.prank(organizer);
        dao.submitForCommunityVote(proposalId);
        
        vm.prank(member1);
        dao.castVote(proposalId, 1);
        vm.prank(member2);
        dao.castVote(proposalId, 1);
        
        vm.warp(block.timestamp + 8 days);
        dao.finalizeCommunityVote(proposalId);
        
        // Automatic bundling occurred during finalizeCommunityVote
        uint256 bundleId = 1; // Auto-created bundle ID
        
        assertEq(bundleId, 1);
        
        // Sharia council reviews
        // All 3 Sharia council members need to review (multi-sig 2/3 quorum)
        vm.prank(shariaCouncil1);
        dao.reviewProposal(
            bundleId,
            proposalId,
            true,
            IProposalManager.CampaignType.ZakatCompliant,
            keccak256("sharia_proof_1")
        );
        
        vm.prank(shariaCouncil2);
        dao.reviewProposal(
            bundleId,
            proposalId,
            true,
            IProposalManager.CampaignType.ZakatCompliant,
            keccak256("sharia_proof_2")
        );
        
        // Finalize bundle after 2/3 quorum reached
        vm.prank(shariaCouncil1);
        dao.finalizeShariaBundle(bundleId);
        
        IProposalManager.Proposal memory proposal = dao.getProposal(proposalId);
        assertEq(uint8(proposal.status), uint8(IProposalManager.ProposalStatus.ShariaApproved));
        assertEq(uint8(proposal.campaignType), uint8(IProposalManager.CampaignType.ZakatCompliant));
        
        // Organizer creates pool for their approved proposal
        vm.prank(organizer);
        uint256 poolId = dao.createCampaignPool(proposalId);
        assertEq(poolId, 1);
    }
    
    function testFullDonationFlow() public {
        // Setup approved proposal
        vm.prank(organizer);
        uint256 proposalId = dao.createProposal(
            "Test Campaign",
            "Description",
            1000 * 10**18,
            true,
            bytes32(0),
            new string[](0)
        );
        
        vm.prank(organizer);
        dao.submitForCommunityVote(proposalId);
        
        vm.prank(member1);
        dao.castVote(proposalId, 1);
        vm.prank(member2);
        dao.castVote(proposalId, 1);
        
        vm.warp(block.timestamp + 8 days);
        dao.finalizeCommunityVote(proposalId);
        
        // Automatic bundling occurred during finalizeCommunityVote
        uint256 bundleId = 1; // Auto-created bundle ID
        
        vm.prank(shariaCouncil1);
        dao.reviewProposal(bundleId, proposalId, true, IProposalManager.CampaignType.ZakatCompliant, bytes32(0));
        
        vm.prank(shariaCouncil1);
        dao.finalizeShariaBundle(bundleId);
        
        // Create pool (organizer creates their own pool after Sharia approval)
        vm.prank(organizer);
        uint256 poolId = dao.createCampaignPool(proposalId);
        assertEq(poolId, 1);
        
        // Donor1 donates (first donation) with IPFS CID from Pinata
        vm.startPrank(donor1);
        idrxToken.approve(address(dao.getPoolManagerAddress()), 500 * 10**18);
        dao.donate(poolId, 500 * 10**18, "QmX1Y2Z3ReceiptMetadata1");
        vm.stopPrank();
        
        // Check first receipt NFT minted with IPFS metadata
        uint256[] memory donor1Receipts = receiptNFT.getDonorReceipts(donor1);
        assertEq(donor1Receipts.length, 1);
        assertEq(receiptNFT.ownerOf(donor1Receipts[0]), donor1);
        
        // Verify IPFS URI is set correctly
        uint256 firstTokenId = donor1Receipts[0];
        string memory tokenURI = receiptNFT.tokenURI(firstTokenId);
        assertEq(tokenURI, "ipfs://QmX1Y2Z3ReceiptMetadata1");
        
        // Verify metadata stored correctly
        (
            uint256 poolId_,
            address donor_,
            uint256 amount_,
            uint256 donatedAt_,
            string memory title_,
            string memory type_,
            string memory ipfsCID_,
            bool isActive_
        ) = receiptNFT.tokenMetadata(firstTokenId);
        assertEq(poolId_, poolId);
        assertEq(donor_, donor1);
        assertEq(amount_, 500 * 10**18);
        assertEq(ipfsCID_, "QmX1Y2Z3ReceiptMetadata1");
        assertTrue(isActive_);
        
        // Donor1 donates again (should mint ANOTHER receipt NFT with different IPFS CID)
        vm.startPrank(donor1);
        idrxToken.approve(address(dao.getPoolManagerAddress()), 300 * 10**18);
        dao.donate(poolId, 300 * 10**18, "QmA2B3C4ReceiptMetadata2");
        vm.stopPrank();
        
        // Check second receipt NFT minted for same donor
        donor1Receipts = receiptNFT.getDonorReceipts(donor1);
        assertEq(donor1Receipts.length, 2); // Now has 2 receipt NFTs
        
        // Verify second NFT has different IPFS CID
        uint256 secondTokenId = donor1Receipts[1];
        string memory tokenURI2 = receiptNFT.tokenURI(secondTokenId);
        assertEq(tokenURI2, "ipfs://QmA2B3C4ReceiptMetadata2");
        
        // Donor2 donates with their own IPFS CID
        vm.startPrank(donor2);
        idrxToken.approve(address(dao.getPoolManagerAddress()), 600 * 10**18);
        dao.donate(poolId, 600 * 10**18, "QmD5E6F7ReceiptMetadata3");
        vm.stopPrank();
        
        // Check donor2 has 1 receipt NFT
        uint256[] memory donor2Receipts = receiptNFT.getDonorReceipts(donor2);
        assertEq(donor2Receipts.length, 1);
        
        // Check pool status
        PoolManager.CampaignPool memory pool = dao.getPool(poolId);
        assertEq(pool.raisedAmount, 1400 * 10**18); // 500 + 300 + 600
        assertTrue(pool.raisedAmount >= pool.fundingGoal);
        
        // Organizer withdraws
        uint256 organizerBalanceBefore = idrxToken.balanceOf(organizer);
        vm.prank(organizer);
        dao.withdrawFunds(poolId);
        
        assertEq(idrxToken.balanceOf(organizer), organizerBalanceBefore + 1400 * 10**18);
    }
    
    function testFaucet() public {
        // Fast forward past initial cooldown period
        vm.warp(block.timestamp + 25 hours);
        
        vm.startPrank(donor1);
        
        uint256 balanceBefore = idrxToken.balanceOf(donor1);
        idrxToken.faucet();
        uint256 balanceAfter = idrxToken.balanceOf(donor1);
        
        assertEq(balanceAfter - balanceBefore, 1000 * 10**18);
        
        // Try to claim again immediately (should fail)
        vm.expectRevert("MockIDRX: Faucet cooldown not expired");
        idrxToken.faucet();
        
        // Fast forward 24 hours
        vm.warp(block.timestamp + 24 hours + 1);
        
        // Should work now
        idrxToken.faucet();
        assertEq(idrxToken.balanceOf(donor1), balanceAfter + 1000 * 10**18);
        
        vm.stopPrank();
    }
    
    function testReceiptNFTNonTransferable() public {
        // Setup and create donation to mint receipt NFT
        vm.prank(organizer);
        uint256 proposalId = dao.createProposal(
            "Test",
            "Desc",
            1000 * 10**18,
            true,
            bytes32(0),
            new string[](0)
        );
        
        vm.prank(organizer);
        dao.submitForCommunityVote(proposalId);
        vm.prank(member1);
        dao.castVote(proposalId, 1);
        vm.prank(member2);
        dao.castVote(proposalId, 1);
        
        vm.warp(block.timestamp + 8 days);
        dao.finalizeCommunityVote(proposalId);
        
        // Automatic bundling occurred during finalizeCommunityVote
        uint256 bundleId = 1; // Auto-created bundle ID
        vm.prank(shariaCouncil1);
        dao.reviewProposal(bundleId, proposalId, true, IProposalManager.CampaignType.Normal, bytes32(0));
        vm.prank(shariaCouncil1);
        dao.finalizeShariaBundle(bundleId);
        
        vm.prank(organizer);
        uint256 poolId = dao.createCampaignPool(proposalId);
        
        vm.startPrank(donor1);
        idrxToken.approve(address(dao.getPoolManagerAddress()), 100 * 10**18);
        dao.donate(poolId, 100 * 10**18, "QmTestNonTransferable");
        vm.stopPrank();
        
        uint256[] memory receipts = receiptNFT.getDonorReceipts(donor1);
        uint256 tokenId = receipts[0];
        
        // Try to transfer receipt NFT (should fail)
        vm.prank(donor1);
        vm.expectRevert("DonationReceiptNFT: Non-transferable receipt");
        receiptNFT.transferFrom(donor1, donor2, tokenId);
    }
    
    function testIPFSReceiptMetadata() public {
        // Setup approved proposal and pool
        vm.prank(organizer);
        uint256 proposalId = dao.createProposal(
            "Disaster Relief Campaign",
            "Emergency assistance",
            2000 * 10**18,
            true,
            bytes32(0),
            new string[](0)
        );
        
        vm.prank(organizer);
        dao.submitForCommunityVote(proposalId);
        vm.prank(member1);
        dao.castVote(proposalId, 1);
        vm.prank(member2);
        dao.castVote(proposalId, 1);
        
        vm.warp(block.timestamp + 8 days);
        dao.finalizeCommunityVote(proposalId);
        
        uint256 bundleId = 1;
        vm.prank(shariaCouncil1);
        dao.reviewProposal(bundleId, proposalId, true, IProposalManager.CampaignType.ZakatCompliant, bytes32(0));
        vm.prank(shariaCouncil1);
        dao.finalizeShariaBundle(bundleId);
        
        vm.prank(organizer);
        uint256 poolId = dao.createCampaignPool(proposalId);
        
        // Simulate Pinata IPFS upload: Frontend uploads metadata to Pinata and gets CID
        // Metadata JSON contains: campaign reports, images, donation details, etc.
        string memory pinataIPFSCID = "QmPinataExampleCID123WithFullMetadata";
        
        // Donor donates and passes IPFS CID
        vm.startPrank(donor1);
        idrxToken.approve(address(dao.getPoolManagerAddress()), 500 * 10**18);
        dao.donate(poolId, 500 * 10**18, pinataIPFSCID);
        vm.stopPrank();
        
        // Verify NFT was minted with IPFS metadata
        uint256[] memory receipts = receiptNFT.getDonorReceipts(donor1);
        assertEq(receipts.length, 1);
        
        uint256 tokenId = receipts[0];
        
        // Check tokenURI points to IPFS
        string memory tokenURI = receiptNFT.tokenURI(tokenId);
        assertEq(tokenURI, "ipfs://QmPinataExampleCID123WithFullMetadata");
        
        // Verify metadata struct contains IPFS CID
        (
            ,
            ,
            ,
            ,
            ,
            ,
            string memory storedIPFSCID,
            
        ) = receiptNFT.tokenMetadata(tokenId);
        assertEq(storedIPFSCID, pinataIPFSCID);
        
        // Test that donation without IPFS CID fails
        vm.startPrank(donor2);
        idrxToken.approve(address(dao.getPoolManagerAddress()), 300 * 10**18);
        vm.expectRevert("IPFS CID required");
        dao.donate(poolId, 300 * 10**18, ""); // Empty CID should fail
        vm.stopPrank();
    }
}

