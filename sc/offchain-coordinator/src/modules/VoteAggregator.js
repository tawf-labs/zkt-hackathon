/**
 * VoteAggregator - Manages vote storage and aggregation
 */

import Level from 'level';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class VoteAggregator {
  constructor() {
    this.db = Level(path.join(__dirname, '../../data/votes'), { valueEncoding: 'json' });
  }

  /**
   * Record a vote from a council member
   */
  async recordVote(voteData) {
    const key = `${voteData.bundleId}:${voteData.proposalId}:${voteData.voterAddress}`;

    // Check if already voted
    const existing = await this.db.get(key).catch(() => null);
    if (existing) {
      throw new Error('Already voted');
    }

    await this.db.put(key, voteData);

    // Update bundle:proposal vote count
    const countKey = `count:${voteData.bundleId}:${voteData.proposalId}`;
    const current = await this.db.get(countKey).catch(() => ({ approvals: 0, rejections: 0 }));

    if (voteData.vote === 1) {
      current.approvals++;
    } else {
      current.rejections++;
    }

    await this.db.put(countKey, current);
  }

  /**
   * Check if a member has already voted
   */
  async hasVoted(bundleId, proposalId, voterAddress) {
    const key = `${bundleId}:${proposalId}:${voterAddress}`;
    const result = await this.db.get(key).catch(() => null);
    return result !== null;
  }

  /**
   * Get all votes for a proposal
   */
  async getVotes(bundleId, proposalId) {
    const votes = [];
    for await (const [key, value] of this.db.iterator()) {
      const [bId, pId] = key.split(':').slice(0, 2);
      if (parseInt(bId) === bundleId && parseInt(pId) === proposalId) {
        votes.push(value);
      }
    }
    return votes;
  }

  /**
   * Get vote count for a proposal
   */
  async getVoteCount(bundleId, proposalId) {
    const countKey = `count:${bundleId}:${proposalId}`;
    const result = await this.db.get(countKey).catch(() => ({ approvals: 0, rejections: 0 }));
    return result;
  }

  /**
   * Get all bundles that have pending votes (quorum not yet reached)
   */
  async getPendingBundles() {
    const pending = new Set();
    const quorum = parseInt(process.env.SHARIA_QUORUM || '3');

    for await (const [key, value] of this.db.iterator()) {
      if (key.startsWith('count:')) {
        const [, bundleId, proposalId] = key.split(':');
        if (value.approvals < quorum) {
          pending.add(`${bundleId}:${proposalId}`);
        }
      }
    }

    return Array.from(pending).map(p => {
      const [bundleId, proposalId] = p.split(':');
      return { bundleId: parseInt(bundleId), proposalId: parseInt(proposalId) };
    });
  }

  /**
   * Close the database
   */
  async close() {
    await this.db.close();
  }
}
