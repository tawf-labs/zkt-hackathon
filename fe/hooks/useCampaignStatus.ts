'use client';

import { useReadContract } from 'wagmi';
import { DONATION_CONTRACT_ADDRESS, DonationABI, type Campaign } from '@/lib/donate';
import { getCampaignStatus, type CampaignStatusInfo } from '@/lib/campaign-status';

/**
 * Hook to fetch campaign status from the contract
 * Returns comprehensive status information including allocation state
 */
export function useCampaignStatus(campaignIdHash: string | null) {
  const {
    data: campaignData,
    isLoading: isLoadingCampaign,
    error: campaignError,
    refetch: refetchCampaign,
  } = useReadContract({
    address: DONATION_CONTRACT_ADDRESS as `0x${string}`,
    abi: DonationABI,
    functionName: 'campaigns',
    args: campaignIdHash ? [campaignIdHash as `0x${string}`] : undefined,
    query: {
      enabled: !!campaignIdHash,
      staleTime: 30_000, // 30 seconds
      gcTime: 300_000, // 5 minutes
      refetchOnWindowFocus: true,
    },
  });

  const {
    data: totalBps,
    isLoading: isLoadingBps,
    error: bpsError,
    refetch: refetchBps,
  } = useReadContract({
    address: DONATION_CONTRACT_ADDRESS as `0x${string}`,
    abi: DonationABI,
    functionName: 'totalBps',
    args: campaignIdHash ? [campaignIdHash as `0x${string}`] : undefined,
    query: {
      enabled: !!campaignIdHash,
      staleTime: 30_000,
      gcTime: 300_000,
      refetchOnWindowFocus: true,
    },
  });

  // Parse campaign data
  const campaign: Campaign | null = campaignData
    ? {
        exists: campaignData[0] as boolean,
        allocationLocked: campaignData[1] as boolean,
        disbursed: campaignData[2] as boolean,
        closed: campaignData[3] as boolean,
        totalRaised: campaignData[4] as bigint,
        startTime: campaignData[5] as bigint,
        endTime: campaignData[6] as bigint,
      }
    : null;

  // Calculate campaign status
  const statusInfo: CampaignStatusInfo | null = campaign
    ? getCampaignStatus(campaign, Number(totalBps || 0))
    : null;

  const isLoading = isLoadingCampaign || isLoadingBps;
  const error = campaignError || bpsError;

  const refetch = () => {
    refetchCampaign();
    refetchBps();
  };

  return {
    campaign,
    statusInfo,
    totalBps: Number(totalBps || 0),
    allocationLocked: campaign?.allocationLocked ?? false,
    canDonate: statusInfo?.canDonate ?? false,
    isLoading,
    error,
    refetch,
  };
}
