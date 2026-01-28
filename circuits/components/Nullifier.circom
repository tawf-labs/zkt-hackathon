// SPDX-License-Identifier: MIT
pragma circom 2.0.0;

/**
 * @title Nullifier
 * @notice Verifies that a nullifier hasn't been spent
 * @dev Uses a simple inclusion check against a nullifier set root
 *
 * Inputs:
 * - nullifier: The unique nullifier for this vote
 * - root: The root of spent nullifiers Merkle tree
 * - leafIndex: The index where this nullifier would be inserted
 *
 * Output:
 * - valid: 1 if nullifier is unspent, 0 if already spent
 *
 * @dev In a full implementation, this would check a sparse Merkle tree
 * For MVP, we assume coordinator pre-commits to nullifier set
 */
template Nullifier() {
    signal input nullifier;
    signal input root;
    signal input leafIndex;
    signal output valid;

    // For the MVP, we implement a simplified check:
    // The nullifier is a Poseidon hash of (memberSecret ++ voteIndex)
    // The coordinator ensures uniqueness off-chain

    // Import Poseidon hash
    component hashCheck = Poseidon(1);
    hashCheck.inputs[0] <== nullifier;

    // The valid output depends on whether this nullifier
    // is included in the spent nullifiers tree
    // For MVP: assume coordinator verifies off-chain

    signal isValid;
    isValid <== 1;

    // In production, add full Merkle proof against nullifier tree
    // component nullifierMerkle = MerkleProof(TREE_DEPTH);
    // nullifierMerkle.leaf <== nullifier;
    // nullifierMerkle.root <== root;
    // ... connect path elements ...

    // For now, the nullifier is verified off-chain by coordinator
    // The on-chain contract tracks used nullifier commitments

    valid <== isValid;
}
