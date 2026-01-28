/**
 * ProofGenerator - Generates Groth16 ZK proofs using snarkjs
 */

import { loadProofAndVerify, groth16FullProve } from 'snarkjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class ProofGenerator {
  constructor() {
    this.wasmPath = path.join(__dirname, '../../../circuits/build/ShariaVoteAggregator_js/ShariaVoteAggregator.wasm');
    this.zkeyPath = path.join(__dirname, '../../../circuits/build/sharia_0000.zkey');
    this.vkeyPath = path.join(__dirname, '../../../circuits/build/verification_key.json');
  }

  /**
   * Generate a Groth16 proof for Sharia council vote aggregation
   * @param {Object} params - Proof parameters
   */
  async generateProof(params) {
    const { bundleId, proposalId, votes, councilRoot, quorumThreshold } = params;

    // Count approvals
    const approvalCount = votes.filter(v => v.vote === 1).length;

    if (approvalCount < quorumThreshold) {
      throw new Error(`Quorum not met: ${approvalCount} < ${quorumThreshold}`);
    }

    // Prepare circuit inputs
    // This is a simplified version - the actual input depends on the circuit structure
    const circuitInputs = this.prepareCircuitInputs({
      bundleId,
      proposalId,
      votes,
      councilRoot,
      quorumThreshold
    });

    // Generate proof using snarkjs
    const { proof, publicSignals } = await groth16FullProve(
      circuitInputs,
      this.wasmPath,
      this.zkeyPath
    );

    return {
      proof: this.formatProof(proof),
      publicSignals,
      approvalCount,
      quorumThreshold
    };
  }

  /**
   * Prepare circuit inputs from vote data
   */
  prepareCircuitInputs({ bundleId, proposalId, votes, councilRoot, quorumThreshold }) {
    // N_COUNCIL = 5 from circuit
    const N_COUNCIL = 5;
    const TREE_DEPTH = 3;

    // Initialize arrays with zeros
    const councilMemberVote = new Array(N_COUNCIL).fill(0);
    const memberCommitment = new Array(N_COUNCIL).fill(0);
    const voteNullifier = new Array(N_COUNCIL).fill('0');
    const merkleProofElements = Array(N_COUNCIL).fill(null).map(() => new Array(TREE_DEPTH).fill('0'));
    const merkleProofPathIndices = Array(N_COUNCIL).fill(null).map(() => new Array(TREE_DEPTH).fill(0));

    // Fill in actual votes
    votes.forEach((vote, i) => {
      if (i < N_COUNCIL) {
        councilMemberVote[i] = vote.vote;
        memberCommitment[i] = vote.commitment || vote.commitment || '0';
        voteNullifier[i] = vote.nullifier || '0';

        // Merkle proof would be generated here in production
        // For MVP, we use dummy values
      }
    });

    return {
      councilMemberVote,
      memberCommitment,
      voteNullifier,
      merkleProofElements,
      merkleProofPathIndices,
      bundleId,
      proposalId,
      approvalCount: votes.filter(v => v.vote === 1).length,
      quorumThreshold,
      councilRoot,
      nullifierRoot: '0'  // Simplified for MVP
    };
  }

  /**
   * Format proof for blockchain submission
   */
  formatProof(proof) {
    return {
      pi_a: [proof.pi_a[0], proof.pi_a[1]],
      pi_b: [
        [proof.pi_b[0][1], proof.pi_b[0][0]],  // Note: snarkjs uses different order
        [proof.pi_b[1][1], proof.pi_b[1][0]]
      ],
      pi_c: [proof.pi_c[0], proof.pi_c[1]]
    };
  }

  /**
   * Verify a proof (for testing)
   */
  async verifyProof(proof, publicSignals) {
    const vKey = JSON.parse(readFileSync(this.vkeyPath, 'utf8'));
    return await loadProofAndVerify(vKey, proof, publicSignals);
  }
}
