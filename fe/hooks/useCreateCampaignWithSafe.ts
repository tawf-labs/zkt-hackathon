'use client'

import { useCallback, useState, useEffect } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { toast } from '@/components/ui/use-toast'
import SafeApiKit from '@safe-global/api-kit'
import Safe from '@safe-global/protocol-kit'
import { ethers } from 'ethers'
import { ZKTCoreABI, CONTRACT_ADDRESSES } from '@/lib/abi'
import { uploadFilesToPinata } from '@/lib/pinata-client'

export interface CreateCampaignWithSafeParams {
  title: string
  description: string
  fundingGoal: number
  isEmergency: boolean
  zakatChecklistItems: string[]
  metadataURI: string
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
 * Hook for creating proposals via Safe multisig
 * All metadata is stored on-chain or via IPFS (no database)
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

        const fundingGoalWei = ethers.utils.parseEther(params.fundingGoal.toString())

        const data = iface.encodeFunctionData('createProposal', [
          params.title,
          params.description,
          fundingGoalWei,
          params.isEmergency,
          '0x0000000000000000000000000000000000000000000000000000000000000000', // mockZKKYCProof
          params.zakatChecklistItems,
          params.metadataURI,
        ])

        console.log('📝 Proposal Title:', params.title)
        console.log('📝 Metadata URI:', params.metadataURI)

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

        toast({
          title: '✅ Proposal Created!',
          description: 'Proposal created via Safe multisig. Waiting for confirmations from all signers.',
        })

        console.log('⏳ Safe transaction proposed - waiting for execution...')
        console.log('Proposal Title:', params.title)
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
