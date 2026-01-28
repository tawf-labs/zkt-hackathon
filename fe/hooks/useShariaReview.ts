'use client';

import { useCallback, useState } from 'react';
import { useWriteContract, useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, ZKTCoreABI } from '@/lib/abi';
import { KYCStatus, CampaignType, getKYCStatusLabel, getCampaignTypeLabel } from '@/lib/types';
import { toast } from '@/components/ui/use-toast';

interface UseShariaReviewOptions {
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Get Sharia review bundle info (if bundles are implemented)
 */
export function useShariaBundle(bundleId: number | bigint) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.ZKTCore,
    abi: ZKTCoreABI,
    functionName: 'getBundle',
    args: [BigInt(bundleId)],
    query: {
      enabled: !!bundleId,
    },
  });

  return { bundle: data, isLoading, refetch };
}

export const useShariaReview = (options?: UseShariaReviewOptions) => {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  const { writeContractAsync } = useWriteContract();

  /**
   * Update KYC status for a proposal (KYC Oracle only)
   */
  const updateKYCStatus = useCallback(
    async (proposalId: number | bigint, newStatus: KYCStatus, notes: string) => {
      if (!isConnected || !address) {
        const error = new Error('Wallet not connected');
        toast({
          title: 'Error',
          description: 'Please connect your wallet first',
          variant: 'destructive',
        });
        options?.onError?.(error);
        return null;
      }

      setIsLoading(true);

      try {
        console.log('Updating KYC status:', {
          proposalId: proposalId.toString(),
          newStatus,
          notes,
        });

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.ZKTCore,
          abi: ZKTCoreABI,
          functionName: 'updateKYCStatus',
          args: [BigInt(proposalId), newStatus, notes],
        });

        toast({
          title: 'KYC Status Updated ✅',
          description: `Proposal ${proposalId} KYC status: ${getKYCStatusLabel(newStatus)}`,
        });

        console.log('KYC update transaction submitted:', hash);

        options?.onSuccess?.(hash);

        return { txHash: hash };

      } catch (error: any) {
        console.error('Error updating KYC status:', error);

        let errorMessage = 'Failed to update KYC status';
        if (error?.message?.includes('user rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error?.message?.includes('Only KYC oracle')) {
          errorMessage = 'Only KYC oracle can perform this action';
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast({
          title: 'KYC Update Failed',
          description: errorMessage,
          variant: 'destructive',
        });

        options?.onError?.(error);
        return null;

      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, address, writeContractAsync, options]
  );

  /**
   * Review a proposal (Sharia Council only)
   */
  const reviewProposal = useCallback(
    async (
      bundleId: number | bigint,
      proposalId: number | bigint,
      approved: boolean,
      campaignType: CampaignType,
      mockZKReviewProof: string
    ) => {
      if (!isConnected || !address) {
        const error = new Error('Wallet not connected');
        toast({
          title: 'Error',
          description: 'Please connect your wallet first',
          variant: 'destructive',
        });
        options?.onError?.(error);
        return null;
      }

      setIsLoading(true);

      try {
        console.log('Reviewing proposal:', {
          bundleId: bundleId.toString(),
          proposalId: proposalId.toString(),
          approved,
          campaignType: getCampaignTypeLabel(campaignType),
          mockZKReviewProof,
        });

        // Ensure proof is a valid bytes32 hex string or a default zero bytes32
        const proofArg = mockZKReviewProof && mockZKReviewProof.startsWith('0x') && mockZKReviewProof.length === 66
          ? mockZKReviewProof as `0x${string}`
          : '0x0000000000000000000000000000000000000000000000000000000000000000';

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.ZKTCore,
          abi: ZKTCoreABI,
          functionName: 'reviewProposal',
          args: [
            BigInt(bundleId),
            BigInt(proposalId),
            approved,
            campaignType,
            proofArg
          ],
        });

        toast({
          title: approved ? 'Proposal Approved ✅' : 'Proposal Rejected ❌',
          description: `Proposal ${proposalId} has been ${approved ? 'approved' : 'rejected'} by Sharia Council.`,
        });

        console.log('Review transaction submitted:', hash);

        options?.onSuccess?.(hash);

        return { txHash: hash };

      } catch (error: any) {
        console.error('Error reviewing proposal:', error);

        let errorMessage = 'Failed to review proposal';
        if (error?.message?.includes('user rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error?.message?.includes('Only Sharia Council')) {
          errorMessage = 'Only Sharia Council members can perform this action';
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast({
          title: 'Review Failed',
          description: errorMessage,
          variant: 'destructive',
        });

        options?.onError?.(error);
        return null;

      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, address, writeContractAsync, options]
  );

  /**
   * Finalize Sharia Bundle
   */
  const finalizeShariaBundle = useCallback(async (bundleId: number | bigint) => {
      if (!isConnected || !address) {
        const error = new Error('Wallet not connected');
        toast({
          title: 'Error',
          description: 'Please connect your wallet first',
          variant: 'destructive',
        });
        options?.onError?.(error);
        return null;
      }

      setIsLoading(true);

      try {
        console.log('Finalizing Sharia bundle:', bundleId.toString());

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.ZKTCore,
          abi: ZKTCoreABI,
          functionName: 'finalizeShariaBundle',
          args: [BigInt(bundleId)],
        });

        toast({
          title: 'Bundle Finalized ✅',
          description: `Sharia bundle ${bundleId} has been finalized.`,
        });

        console.log('Finalize transaction submitted:', hash);
        options?.onSuccess?.(hash);

        return { txHash: hash };

      } catch (error: any) {
         console.error('Error finalizing bundle:', error);
         let errorMessage = 'Failed to finalize bundle';
         if (error?.message?.includes('user rejected')) errorMessage = 'Transaction rejected by user';
         else if (error?.message) errorMessage = error.message;

         toast({
          title: 'Finalization Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        options?.onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
  }, [isConnected, address, writeContractAsync, options]);


  /**
   * Check if address is a Sharia Council member
   */
  const isShariaCouncilMember = useCallback(async () => {
    // This would need a view function in the contract or role check
    // For now, returning false as placeholder
    return false;
  }, []);

  /**
   * Check if address is a KYC Oracle
   */
  const isKYCOracle = useCallback(async () => {
    // This would need a view function in the contract or role check
    // For now, returning false as placeholder
    return false;
  }, []);

  /**
   * Get proposals pending Sharia review
   */
  const getPendingShariaReviews = useCallback(async () => {
    return [];
  }, []);

  /**
   * Get bundle by proposal ID
   */
  const getBundleByProposalId = useCallback(async (proposalId: number | bigint) => {
    // For now, returning the proposalId itself as the bundleId placeholder
    return BigInt(proposalId);
  }, []);

  /**
   * Submit Sharia Council vote on a proposal (Wrapper for reviewProposal)
   */
  const submitShariaVote = useCallback(async (
    proposalId: number | bigint,
    approved: boolean,
    mockZKReviewProof: string = ''
  ) => {
    try {
      // Get the bundle (placeholder logic used here, ideally fetch from contract)
      const bundleId = await getBundleByProposalId(proposalId);
      
      // Default to ZakatCompliant for now if not specified in this wrapper
      const campaignType = CampaignType.ZakatCompliant; 

      return await reviewProposal(bundleId, proposalId, approved, campaignType, mockZKReviewProof);
    } catch (error: any) {
       console.error('Error in submitShariaVote:', error);
       toast({
          title: 'Error',
          description: 'Could not determine bundle ID for proposal',
          variant: 'destructive'
       });
       return null;
    }
  }, [getBundleByProposalId, reviewProposal]);

  return {
    updateKYCStatus,
    reviewProposal,
    finalizeShariaBundle,
    submitShariaVote,
    isShariaCouncilMember,
    isKYCOracle,
    getPendingShariaReviews,
    getBundleByProposalId,
    isLoading,
  };
};