"use client";

import { useEffect, useState, useCallback } from "react";
import { useReadContracts } from "wagmi";
import { CONTRACT_ADDRESSES, ZKTCoreABI } from "@/lib/abi";
import { CampaignPool, poolToCampaignPoolData } from "@/lib/types";

// Campaign structure (UI-friendly)
export interface Campaign {
  id: number;
  poolId: number;
  title: string;
  description: string;
  imageUrl: string;
  image: string;
  organizationName: string;
  organizationAddress: string;
  category: string;
  location: string;
  raised: number;
  goal: number;
  donors: number;
  daysLeft: number;
  isActive: boolean;
  isVerified: boolean;
  startDate: number;
  endDate: number;
  campaignType: number;
}

/**
 * Hook to fetch all campaign pools from ZKTCore contract
 */
export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get pool count first
  const { data: poolCount, isLoading: isCountLoading, refetch: refetchCount } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.ZKTCore,
        abi: ZKTCoreABI,
        functionName: "poolCount",
      },
    ],
  });

  const count = poolCount?.[0]?.result;
  const poolCountNum = count ? Number(count) : 0;

  // Fetch all pools
  const poolIds = poolCountNum > 0 ? Array.from({ length: poolCountNum }, (_, i) => i + 1) : [];

  // Use multicall to fetch all pools at once
  const poolContracts = poolIds.map((id) => ({
    address: CONTRACT_ADDRESSES.ZKTCore,
    abi: ZKTCoreABI,
    functionName: "getPool" as const,
    args: [BigInt(id)] as const,
  }));

  const { data: pools, isLoading: isPoolsLoading, refetch: refetchPools } = useReadContracts({
    contracts: poolContracts,
    query: {
      enabled: poolIds.length > 0,
      staleTime: 30_000,
    },
  });

  // Convert contract data to UI format
  useEffect(() => {
    if (!pools || pools.length === 0) {
      setCampaigns([]);
      setIsLoading(false);
      return;
    }

    try {
      const convertedCampaigns: Campaign[] = pools
        .filter((result) => result.status === "success" && result.result)
        .map((result, index) => {
          const pool = result.result as any;
          const poolId = poolIds[index];

          return {
            id: poolId,
            poolId: poolId,
            title: pool.campaignTitle || `Campaign ${poolId}`,
            description: `Campaign pool for ${pool.campaignTitle || 'charitable cause'}`,
            imageUrl: "/placeholder.jpg",
            image: "/placeholder.jpg",
            organizationName: pool.organizer
              ? `${pool.organizer.slice(0, 6)}...${pool.organizer.slice(-4)}`
              : "Unknown",
            organizationAddress: pool.organizer || "",
            category: pool.campaignType === 1 ? "Zakat" : "General",
            location: "Indonesia",
            raised: Number(pool.raisedAmount) / 1e18,
            goal: Number(pool.fundingGoal) / 1e18,
            donors: pool.donors?.length || 0,
            daysLeft: 30, // Default value
            isActive: pool.isActive || false,
            isVerified: pool.campaignType === 1,
            startDate: Number(pool.createdAt),
            endDate: Number(pool.createdAt) + 30 * 24 * 60 * 60, // 30 days from creation
            campaignType: pool.campaignType,
          };
        });

      setCampaigns(convertedCampaigns);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      console.error("Error converting campaigns:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pools, poolIds]);

  // Refetch campaigns
  const refetch = useCallback(() => {
    refetchCount();
    refetchPools();
  }, [refetchCount, refetchPools]);

  return {
    campaigns,
    isLoading: isCountLoading || isPoolsLoading || isLoading,
    error,
    refetch,
  };
}

// Hook for single campaign (by poolId)
export function useCampaign(poolId: number) {
  const { campaigns, isLoading, error, refetch } = useCampaigns();

  return {
    campaign: campaigns.find((c) => c.poolId === poolId),
    isLoading,
    error,
    refetch,
  };
}
