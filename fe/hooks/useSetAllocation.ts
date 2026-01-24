'use client';

import { useCallback, useState } from 'react';
import { useContractWrite, useAccount } from 'wagmi';
import { DonationABI, DONATION_CONTRACT_ADDRESS, type AllocationParams } from '@/lib/donate';
import { toast } from '@/components/ui/use-toast';

interface UseSetAllocationOptions {
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

export const useSetAllocation = (options?: UseSetAllocationOptions) => {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  const { write, isPending } = useContractWrite({
    address: DONATION_CONTRACT_ADDRESS as `0x${string}`,
    abi: DonationABI,
    functionName: 'setAllocation',
    onSuccess: (hash) => {
      toast({
        title: 'Success',
        description: `Allocation set! Hash: ${hash}`,
      });
      options?.onSuccess?.(hash);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set allocation',
        variant: 'destructive',
      });
      options?.onError?.(error);
    },
  });

  const setAllocation = useCallback(
    async (params: AllocationParams) => {
      if (!address) {
        toast({
          title: 'Error',
          description: 'Please connect your wallet',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);
      try {
        write({
          args: [
            params.campaignId as `0x${string}`,
            params.ngoId as `0x${string}`,
            params.bps,
          ],
        });
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
    [address, write]
  );

  return {
    setAllocation,
    isLoading: isLoading || isPending,
  };
};
