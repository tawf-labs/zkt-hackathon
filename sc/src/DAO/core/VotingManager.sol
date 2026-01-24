// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IProposalManager.sol";
import "./ProposalManager.sol";
import "../../tokens/VotingToken.sol";

/**
 * @title VotingManager
 * @notice Handles community voting using non-transferable voting tokens
 * @dev Voters must hold vZKT tokens to participate
 */
contract VotingManager is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    ProposalManager public proposalManager;
    VotingToken public votingToken;
    
    uint256 public quorumPercentage = 10;
    uint256 public passThreshold = 51;
    
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => uint256) public votesFor;
    mapping(uint256 => uint256) public votesAgainst;
    mapping(uint256 => uint256) public votesAbstain;
    
    event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 support, uint256 weight);
    event VotingPeriodEnded(uint256 indexed proposalId, bool passed, uint256 forVotes, uint256 againstVotes);
    
    constructor(address _proposalManager, address _votingToken) {
        require(_proposalManager != address(0), "Invalid proposal manager");
        require(_votingToken != address(0), "Invalid voting token");
        proposalManager = ProposalManager(_proposalManager);
        votingToken = VotingToken(_votingToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    function castVote(address voter, uint256 proposalId, uint8 support) external {
        require(voter != address(0), "Invalid voter address");
        IProposalManager.Proposal memory proposal = proposalManager.getProposal(proposalId);
        
        require(proposal.status == IProposalManager.ProposalStatus.CommunityVote, "Voting not active");
        require(
            block.timestamp >= proposal.communityVoteStart &&
            block.timestamp <= proposal.communityVoteEnd,
            "Voting period ended"
        );
        require(!hasVoted[proposalId][voter], "Already voted");
        require(support <= 2, "Invalid vote option");
        
        uint256 votingPower = votingToken.balanceOf(voter);
        require(votingPower > 0, "No voting power (need vZKT tokens)");
        
        hasVoted[proposalId][voter] = true;
        
        if (support == 0) {
            votesAgainst[proposalId] += votingPower;
        } else if (support == 1) {
            votesFor[proposalId] += votingPower;
        } else {
            votesAbstain[proposalId] += votingPower;
        }
        
        emit VoteCast(proposalId, voter, support, votingPower);
    }
    
    function finalizeCommunityVote(uint256 proposalId) external returns (bool) {
        IProposalManager.Proposal memory proposal = proposalManager.getProposal(proposalId);
        
        require(proposal.status == IProposalManager.ProposalStatus.CommunityVote, "Not in voting");
        require(block.timestamp > proposal.communityVoteEnd, "Voting still active");
        
        uint256 totalVotes = votesFor[proposalId] + votesAgainst[proposalId] + votesAbstain[proposalId];
        uint256 totalSupply = votingToken.totalSupply();
        uint256 quorumRequired = (totalSupply * quorumPercentage) / 100;
        
        bool quorumReached = totalVotes >= quorumRequired;
        bool passed = false;
        
        if (quorumReached) {
            uint256 validVotes = votesFor[proposalId] + votesAgainst[proposalId];
            if (validVotes > 0) {
                passed = (votesFor[proposalId] * 100) >= (validVotes * passThreshold);
            }
        }
        
        IProposalManager.ProposalStatus newStatus = passed 
            ? IProposalManager.ProposalStatus.CommunityPassed 
            : IProposalManager.ProposalStatus.CommunityRejected;
        
        proposalManager.updateProposalStatus(
            proposalId,
            newStatus,
            votesFor[proposalId],
            votesAgainst[proposalId],
            votesAbstain[proposalId]
        );
        
        emit VotingPeriodEnded(proposalId, passed, votesFor[proposalId], votesAgainst[proposalId]);
        
        return passed;
    }
    
    function setQuorumPercentage(uint256 _quorumPercentage) external onlyRole(ADMIN_ROLE) {
        require(_quorumPercentage <= 100, "Invalid percentage");
        quorumPercentage = _quorumPercentage;
    }
    
    function setPassThreshold(uint256 _passThreshold) external onlyRole(ADMIN_ROLE) {
        require(_passThreshold <= 100, "Invalid percentage");
        passThreshold = _passThreshold;
    }
}
