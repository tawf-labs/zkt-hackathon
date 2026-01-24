'use client';

import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, ZKTCoreABI } from '@/lib/abi';
import type { CampaignPool } from '@/lib/types';

/**
 * Hook to fetch campaign pool status from ZKTCore
 * Returns pool information to check if donations are allowed
 */
export function useCampaignStatus(poolId: string | number | null) {
  const {
    data: poolData,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.ZKTCore as `0x${string}`,
    abi: ZKTCoreABI,
    functionName: 'getPool',
    args: poolId !== null ? [BigInt(poolId)] : undefined,
    query: {
      enabled: poolId !== null,
      staleTime: 30_000,
      gcTime: 300_000,
      refetchOnWindowFocus: true,
    },
  });

  const pool: CampaignPool | null = poolData
    ? {
        poolId: poolData[0] as bigint,
        proposalId: poolData[1] as bigint,
        organizer: poolData[2] as string,
        fundingGoal: poolData[3] as bigint,
        raisedAmount: poolData[4] as bigint,
        campaignType: poolData[5] as number,
        campaignTitle: poolData[6] as string,
        isActive: poolData[7] as boolean,
        createdAt: poolData[8] as bigint,
        donors: poolData[9] as string[],
        fundsWithdrawn: poolData[10] as boolean,
      }
    : null;

  return {
    pool,
    statusInfo: pool ? {
      status: pool.isActive ? 'active' : 'inactive',
      description: pool.isActive ? 'Accepting donations' : 'Campaign not accepting donations',
      canDonate: pool.isActive,
    } : null,
    canDonate: pool?.isActive ?? false,
    isLoading,
    error,
    refetch,
  };
}
