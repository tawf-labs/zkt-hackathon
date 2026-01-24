'use client'

import { useCallback, useState, useEffect } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { toast } from '@/components/ui/use-toast'
import SafeApiKit from '@safe-global/api-kit'
import Safe from '@safe-global/protocol-kit'
import { ethers } from 'ethers'
import { ZKTCoreABI, CONTRACT_ADDRESSES } from '@/lib/abi'
import { saveCampaignData, type CampaignData } from '@/lib/supabase-client'

export interface CreateCampaignWithSafeParams {
  campaignId: string
  startTime: number
  endTime: number
  title?: string
  description?: string
  category?: string
  location?: string
  goal?: number
  organizationName?: string
  organizationVerified?: boolean
  imageUrls?: string[]
  tags?: string[]
}

export interface CreateCampaignWithSafeResult {
  isLoading: boolean
  error: string | null
  safeTxHash: string | null
  createCampaignWithSafe: (params: CreateCampaignWithSafeParams) => Promise<{ safeTxHash: string }>
  isHydrated: boolean
}

const SAFE_ADDRESS = '0xD264BE80817EAfaC5F7575698913FEc4cB38a016'
const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.ZKTCore

/**
 * Hook for creating campaigns via Safe multisig
 */
export const useCreateCampaignWithSafe = (): CreateCampaignWithSafeResult => {
  const [isHydrated, setIsHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [safeTxHash, setSafeTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const createCampaignWithSafe = useCallback(
    async (params: CreateCampaignWithSafeParams) => {
      if (!isConnected || !address) {
        throw new Error('Please connect your wallet first')
      }

      if (!walletClient) {
        throw new Error('Wallet client not available')
      }

      // Validate params
      if (!params.campaignId || params.campaignId.length === 0) {
        throw new Error('Campaign ID is required')
      }
      if (!params.startTime || params.startTime <= 0) {
        throw new Error('Start time must be a valid timestamp')
      }
      if (!params.endTime || params.endTime <= params.startTime) {
        throw new Error('End time must be after start time')
      }

      setIsLoading(true)
      setError(null)
      
      try {
        console.log('🔐 Initializing Safe Protocol Kit...')
        console.log('Connected wallet:', address)
        console.log('Safe address:', SAFE_ADDRESS)

        // Get provider from window.ethereum (ethers v5)
        const provider = new ethers.providers.Web3Provider((window as any).ethereum)

        // Initialize Protocol Kit - for Protocol Kit v6 with ethers v5
        const protocolKit = await Safe.init({
          provider: (window as any).ethereum,
          signer: address,
          safeAddress: SAFE_ADDRESS
        })

        console.log('✅ Safe Protocol Kit initialized')

        // Encode transaction data using ZKTCore contract ABI (ethers v5)
        const iface = new ethers.utils.Interface(ZKTCoreABI)
        
        const data = iface.encodeFunctionData('createProposal', [
          params.title || 'Campaign',
          params.description || '',
          ethers.utils.parseEther((params.goal || 0).toString()),
          false, // isEmergency
          '', // mockZKKYCProof
          params.tags || [] // zakatChecklistItems
        ])

        console.log('📝 Campaign ID:', params.campaignId)
        console.log('📅 Start Time:', new Date(params.startTime * 1000).toISOString())
        console.log('📅 End Time:', new Date(params.endTime * 1000).toISOString())

        console.log('📝 Creating Safe transaction...')

        // Create Safe transaction
        const safeTransaction = await protocolKit.createTransaction({
          transactions: [{
            to: CONTRACT_ADDRESS,
            value: '0',
            data
          }]
        })

        console.log('✍️ Signing transaction...')
        const signedSafeTx = await protocolKit.signTransaction(safeTransaction)
        
        const safeTxHash = await protocolKit.getTransactionHash(signedSafeTx)
        console.log('✅ Transaction signed! Hash:', safeTxHash)

        // Get signature
        const signature = signedSafeTx.signatures.get(address.toLowerCase())
        if (!signature) {
          throw new Error('Failed to get signature')
        }

        // Initialize API Kit
        const apiKit = new SafeApiKit({
          chainId: BigInt(84532), // Base Sepolia
          txServiceUrl: 'https://safe-transaction-base-sepolia.safe.global/api'
        })

        console.log('🚀 Proposing transaction...')

        // Propose transaction
        await apiKit.proposeTransaction({
          safeAddress: SAFE_ADDRESS,
          safeTransactionData: safeTransaction.data,
          safeTxHash,
          senderAddress: address,
          senderSignature: signature.data
        })

        console.log('🎉 Transaction proposed!')
        setSafeTxHash(safeTxHash)

        // Save campaign metadata to Supabase immediately after Safe approval
        if (params.title && params.description && params.location && params.organizationName) {
          try {
            console.log('💾 Saving campaign metadata to Supabase...')
            const campaignData: CampaignData = {
              campaignId: params.campaignId,
              title: params.title,
              description: params.description,
              category: params.category || 'Other',
              location: params.location,
              goal: params.goal || 0,
              organizationName: params.organizationName,
              organizationVerified: params.organizationVerified || false,
              imageUrls: params.imageUrls || [],
              tags: params.tags || [],
              startTime: params.startTime,
              endTime: params.endTime,
              status: 'pending_execution',
            }
            
            await saveCampaignData(campaignData)
            console.log('✅ Campaign metadata saved to Supabase')
            
            toast({
              title: '✅ Campaign Metadata Saved!',
              description: 'Campaign will appear after Safe executes the transaction.',
            })
          } catch (dbError) {
            console.error('⚠️ Warning: Failed to save campaign metadata:', dbError)
            // Don't throw error - the on-chain transaction is still valid
            toast({
              title: '⚠️ Metadata Save Failed',
              description: 'Campaign created on-chain but metadata not saved. You may need to try again.',
              variant: 'destructive',
            })
          }
        }

        toast({
          title: '✅ Campaign Proposed!',
          description: 'Transaction proposed to Safe. Waiting for confirmations from all signers.',
        })

        console.log('⏳ Safe transaction proposed - waiting for execution...')
        console.log('Campaign ID:', params.campaignId)
        console.log('Safe TX Hash:', safeTxHash)

        return { safeTxHash }

      } catch (err: any) {
        const errorMsg = err?.message || String(err)
        console.error('❌ Error:', errorMsg)
        console.error('Full error:', err)
        setError(errorMsg)
        
        toast({
          title: '❌ Failed',
          description: errorMsg,
          variant: 'destructive',
        })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [address, isConnected, walletClient]
  )

  return {
    createCampaignWithSafe,
    isLoading,
    safeTxHash,
    error,
    isHydrated,
  }
}