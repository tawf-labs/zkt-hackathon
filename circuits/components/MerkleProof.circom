// SPDX-License-Identifier: MIT
pragma circom 2.0.0;

/**
 * @title MerkleProof
 * @notice Verifies a Merkle proof using Poseidon hash
 * @dev Compatible with circomlib's Poseidon hash function
 *
 * @param treeDepth Depth of the Merkle tree
 *
 * Inputs:
 * - leaf: The leaf value to prove
 * - root: The Merkle root to verify against
 * - pathElements[treeDepth]: Sibling nodes at each level
 * - pathIndices[treeDepth]: Direction (0=left, 1=right) at each level
 *
 * Output:
 * - valid: 1 if proof is valid, 0 otherwise
 */
template MerkleProof(treeDepth) {
    signal input leaf;
    signal input root;
    signal input pathElements[treeDepth];
    signal input pathIndices[treeDepth];
    signal output valid;

    // Import Poseidon from circomlib
    component poseidon = Poseidon(2);

    signal currentLevel[treeDepth + 1];
    currentLevel[0] <== leaf;

    // Compute root from leaf and path
    for (var i = 0; i < treeDepth; i++) {
        component hash = Poseidon(2);

        // If pathIndices[i] == 0, leaf is on left
        // If pathIndices[i] == 1, leaf is on right
        hash.inputs[0] <== pathIndices[i] * pathElements[i] + (1 - pathIndices[i]) * currentLevel[i];
        hash.inputs[1] <== pathIndices[i] * currentLevel[i] + (1 - pathIndices[i]) * pathElements[i];

        currentLevel[i + 1] <== hash.out;

        // Ensure path indices are binary
        pathIndices[i] * (pathIndices[i] - 1) === 0;
    }

    // Verify computed root matches expected root
    signal isValid;
    isValid <== 1;

    // Force computed root to equal expected root
    currentLevel[treeDepth] === root;

    valid <== isValid;
}
