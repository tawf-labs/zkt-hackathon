'use client';

import { useCallback, useState } from 'react';
import { useWriteContract, useAccount, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, ZKTCoreABI } from '@/lib/abi';
import { VoteSupport, getVoteSupportLabel } from '@/lib/types';
import { toast } from '@/components/ui/use-toast';

interface UseVotingOptions {
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Check if an address has voted on a proposal
 */
export function useHasVoted(proposalId: number | bigint, voterAddress?: string) {
  const { data } = useReadContract({
    address: CONTRACT_ADDRESSES.ZKTCore,
    abi: ZKTCoreABI,
    functionName: 'getProposal', // We'll need to check hasVoted mapping if available
    args: [BigInt(proposalId)],
    query: {
      enabled: !!voterAddress,
    },
  });

  // Note: The contract needs to expose hasVoted mapping or we track this locally
  return { hasVoted: false };
}

export const useVoting = (options?: UseVotingOptions) => {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVoteProposalId, setPendingVoteProposalId] = useState<bigint | null>(null);

  const { writeContractAsync } = useWriteContract();
  const { writeContractAsync: finalizeAsync } = useWriteContract();

  /**
   * Cast a vote on a proposal
   * @param proposalId - The proposal ID to vote on
   * @param support - 0=against, 1=for, 2=abstain
   */
  const castVote = useCallback(
    async (proposalId: number | bigint, support: VoteSupport) => {
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
      setPendingVoteProposalId(BigInt(proposalId));

      try {
        console.log('Casting vote:', {
          proposalId: proposalId.toString(),
          support,
          supportLabel: getVoteSupportLabel(support),
          voter: address,
        });

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.ZKTCore,
          abi: ZKTCoreABI,
          functionName: 'castVote',
          args: [BigInt(proposalId), support],
        });

        toast({
          title: 'Vote Cast! 🗳️',
          description: `You voted ${getVoteSupportLabel(support).toLowerCase()} on proposal ${proposalId}`,
        });

        console.log('Vote transaction submitted:', hash);

        options?.onSuccess?.(hash);

        return { txHash: hash };

      } catch (error: any) {
        console.error('Error casting vote:', error);

        let errorMessage = 'Failed to cast vote';
        if (error?.message?.includes('user rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error?.message?.includes('Already voted')) {
          errorMessage = 'You have already voted on this proposal';
        } else if (error?.message?.includes('Voting is not active')) {
          errorMessage = 'Voting is not active for this proposal';
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast({
          title: 'Vote Failed',
          description: errorMessage,
          variant: 'destructive',
        });

        options?.onError?.(error);
        return null;

      } finally {
        setIsLoading(false);
        setPendingVoteProposalId(null);
      }
    },
    [isConnected, address, writeContractAsync, options]
  );

  /**
   * Finalize the community vote for a proposal
   * This ends the voting period and tallies the results
   */
  const finalizeCommunityVote = useCallback(
    async (proposalId: number | bigint) => {
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
        console.log('Finalizing community vote for proposal:', proposalId.toString());

        const hash = await finalizeAsync({
          address: CONTRACT_ADDRESSES.ZKTCore,
          abi: ZKTCoreABI,
          functionName: 'finalizeCommunityVote',
          args: [BigInt(proposalId)],
        });

        toast({
          title: 'Vote Finalized! 🏁',
          description: `Community voting for proposal ${proposalId} has ended.`,
        });

        console.log('Finalize transaction submitted:', hash);

        options?.onSuccess?.(hash);

        return { txHash: hash };

      } catch (error: any) {
        console.error('Error finalizing vote:', error);

        let errorMessage = 'Failed to finalize vote';
        if (error?.message?.includes('user rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error?.message?.includes('Voting period not ended')) {
          errorMessage = 'Voting period has not ended yet';
        } else if (error?.message) {
          errorMessage = error.message;
        }

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
    },
    [isConnected, address, finalizeAsync, options]
  );

  /**
   * Submit a proposal for community voting
   * This moves the proposal from Draft to CommunityVote status
   */
  const submitForCommunityVote = useCallback(
    async (proposalId: number | bigint) => {
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
        console.log('Submitting proposal for community vote:', proposalId.toString());

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.ZKTCore,
          abi: ZKTCoreABI,
          functionName: 'submitForCommunityVote',
          args: [BigInt(proposalId)],
        });

        toast({
          title: 'Submitted for Voting! 📢',
          description: `Proposal ${proposalId} is now open for community voting.`,
        });

        console.log('Submit transaction submitted:', hash);

        options?.onSuccess?.(hash);

        return { txHash: hash };

      } catch (error: any) {
        console.error('Error submitting for vote:', error);

        let errorMessage = 'Failed to submit for voting';
        if (error?.message?.includes('user rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error?.message?.includes('KYC not verified')) {
          errorMessage = 'Proposal must be KYC verified first';
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast({
          title: 'Submission Failed',
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

  return {
    castVote,
    finalizeCommunityVote,
    submitForCommunityVote,
    isLoading,
    pendingVoteProposalId,
  };
};
