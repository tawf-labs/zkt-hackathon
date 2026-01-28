/**
 * BlockchainPublisher - Publishes ZK proofs to blockchain
 */

import { ethers } from 'ethers';

export class BlockchainPublisher {
  constructor(rpcUrl, privateKey, contractAddress) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contractAddress = contractAddress;

    // Minimal ABI for the proof submission function
    this.abi = [
      'function submitShariaReviewProof(uint256 bundleId, uint256 proposalId, uint256 approvalCount, uint8 campaignType, tuple(uint256[2],uint256[2][2],uint256[2]) proof) external returns (bool)',
      'function hasVerifiedProof(uint256 bundleId, uint256 proposalId) external view returns (bool)'
    ];

    this.contract = new ethers.Contract(contractAddress, this.abi, this.wallet);
  }

  /**
   * Publish a proof to the blockchain
   */
  async publishProof(proofData) {
    const { bundleId, proposalId, proof, publicSignals, campaignType = 1 } = proofData;

    // Check if already verified
    const alreadyVerified = await this.contract.hasVerifiedProof(bundleId, proposalId);
    if (alreadyVerified) {
      throw new Error('Proof already verified for this proposal');
    }

    // Format proof for contract
    const formattedProof = [
      proof.pi_a,
      proof.pi_b,
      proof.pi_c
    ];

    // Extract approvalCount from publicSignals
    // Index depends on circuit output order
    const approvalCount = publicSignals[2] || proofData.approvalCount;

    // Submit transaction
    const tx = await this.contract.submitShariaReviewProof(
      bundleId,
      proposalId,
      approvalCount,
      campaignType,
      formattedProof
    );

    console.log(`Transaction submitted: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  /**
   * Get the current gas price
   */
  async getGasPrice() {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice;
  }
}
