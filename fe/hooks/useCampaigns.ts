"use client";

import { useEffect, useState, useCallback } from "react";

// Campaign structure
export interface Campaign {
  id: number;
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
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all campaigns from API
  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/campaigns', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error fetching campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refetch campaigns
  const refetch = useCallback(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Initial fetch
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Polling for real-time updates (every 15 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCampaigns();
    }, 15_000);

    return () => clearInterval(interval);
  }, [fetchCampaigns]);

  return {
    campaigns,
    isLoading,
    error,
    refetch,
  };
}

// Hook for single campaign
export function useCampaign(poolId: number) {
  const { campaigns, isLoading, error, refetch } = useCampaigns([poolId]);

  return {
    campaign: campaigns[0],
    isLoading,
    error,
    refetch,
  };
}
