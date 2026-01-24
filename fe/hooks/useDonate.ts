'use client';

import { useCallback } from 'react';
import { useWallet } from '@/components/providers/web3-provider';

interface UseDonateOptions {
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

export const useDonate = (options?: UseDonateOptions) => {
  const { donate: contextDonate, isDonating } = useWallet();

  const donate = useCallback(
    async (params: any) => {
      try {
        const result = await contextDonate(params);
        options?.onSuccess?.(result.txHash);
        return result;
      } catch (error) {
        options?.onError?.(error as Error);
        throw error;
      }
    },
    [contextDonate, options]
  );

  return {
    donate,
    isLoading: isDonating,
  };
};
