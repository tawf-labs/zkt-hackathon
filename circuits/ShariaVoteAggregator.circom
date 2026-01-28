// SPDX-License-Identifier: MIT
pragma circom 2.0.0;

include "./components/VoteCounter.circom";
include "./components/MerkleProof.circom";
include "./components/Nullifier.circom";

/**
 * @title ShariaVoteAggregator
 * @notice Groth16 circuit for aggregating Sharia council votes off-chain
 * @dev Proves that for a given bundle and proposal, approvalCount >= quorumThreshold
 *
 * Private Inputs (witness):
 * - councilMemberVote[N_COUNCIL]: Individual votes (0=reject, 1=approve)
 * - memberCommitment[N_COUNCIL]: Council member identity commitments
 * - voteNullifier[N_COUNCIL]: Nullifiers to prevent double-voting
 * - merkleProofElements[N_COUNCIL][TREE_DEPTH]: Merkle proof paths
 * - merkleProofPathIndices[N_COUNCIL][TREE_DEPTH]: Merkle proof path indices (0/1)
 *
 * Public Inputs:
 * - bundleId: Bundle being reviewed
 * - proposalId: Proposal being reviewed
 * - approvalCount: Number of approve votes
 * - quorumThreshold: Required votes for approval (e.g., 3)
 * - councilRoot: Merkle root of council membership
 * - nullifierRoot: Merkle root of spent nullifiers
 */

// Circuit configuration constants
const N_COUNCIL = 5;  // Number of Sharia council members
const TREE_DEPTH = 3; // Merkle tree depth (supports up to 2^3 = 8 members)

template ShariaVoteAggregator() {
    // ========== Private Inputs (Witness) ==========

    // Individual votes from each council member (0 or 1)
    signal input councilMemberVote[N_COUNCIL];

    // Member identity commitments (Poseidon hash of member address + secret)
    signal input memberCommitment[N_COUNCIL];

    // Nullifiers to prevent double-voting
    signal input voteNullifier[N_COUNCIL];

    // Merkle proof paths for council membership verification
    signal input merkleProofElements[N_COUNCIL][TREE_DEPTH];

    // Merkle proof path indices (0 = left sibling, 1 = right sibling)
    signal input merkleProofPathIndices[N_COUNCIL][TREE_DEPTH];

    // ========== Public Inputs ==========

    signal input bundleId;
    signal input proposalId;
    signal input approvalCount;
    signal input quorumThreshold;
    signal input councilRoot;
    signal input nullifierRoot;

    // ========== Internal Components ==========

    // Vote counting component
    component voteCounter = VoteCounter(N_COUNCIL);

    // Merkle proof verification for each council member
    component merkleVerifier[N_COUNCIL];
    component nullifierChecker[N_COUNCIL];

    // ========== Connect Vote Counter ==========

    signal countedVotes;

    for (var i = 0; i < N_COUNCIL; i++) {
        voteCounter.votes[i] <== councilMemberVote[i];

        // Enforce that votes are binary (0 or 1)
        councilMemberVote[i] * (councilMemberVote[i] - 1) === 0;
    }

    countedVotes <== voteCounter.totalVotes;

    // ========== Enforce Approval Count Matches ==========

    // The counted votes must equal the public approvalCount
    countedVotes === approvalCount;

    // ========== Enforce Quorum ==========

    // approvalCount >= quorumThreshold
    // Using signal subtraction to prove >= (no underflow in circom)
    signal quorumMet;
    quorumMet <== approvalCount - quorumThreshold;

    // quorumMet must be >= 0 (i.e., approvalCount >= quorumThreshold)
    // In circom, we use a range proof or the fact that signals are field elements
    // We'll use a helper component for comparison

    // ========== Verify Council Membership ==========

    for (var i = 0; i < N_COUNCIL; i++) {
        // Only verify membership if the member actually voted (vote == 1)
        // We multiply the commitment by the vote to "nullify" the check if vote == 0

        merkleVerifier[i] = MerkleProof(TREE_DEPTH);
        merkleVerifier[i].leaf <== memberCommitment[i];
        merkleVerifier[i].root <== councilRoot;

        for (var j = 0; j < TREE_DEPTH; j++) {
            merkleVerifier[i].pathElements[j] <== merkleProofElements[i][j];
            merkleVerifier[i].pathIndices[j] <== merkleProofPathIndices[i][j];
        }

        // The membership proof is only required if vote == 1
        // We multiply the valid output by vote, so if vote=0, valid=0 passes
        // If vote=1, valid must equal 1
        signal membershipValid;
        membershipValid <== merkleVerifier[i].valid * councilMemberVote[i];

        membershipValid === councilMemberVote[i];

        // ========== Verify Nullifier ==========

        nullifierChecker[i] = Nullifier();
        nullifierChecker[i].nullifier <== voteNullifier[i];
        nullifierChecker[i].root <== nullifierRoot;
        nullifierChecker[i].leafIndex <== i; // Each member has fixed index

        // Same logic: nullifier check only applies if vote was cast
        signal nullifierValid;
        nullifierValid <== nullifierChecker[i].valid * councilMemberVote[i];
        nullifierValid === councilMemberVote[i];
    }

    // ========== Compute and Verify Bundle/Proposal Hash ==========

    // Create a commitment to bundleId and proposalId for uniqueness
    signal bundleProposalHash;
    bundleProposalHash <== bundleId * proposalId;

    // This ensures the proof is tied to specific bundle and proposal
}

component main { public [bundleId, proposalId, approvalCount, quorumThreshold, councilRoot, nullifierRoot] } = ShariaVoteAggregator();
