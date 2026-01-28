/**
 * CouncilManager - Manages Sharia council membership and Merkle tree
 */

import { buildMerkleTree } from '../utils/merkle.js';

export class CouncilManager {
  constructor() {
    this.members = [];
    this.tree = null;
    this.root = '0';
  }

  /**
   * Setup council membership
   * @param {Array} members - Array of { address, secret } objects
   */
  async setupCouncil(members) {
    this.members = members.map(m => ({
      address: m.address,
      secret: m.secret,
      // Generate commitment as Poseidon hash (simplified to regular hash for MVP)
      commitment: this.generateCommitment(m.address, m.secret)
    }));

    this.tree = buildMerkleTree(this.members);
    this.root = this.tree.getRoot();

    return { root: this.root, memberCount: this.members.length };
  }

  /**
   * Generate a member commitment
   * In production, this uses Poseidon hash from circomlib
   */
  generateCommitment(address, secret) {
    // Simplified: use keccak256 for MVP
    const crypto = require('crypto');
    const data = address + secret;
    return '0x' + crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify if an address is a council member
   */
  async verifyMember(address) {
    return this.members.some(m => m.address.toLowerCase() === address.toLowerCase());
  }

  /**
   * Get Merkle proof for a member
   */
  getProof(address) {
    const index = this.members.findIndex(m => m.address.toLowerCase() === address.toLowerCase());
    if (index === -1) {
      throw new Error('Member not found');
    }
    return this.tree.getProof(index);
  }

  /**
   * Get current council root
   */
  getRoot() {
    return this.root;
  }

  /**
   * Get all council members (for debugging)
   */
  getCouncil() {
    return {
      root: this.root,
      members: this.members
    };
  }
}
