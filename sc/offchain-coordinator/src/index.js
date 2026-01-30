#!/usr/bin/env node

/**
 * ZK Sharia Council Off-Chain Coordinator
 *
 * This service:
 * 1. Receives encrypted votes from Sharia council members
 * 2. Aggregates votes when quorum is reached
 * 3. Generates Groth16 ZK proofs using snarkjs
 * 4. Optionally submits proofs to blockchain
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { VoteAggregator } from './modules/VoteAggregator.js';
import { ProofGenerator } from './modules/ProofGenerator.js';
import { BlockchainPublisher } from './modules/BlockchainPublisher.js';
import { CouncilManager } from './modules/CouncilManager.js';
import { createLogger } from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const logger = createLogger();

// Initialize modules
const voteAggregator = new VoteAggregator();
const proofGenerator = new ProofGenerator();
const blockchainPublisher = new BlockchainPublisher(
  process.env.RPC_URL,
  process.env.PRIVATE_KEY,
  process.env.DAO_CONTRACT_ADDRESS
);
const councilManager = new CouncilManager();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check with TEE attestation info
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    tee: {
      enabled: process.env.TEE === 'true',
      attested: process.env.TEE === 'true' // Set TEE=true if running in TEE environment
    },
    council: {
      root: councilManager.getRoot(),
      memberCount: councilManager.getCouncil().members.length
    },
    coordinator: {
      quorum: parseInt(process.env.SHARIA_QUORUM || '3'),
      autoPublish: process.env.AUTO_PUBLISH === 'true'
    }
  };

  // Include vote stats if available
  try {
    const pendingBundles = await voteAggregator.getPendingBundles();
    health.pending = {
      bundles: pendingBundles.length
    };
  } catch (e) {
    // Ignore errors in health check
  }

  res.json(health);
});

/**
 * GET /council
 * Get current council membership info
 */
app.get('/council', (req, res) => {
  try {
    const council = councilManager.getCouncil();
    res.json({
      root: council.root,
      memberCount: council.members.length,
      members: council.members.map(m => ({
        address: m.address,
        commitment: m.commitment
      }))
    });
  } catch (error) {
    logger.error('Error getting council:', error);
    res.status(500).json({ error: 'Failed to get council info' });
  }
});

/**
 * POST /vote
 * Submit a signed vote from a council member
 *
 * Body:
 * {
 *   "bundleId": 1,
 *   "proposalId": 5,
 *   "voterAddress": "0x...",
 *   "vote": 1,  // 0 = reject, 1 = approve
 *   "signature": "0x...",
 *   "nullifier": "0x..."
 * }
 */
