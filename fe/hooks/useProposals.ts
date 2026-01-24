"use client";

import { useState, useEffect } from "react";
import { useReadContracts } from "wagmi";
import { CONTRACT_ADDRESSES, ZKTCoreABI } from "@/lib/abi";
import { Proposal, ProposalStatus, KYCStatus, CampaignType, proposalToProposalData, ProposalData } from "@/lib/types";

/**
 * Hook to fetch a single proposal by ID
 */
function useProposalData(proposalId: number) {
  const result = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.ZKTCore,
        abi: ZKTCoreABI,
        functionName: "getProposal",
        args: [BigInt(proposalId)],
      },
    ],
    query: {
      staleTime: 30_000,
      gcTime: 300_000,
      enabled: proposalId >= 0,
    },
  });

  return result;
}

/**
 * Hook to fetch multiple proposals
 * @param proposalIds - Array of proposal IDs to fetch
 */
export function useProposals(proposalIds: number[] = [0, 1, 2, 3]) {
  const proposals = proposalIds.map((id) => useProposalData(id));

  const isLoading = proposals.some((p) => p.isLoading);
  const error = proposals.find((p) => p.error)?.error;

  const data: ProposalData[] = proposals
    .map((proposal, index) => {
      if (!proposal.data || proposal.data[0].status !== "success") {
        return null;
      }

      const proposalData = proposal.data[0].result as any;

      if (!proposalData || typeof proposalData !== "object") {
        return null;
      }

      // Map the contract response to our Proposal interface
      const prop: Proposal = {
        proposalId: BigInt(proposalIds[index]),
        organizer: proposalData.organizer || "",
        title: proposalData.title || `Proposal ${proposalIds[index]}`,
        description: proposalData.description || "",
        fundingGoal: proposalData.fundingGoal || BigInt(0),
        isEmergency: proposalData.isEmergency || false,
        mockZKKYCProof: proposalData.mockZKKYCProof || "",
        zakatChecklistItems: proposalData.zakatChecklistItems || [],
        createdAt: proposalData.createdAt || BigInt(0),
        status: proposalData.status !== undefined ? Number(proposalData.status) : ProposalStatus.Draft,
        kycStatus: proposalData.kycStatus !== undefined ? Number(proposalData.kycStatus) : KYCStatus.Pending,
        campaignType: proposalData.campaignType !== undefined ? Number(proposalData.campaignType) : CampaignType.Normal,
        poolId: proposalData.poolId || BigInt(0),
        communityVoteStartTime: proposalData.communityVoteStartTime || BigInt(0),
        communityVoteEndTime: proposalData.communityVoteEndTime || BigInt(0),
        votesFor: proposalData.votesFor || BigInt(0),
        votesAgainst: proposalData.votesAgainst || BigInt(0),
        votesAbstain: proposalData.votesAbstain || BigInt(0),
        communityVotePassed: proposalData.communityVotePassed || false,
      };

      return proposalToProposalData(prop);
    })
    .filter((p): p is ProposalData => p !== null);

  const refetch = () => {
    proposals.forEach((p) => p.refetch());
  };

  return {
    proposals: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch a single proposal
 * @param proposalId - The proposal ID to fetch
 */
export function useProposal(proposalId: number) {
  const { proposals, isLoading, error, refetch } = useProposals([proposalId]);

  return {
    proposal: proposals[0],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get the total proposal count
 */
export function useProposalCount() {
  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.ZKTCore,
        abi: ZKTCoreABI,
        functionName: "proposalCount",
      },
    ],
    query: {
      staleTime: 30_000,
    },
  });

  const count = data?.[0]?.status === "success" ? data[0].result : BigInt(0);

  return {
    proposalCount: count as bigint,
    isLoading,
  };
}

/**
 * Hook to get proposals filtered by status
 * @param status - The ProposalStatus to filter by
 */
export function useProposalsByStatus(status: ProposalStatus) {
  const { proposalCount, isLoading: isLoadingCount } = useProposalCount();
  const proposalCountNum = proposalCount ? Number(proposalCount) : 0;

  // Fetch all proposals (in production, this would be optimized)
  const proposalIds = proposalCountNum > 0 ? Array.from({ length: Math.min(proposalCountNum, 50) }, (_, i) => i) : [];
  const { proposals, isLoading, refetch } = useProposals(proposalIds);

  // Filter by status
  const filteredProposals = proposals.filter(p => p.status === status);

  return {
    proposals: filteredProposals,
    isLoading: isLoading || isLoadingCount,
    refetch,
  };
}

/**
 * Hook to get proposals by organizer address
 * @param organizerAddress - The address of the proposal organizer
 */
export function useProposalsByOrganizer(organizerAddress?: string) {
  const { proposalCount, isLoading: isLoadingCount } = useProposalCount();
  const proposalCountNum = proposalCount ? Number(proposalCount) : 0;

  // Fetch all proposals (in production, this would be optimized with event filtering)
  const proposalIds = proposalCountNum > 0 ? Array.from({ length: Math.min(proposalCountNum, 50) }, (_, i) => i) : [];
  const { proposals, isLoading, refetch } = useProposals(proposalIds);

  // Filter by organizer
  const filteredProposals = organizerAddress
    ? proposals.filter(p => p.organizer.toLowerCase() === organizerAddress.toLowerCase())
    : proposals;

  return {
    proposals: filteredProposals,
    isLoading: isLoading || isLoadingCount,
    refetch,
  };
}

/**
 * Hook to get proposal timeline (status change history)
 * Note: This requires tracking status change events or a contract mapping
 * @param proposalId - The proposal ID to get timeline for
 */
export function useProposalTimeline(proposalId: number | bigint) {
  const [timeline, setTimeline] = useState<Array<{
    status: ProposalStatus;
    timestamp: number;
    transactionHash?: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!proposalId && proposalId !== 0) return;

    // In a full implementation, this would:
    // 1. Query ProposalStatusUpdated events for this proposalId
    // 2. Parse events to extract status, timestamp, and transaction hash
    // 3. Return sorted timeline of status changes

    // For now, returning empty array as placeholder
    setTimeline([]);
  }, [proposalId]);

  return { timeline, isLoading };
}

/**
 * Hook to get active proposals (in voting period)
 */
export function useActiveProposals() {
  return useProposalsByStatus(ProposalStatus.CommunityVote);
}

/**
 * Hook to get proposals pending review
 */
export function usePendingReviewProposals() {
  return useProposalsByStatus(ProposalStatus.CommunityPassed);
}

/**
 * Hook to get approved proposals
 */
export function useApprovedProposals() {
  const { proposals, isLoading, refetch } = useProposalsByStatus(ProposalStatus.ShariaApproved);
  // Also include PoolCreated and Completed as "approved"
  const { proposals: poolProposals, isLoading: isLoadingPools } = useProposalsByStatus(ProposalStatus.PoolCreated);
  const { proposals: completedProposals, isLoading: isLoadingCompleted } = useProposalsByStatus(ProposalStatus.Completed);

  return {
    proposals: [...proposals, ...poolProposals, ...completedProposals],
    isLoading: isLoading || isLoadingPools || isLoadingCompleted,
    refetch,
  };
}
