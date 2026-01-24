'use client';

import { useCallback, useState } from 'react';
import { useWriteContract, useAccount, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { ZKTCoreABI, CONTRACT_ADDRESSES } from '@/lib/abi';
import { toast } from '@/components/ui/use-toast';
import { pad, toHex, keccak256, stringToBytes } from 'viem';

interface UseCreateCampaignOnChainParams {
  campaignId: string; // Changed to string for better hash generation
  startTime: number;
  endTime: number;
}

interface UseCreateCampaignOnChainOptions {
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

interface SafeInfo {
  isSafe: boolean;
  threshold: number;
  owners: string[];
  safeAddress: string;
}

// Helper: Generate deterministic bytes32 from string
const generateBytes32CampaignId = (identifier: string): `0x${string}` => {
  // Use keccak256 for deterministic, unique ID
  return keccak256(stringToBytes(identifier));
};

export const useCreateCampaignOnChain = (options?: UseCreateCampaignOnChainOptions) => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [safeInfo, setSafeInfo] = useState<SafeInfo>({
    isSafe: false,
    threshold: 0,
    owners: [],
    safeAddress: '',
  });

  const { writeContractAsync } = useWriteContract();
  
  // Optional: Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  // Check if current address is a Safe wallet
  const checkIfSafe = useCallback(async () => {
    if (!address || !publicClient) {
      setSafeInfo({
        isSafe: false,
        threshold: 0,
        owners: [],
        safeAddress: '',
      });
      return;
    }

    try {
      // Check if account code exists at address (it's a contract)
      const code = await publicClient.getCode({ address });
      
      if (!code || code === '0x') {
        // Not a contract, so not a Safe
        setSafeInfo({
          isSafe: false,
          threshold: 0,
          owners: [],
          safeAddress: '',
        });
        return;
      }

      // Try to call Safe contract methods
      const ownerABI = [
        {
          inputs: [],
          name: 'getOwners',
          outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'getThreshold',
          outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
      ];

      try {
        const [owners, thresholdValue] = await Promise.all([
          publicClient.readContract({
            address,
            abi: ownerABI,
            functionName: 'getOwners',
          }),
          publicClient.readContract({
            address,
            abi: ownerABI,
            functionName: 'getThreshold',
          }),
        ]);

        setSafeInfo({
          isSafe: true,
          threshold: Number(thresholdValue) || 1,
          owners: (owners as string[]) || [address],
          safeAddress: address,
        });

        console.log('✅ Safe wallet detected:', {
          address,
          owners,
          threshold: thresholdValue,
        });
      } catch (contractReadError) {
        // Contract read failed, assume not a Safe
        console.log('Not a Safe wallet or Safe methods unavailable');
        setSafeInfo({
          isSafe: false,
          threshold: 0,
          owners: [],
          safeAddress: '',
        });
      }
    } catch (error) {
      console.error('Error checking if Safe wallet:', error);
      setSafeInfo({
        isSafe: false,
        threshold: 0,
        owners: [],
        safeAddress: '',
      });
    }
  }, [address, publicClient]);

  const createCampaignOnChain = useCallback(
    async (params: UseCreateCampaignOnChainParams) => {
      // Validation 1: Wallet connected
      if (!isConnected || !address) {
        const error = new Error('Wallet not connected');
        toast({
          title: 'Error',
          description: 'Please connect your wallet first',
          variant: 'destructive',
        });
        options?.onError?.(error);
        return null;
      }

      // Validation 2: Time validation
      const now = Math.floor(Date.now() / 1000);
      
      if (params.endTime <= params.startTime) {
        const error = new Error('End time must be after start time');
        toast({
          title: 'Invalid Time Range',
          description: 'End time must be after start time',
          variant: 'destructive',
        });
        options?.onError?.(error);
        return null;
      }

      if (params.startTime < now) {
        const error = new Error('Start time must be in the future');
        toast({
          title: 'Invalid Start Time',
          description: 'Start time cannot be in the past',
          variant: 'destructive',
        });
        options?.onError?.(error);
        return null;
      }

      setIsLoading(true);

      try {
        // Generate deterministic bytes32 campaignId
        const campaignIdBytes32 = generateBytes32CampaignId(params.campaignId);

        console.log('🚀 Creating campaign on-chain:', {
          campaignId: params.campaignId,
          campaignIdBytes32,
          startTime: params.startTime,
          endTime: params.endTime,
          address: address,
        });

        // Execute transaction
        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.ZKTCore as `0x${string}`,
          abi: ZKTCoreABI,
          functionName: 'createProposal',
          args: [
            params.campaignId,
            '',
            BigInt(0),
            false,
            '',
            [],
          ],
        });

        setTxHash(hash);

        toast({
          title: 'Transaction Submitted',
          description: 'Waiting for confirmation...',
        });

        console.log('✅ Transaction submitted:', hash);

        options?.onSuccess?.(hash);

        return {
          campaignId: params.campaignId,
          campaignIdBytes32,
          txHash: hash,
        };

      } catch (error: any) {
        console.error('❌ Error creating campaign on-chain:', error);

        // Parse common errors
        let errorMessage = 'Failed to create campaign on blockchain';
        
        if (error?.message?.includes('user rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error?.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas';
        } else if (error?.message?.includes('Only admin')) {
          errorMessage = 'Only admin can create campaigns';
        } else if (error?.message?.includes('Campaign already exists')) {
          errorMessage = 'Campaign ID already exists';
        } else if (error?.message?.includes('Contract is paused')) {
          errorMessage = 'Contract is currently paused';
        } else if (error?.reason) {
          errorMessage = error.reason;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast({
          title: 'Transaction Failed',
          description: errorMessage,
          variant: 'destructive',
        });

        options?.onError?.(error);
        return null;

      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, address, writeContractAsync, options]
  );

  return {
    createCampaignOnChain,
    isLoading: isLoading || isConfirming,
    isConfirming,
    isConfirmed,
    txHash,
    safeInfo,
    checkIfSafe,
  };
};