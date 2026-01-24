// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IProposalManager.sol";
import "./ProposalManager.sol";

/**
 * @title ShariaReviewManager
 * @notice Handles Sharia council review and bundling of proposals
 */
contract ShariaReviewManager is AccessControl {
    bytes32 public constant SHARIA_COUNCIL_ROLE = keccak256("SHARIA_COUNCIL_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    ProposalManager public proposalManager;
    
    struct ShariaReviewBundle {
        uint256 bundleId;
        uint256[] proposalIds;
        uint256 submittedAt;
        bool finalized;
        uint256 approvalCount;
    }
    
    uint256 public bundleCount;
    uint256 public shariaQuorumRequired = 3;
    uint256 public constant BUNDLE_THRESHOLD = 5;
    uint256 public constant BUNDLE_TIME_THRESHOLD = 7 days;
    uint256 public lastBundleTime;
    
    mapping(uint256 => ShariaReviewBundle) public shariaBundles;
    mapping(uint256 => mapping(uint256 => bool)) public bundleProposalApproved;
    mapping(uint256 => mapping(uint256 => IProposalManager.CampaignType)) public bundleProposalType;
    mapping(uint256 => mapping(uint256 => bytes32)) public shariaReviewProofs;
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) public shariaVotes;
    
    event ShariaReviewBundleCreated(uint256 indexed bundleId, uint256[] proposalIds);
    event ProposalShariaApproved(uint256 indexed proposalId, IProposalManager.CampaignType campaignType);
    event ProposalShariaRejected(uint256 indexed proposalId);
    event ShariaBundleFinalized(uint256 indexed bundleId);
    
    constructor(address _proposalManager) {
        require(_proposalManager != address(0), "Invalid proposal manager");
        proposalManager = ProposalManager(_proposalManager);
        lastBundleTime = block.timestamp;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    function checkAndCreateBundle() external {
        uint256 proposalCount = proposalManager.proposalCount();
        uint256[] memory passedProposals = new uint256[](proposalCount);
        uint256 passedCount = 0;
        
        for (uint256 i = 1; i <= proposalCount; i++) {
            IProposalManager.Proposal memory proposal = proposalManager.getProposal(i);
            if (proposal.status == IProposalManager.ProposalStatus.CommunityPassed) {
                passedProposals[passedCount] = i;
                passedCount++;
            }
        }
        
        bool countThresholdMet = passedCount >= BUNDLE_THRESHOLD;
        bool timeThresholdMet = block.timestamp >= lastBundleTime + BUNDLE_TIME_THRESHOLD;
        
        if ((countThresholdMet || timeThresholdMet) && passedCount > 0) {
            uint256[] memory bundleProposals = new uint256[](passedCount);
            for (uint256 i = 0; i < passedCount; i++) {
                bundleProposals[i] = passedProposals[i];
            }
            
            _createShariaReviewBundle(bundleProposals);
        }
    }
    
    function createShariaReviewBundle(uint256[] memory proposalIds) 
        external 
        onlyRole(ADMIN_ROLE) 
        returns (uint256) 
    {
        return _createShariaReviewBundle(proposalIds);
    }
    
    function _createShariaReviewBundle(uint256[] memory proposalIds) 
        internal 
        returns (uint256) 
    {
        require(proposalIds.length > 0, "No proposals to bundle");
        
        for (uint256 i = 0; i < proposalIds.length; i++) {
            IProposalManager.Proposal memory proposal = proposalManager.getProposal(proposalIds[i]);
            require(
                proposal.status == IProposalManager.ProposalStatus.CommunityPassed,
                "Proposal not passed"
            );
        }
        
        bundleCount++;
        uint256 bundleId = bundleCount;
        
        ShariaReviewBundle storage bundle = shariaBundles[bundleId];
        bundle.bundleId = bundleId;
        bundle.proposalIds = proposalIds;
        bundle.submittedAt = block.timestamp;
        bundle.finalized = false;
        
        for (uint256 i = 0; i < proposalIds.length; i++) {
            IProposalManager.Proposal memory prop = proposalManager.getProposal(proposalIds[i]);
            proposalManager.updateProposalStatus(
                proposalIds[i], 
                IProposalManager.ProposalStatus.ShariaReview,
                prop.votesFor,
                prop.votesAgainst,
                prop.votesAbstain
            );
        }
        
        lastBundleTime = block.timestamp;
        
        emit ShariaReviewBundleCreated(bundleId, proposalIds);
        
        return bundleId;
    }
    
    function reviewProposal(
        address reviewer,
        uint256 bundleId,
        uint256 proposalId,
        bool approved,
        IProposalManager.CampaignType campaignType,
        bytes32 mockZKReviewProof
    ) external onlyRole(SHARIA_COUNCIL_ROLE) {
        ShariaReviewBundle storage bundle = shariaBundles[bundleId];
        
        require(!bundle.finalized, "Bundle already finalized");
        require(_isProposalInBundle(bundleId, proposalId), "Proposal not in bundle");
        require(
            !shariaVotes[bundleId][reviewer][proposalId],
            "Already voted on this proposal"
        );
        
        shariaVotes[bundleId][reviewer][proposalId] = true;
        shariaReviewProofs[bundleId][proposalId] = mockZKReviewProof;
        
        if (approved) {
            bundleProposalApproved[bundleId][proposalId] = true;
            bundleProposalType[bundleId][proposalId] = campaignType;
        }
    }
    
    function finalizeShariaBundle(uint256 bundleId) external onlyRole(SHARIA_COUNCIL_ROLE) {
        ShariaReviewBundle storage bundle = shariaBundles[bundleId];
        
        require(!bundle.finalized, "Bundle already finalized");
        
        bundle.finalized = true;
        
        for (uint256 i = 0; i < bundle.proposalIds.length; i++) {
            uint256 proposalId = bundle.proposalIds[i];
            
            uint256 approvalVotes = _countShariaApprovalVotes(bundleId, proposalId);
            
            if (approvalVotes >= shariaQuorumRequired) {
                IProposalManager.CampaignType cType = bundleProposalType[bundleId][proposalId];
                proposalManager.updateProposalStatus(proposalId, IProposalManager.ProposalStatus.ShariaApproved, 0, 0, 0);
                proposalManager.updateProposalCampaignType(proposalId, cType);
                
                emit ProposalShariaApproved(proposalId, cType);
            } else {
                proposalManager.updateProposalStatus(proposalId, IProposalManager.ProposalStatus.ShariaRejected, 0, 0, 0);
                emit ProposalShariaRejected(proposalId);
            }
        }
        
        emit ShariaBundleFinalized(bundleId);
    }
    
    function _countShariaApprovalVotes(uint256 bundleId, uint256 proposalId) 
        internal 
        view 
        returns (uint256) 
    {
        if (!bundleProposalApproved[bundleId][proposalId]) {
            return 0;
        }
        return shariaQuorumRequired; // Simplified for MVP
    }
    
    function _isProposalInBundle(uint256 bundleId, uint256 proposalId) 
        internal 
        view 
        returns (bool) 
    {
        uint256[] memory proposalIds = shariaBundles[bundleId].proposalIds;
        for (uint256 i = 0; i < proposalIds.length; i++) {
            if (proposalIds[i] == proposalId) {
                return true;
            }
        }
        return false;
    }
    
    function setShariaQuorum(uint256 _quorum) external onlyRole(ADMIN_ROLE) {
        shariaQuorumRequired = _quorum;
    }
    
    function getBundle(uint256 bundleId) external view returns (ShariaReviewBundle memory) {
        return shariaBundles[bundleId];
    }
}
