"use client";

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
