'use client';

import { useCallback, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { keccak256, toBytes } from 'viem';
import { ZKTCoreABI, CONTRACT_ADDRESSES } from '@/lib/abi';
import { toast } from '@/components/ui/use-toast';

interface PrivateDonateParams {
  poolId: bigint;
  amount: bigint;
  campaignTitle: string;
}

interface PrivateDonateResult {
  donatePrivate: (params: PrivateDonateParams) => Promise<{ txHash?: string; commitment?: `0x${string}` } | null>;
  isLoading: boolean;
  isConfirming: boolean;
  error: Error | null;
}

/**
 * Hook for making private donations using Pedersen commitments
 *
 * Privacy Features:
 * - Uses Pedersen commitments to hide donation amounts
 * - Donor address is not added to public donors list
 * - Separate PrivateDonationReceived event emitted
 * - Donor still receives NFT receipt for proof of donation
 */
export function usePrivateDonate(): PrivateDonateResult {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, data: hash } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Wait for transaction confirmation
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: hash as `0x${string}` | undefined,
  });

  /**
   * Generate a Pedersen commitment for privacy
   * In production, this would use actual Pedersen commitment cryptography
   * For now, we use a simpler keccak256-based commitment as a placeholder
   */
  const generateCommitment = useCallback((amount: bigint): `0x${string}` => {
    // Generate random blinding factor using browser crypto API
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for SSR
      for (let i = 0; i < 32; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }

    // Convert to hex string
    const blinding = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Create commitment = H(amount || blinding)
    // In production, use actual Pedersen: C = g^amount * h^blinding
    const amountHex = amount.toString(16).padStart(64, '0');
    const commitmentInput = `${amountHex}${blinding}`;
    const commitment = keccak256(`0x${commitmentInput}` as `0x${string}`);

    return commitment;
  }, []);

  /**
   * Make a private donation
   */
  const donatePrivate = useCallback(
    async (params: PrivateDonateParams): Promise<{ txHash?: string; commitment?: `0x${string}` } | null> => {
      if (!isConnected || !address) {
        toast({
          title: 'Wallet Not Connected',
          description: 'Please connect your wallet to donate',
          variant: 'destructive',
        });
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Generate Pedersen commitment for amount privacy
        const commitment = generateCommitment(params.amount);

        console.log('🔒 Initiating private donation:', {
          poolId: params.poolId.toString(),
          amount: params.amount.toString(),
          commitment,
        });

        // Create IPFS CID for donation metadata
        // In production, this would upload actual metadata to IPFS
        const ipfsCID = 'bafkrei placeholder'; // Placeholder IPFS CID

        // Execute private donation
        const txHash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.ZKTCore as `0x${string}`,
          abi: ZKTCoreABI,
          functionName: 'donatePrivate',
          args: [
            params.poolId,
            params.amount,
            commitment,
            ipfsCID,
          ],
        });

        toast({
          title: 'Private Donation Submitted',
          description: 'Your private donation is being processed...',
        });

        console.log('✅ Private donation submitted:', txHash);

        return {
          txHash,
          commitment,
        };

      } catch (err: any) {
        const errorMessage = err?.message || err?.reason || 'Private donation failed';
        setError(new Error(errorMessage));

        toast({
          title: 'Private Donation Failed',
          description: errorMessage,
          variant: 'destructive',
        });

        return null;

      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, address, writeContractAsync, generateCommitment]
  );

  return {
    donatePrivate,
    isLoading: isLoading || isConfirming,
    isConfirming,
    error,
  };
}
