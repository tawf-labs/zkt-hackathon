/**
 * Merkle tree utilities for council membership
 */

import crypto from 'crypto';

export function buildMerkleTree(leaves) {
  if (leaves.length === 0) {
    return {
      getRoot: () => '0',
      getProof: () => []
    };
  }

  // Convert leaves to hashes
  let nodes = leaves.map(leaf => hashLeaf(leaf));

  const tree = [nodes.slice()];

  // Build tree level by level
  while (nodes.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = i + 1 < nodes.length ? nodes[i + 1] : left;
      nextLevel.push(hashPair(left, right));
    }
    nodes = nextLevel;
    tree.push(nodes.slice());
  }

  return {
    getRoot: () => nodes[0],
    getProof: (index) => generateProof(tree, index)
  };
}

function hashLeaf(leaf) {
  return '0x' + crypto.createHash('sha256')
    .update(JSON.stringify(leaf))
    .digest('hex');
}

function hashPair(left, right) {
  return '0x' + crypto.createHash('sha256')
    .update(left + right)
    .digest('hex');
}

function generateProof(tree, leafIndex) {
  const proof = [];
  let index = leafIndex;

  for (let level = 0; level < tree.length - 1; level++) {
    const isRight = index % 2 === 1;
    const siblingIndex = isRight ? index - 1 : index + 1;
    const levelNodes = tree[level];
    const sibling = siblingIndex < levelNodes.length
      ? levelNodes[siblingIndex]
      : levelNodes[index]; // Duplicate if odd

    proof.push({
      element: sibling,
      index: isRight ? 1 : 0  // 0 = left sibling, 1 = right sibling
    });

    index = Math.floor(index / 2);
  }

  return proof;
}
