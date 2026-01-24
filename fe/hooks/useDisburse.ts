'use client';

import { useCallback, useState } from 'react';
import { useContractWrite, useAccount } from 'wagmi';
import { DonationABI, DONATION_CONTRACT_ADDRESS } from '@/lib/donate';
import { toast } from '@/components/ui/use-toast';

interface UseDisburseOptions {
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

export const useDisburse = (options?: UseDisburseOptions) => {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  const { write, isPending } = useContractWrite({
    address: DONATION_CONTRACT_ADDRESS as `0x${string}`,
    abi: DonationABI,
    functionName: 'disburse',
    onSuccess: (hash) => {
      toast({
        title: 'Success',
        description: `Disbursement completed! Hash: ${hash}`,
      });
      options?.onSuccess?.(hash);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disburse',
        variant: 'destructive',
      });
      options?.onError?.(error);
    },
  });

  const disburse = useCallback(
    async (campaignId: string, ngoIds: string[]) => {
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
            campaignId as `0x${string}`,
            ngoIds as `0x${string}`[],
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
    disburse,
    isLoading: isLoading || isPending,
  };
};