app.post('/vote', async (req, res) => {
  try {
    const { bundleId, proposalId, voterAddress, vote, signature, nullifier } = req.body;

    // Validate inputs
    if (!bundleId || !proposalId || !voterAddress || vote === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (vote !== 0 && vote !== 1) {
      return res.status(400).json({ error: 'Vote must be 0 (reject) or 1 (approve)' });
    }

    // Verify council membership
    const isMember = await councilManager.verifyMember(voterAddress);
    if (!isMember) {
      return res.status(403).json({ error: 'Not a council member' });
    }

    // Verify signature (in production, verify EIP-712 signature)
    // For MVP, we skip this and assume the coordinator verifies off-chain

    // Check for double voting
    const hasVoted = await voteAggregator.hasVoted(bundleId, proposalId, voterAddress);
    if (hasVoted) {
      return res.status(400).json({ error: 'Already voted on this proposal' });
    }

    // Record the vote
    await voteAggregator.recordVote({
      bundleId,
      proposalId,
      voterAddress,
      vote,
      signature,
      nullifier,
      timestamp: Date.now()
    });

    logger.info(`Vote recorded: ${voterAddress} voted ${vote ? 'approve' : 'reject'} on proposal ${proposalId}`);

    // Check if quorum is reached
    const voteCount = await voteAggregator.getVoteCount(bundleId, proposalId);
    const quorum = parseInt(process.env.SHARIA_QUORUM || '3');

    if (voteCount.approvals >= quorum) {
      logger.info(`Quorum reached for bundle ${bundleId}, proposal ${proposalId}`);

      // Automatically generate proof
      const proof = await proofGenerator.generateProof({
        bundleId,
        proposalId,
        votes: await voteAggregator.getVotes(bundleId, proposalId),
        councilRoot: councilManager.getRoot(),
        quorumThreshold: quorum
      });

      // Optionally publish to blockchain
      if (process.env.AUTO_PUBLISH === 'true') {
        await blockchainPublisher.publishProof(proof);
      }

      return res.json({
        success: true,
        quorumReached: true,
        proof: proof.publicSignals,
        txHash: proof.txHash
      });
    }

    res.json({
      success: true,
      quorumReached: false,
      voteCount: voteCount,
      quorum: quorum
    });
  } catch (error) {
    logger.error('Error processing vote:', error);
    res.status(500).json({ error: 'Failed to process vote' });
  }
});

/**
 * POST /proof/generate
 * Manually trigger proof generation for a bundle/proposal
 *
 * Body:
 * {
 *   "bundleId": 1,
 *   "proposalId": 5
 * }
 */
app.post('/proof/generate', async (req, res) => {
  try {
    const { bundleId, proposalId } = req.body;

    const votes = await voteAggregator.getVotes(bundleId, proposalId);
    if (votes.length === 0) {
      return res.status(404).json({ error: 'No votes found for this proposal' });
    }

    const quorum = parseInt(process.env.SHARIA_QUORUM || '3');
    const proof = await proofGenerator.generateProof({
      bundleId,
      proposalId,
      votes,
      councilRoot: councilManager.getRoot(),
      quorumThreshold: quorum
    });

    res.json({
      success: true,
      proof: proof.proof,
      publicSignals: proof.publicSignals
    });
  } catch (error) {
    logger.error('Error generating proof:', error);
    res.status(500).json({ error: 'Failed to generate proof' });
  }
});

/**
 * POST /proof/publish
 * Publish a generated proof to blockchain
 *
 * Body:
 * {
 *   "bundleId": 1,
 *   "proposalId": 5,
 *   "proof": {...},
 *   "publicSignals": [...],
 *   "campaignType": 1
 * }
 */
app.post('/proof/publish', async (req, res) => {
  try {
    const { bundleId, proposalId, proof, publicSignals, campaignType } = req.body;

    const txHash = await blockchainPublisher.publishProof({
      bundleId,
      proposalId,
      proof,
      publicSignals,
      campaignType
    });

    res.json({
      success: true,
      txHash
    });
  } catch (error) {
    logger.error('Error publishing proof:', error);
    res.status(500).json({ error: 'Failed to publish proof' });
  }
});

/**
 * GET /votes/:bundleId/:proposalId
 * Get current vote status for a proposal (excluding individual voter privacy)
 */
app.get('/votes/:bundleId/:proposalId', async (req, res) => {
  try {
    const { bundleId, proposalId } = req.params;

    const voteCount = await voteAggregator.getVoteCount(bundleId, proposalId);
    const quorum = parseInt(process.env.SHARIA_QUORUM || '3');

    res.json({
      bundleId: parseInt(bundleId),
      proposalId: parseInt(proposalId),
      approvals: voteCount.approvals,
      rejections: voteCount.rejections,
      total: voteCount.approvals + voteCount.rejections,
      quorum,
      quorumReached: voteCount.approvals >= quorum
    });
  } catch (error) {
    logger.error('Error getting vote status:', error);
    res.status(500).json({ error: 'Failed to get vote status' });
  }
});

/**
 * POST /council/setup
 * Initialize or update council membership
 *
 * Body:
 * {
 *   "members": [
 *     { "address": "0x...", "secret": "..." },
 *     ...
 *   ]
 * }
 */
app.post('/council/setup', async (req, res) => {
  try {
    const { members } = req.body;

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Invalid members array' });
    }

    const result = await councilManager.setupCouncil(members);

    res.json({
      success: true,
      root: result.root,
      memberCount: members.length
    });
  } catch (error) {
    logger.error('Error setting up council:', error);
    res.status(500).json({ error: 'Failed to setup council' });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`Sharia Council Coordinator listening on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`Council root: ${councilManager.getRoot()}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  voteAggregator.close();
  process.exit(0);
});
