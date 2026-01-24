'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '@/components/providers/web3-provider';
import { toast } from '@/components/ui/use-toast';

interface UseLockAllocationsOptions {
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to lock allocations for a campaign
 * Must be called after:
 * 1. Safe creates the campaign (via createCampaign)
 * 2. Campaign exists on-chain
 * 
 * This will:
 * 1. Set allocation to 100% (10000 bps) to organization
 * 2. Lock the allocation so donations can be accepted
 */
export const useLockAllocations = (options?: UseLockAllocationsOptions) => {
  const { lockCampaignAllocations, isConnected, address } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const lockAllocations = useCallback(
    async (campaignIdHash: string) => {
      if (!isConnected || !address) {
        const errorMsg = 'Please connect your wallet first';
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        throw new Error(errorMsg);
      }

      if (!campaignIdHash) {
        const errorMsg = 'Campaign ID is required';
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        throw new Error(errorMsg);
      }

      setIsLoading(true);
      
      try {
        console.log('[useLockAllocations] Locking campaign allocations for:', campaignIdHash);
        
        const result = await lockCampaignAllocations(campaignIdHash);
        
        toast({
          title: '🔒 Success!',
          description: 'Campaign allocations locked. Ready for donations!',
        });
        
        options?.onSuccess?.(result.txHash);
        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[useLockAllocations] Error:', errorMsg);
        
        toast({
          title: 'Error',
          description: errorMsg || 'Failed to lock allocations',
          variant: 'destructive',
        });
        
        options?.onError?.(error as Error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [lockCampaignAllocations, isConnected, address, options]
  );

  return {
    lockAllocations,
    isLoading,
  };
};
