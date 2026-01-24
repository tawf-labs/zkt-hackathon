'use client';

import { useCallback, useState } from 'react';
import { useContractRead } from 'wagmi';
import { DonationABI, DONATION_CONTRACT_ADDRESS, type Campaign } from '@/lib/donate';

export const useCampaign = (campaignId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(false);

  const { data: campaign, isLoading: isReadLoading, refetch } = useContractRead({
    address: DONATION_CONTRACT_ADDRESS as `0x${string}`,
    abi: DonationABI,
    functionName: 'campaigns',
    args: campaignId ? [campaignId as `0x${string}`] : undefined,
    enabled: !!campaignId,
  });

  const reloadCampaign = useCallback(async () => {
    setIsLoading(true);
    try {
      await refetch();
    } finally {
      setIsLoading(false);
    }
  }, [refetch]);

  return {
    campaign: campaign as Campaign | undefined,
    isLoading: isReadLoading || isLoading,
    refetch: reloadCampaign,
  };
};
