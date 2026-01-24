"use client";

import { useAccount, useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES, VotingTokenABI } from "@/lib/abi";

export function useVotingPower() {
  const { address } = useAccount();

  const {
    data: votingPower,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.VotingToken,
    abi: VotingTokenABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 30_000, // 30 seconds
      gcTime: 300_000, // 5 minutes
      refetchOnWindowFocus: true,
    },
  });

  return {
    votingPower: votingPower as bigint | undefined,
    formattedVotingPower: votingPower ? votingPower.toString() : "0",
    isLoading,
    error,
    refetch,
  };
}
