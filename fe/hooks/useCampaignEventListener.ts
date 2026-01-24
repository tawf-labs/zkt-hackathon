'use client'

import { useEffect, useRef } from 'react'
import { usePublicClient } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/abi'
import { supabase } from '@/lib/supabase-client'

/**
 * Hook that listens for CampaignCreated events from the contract
 * Uses getLogs polling instead of watchContractEvent to avoid RPC filter expiration
 * 
 * NOTE: This hook is designed to be safely called in WalletStateController
 * All state updates are contained within effects, not during render
 */
export const useCampaignEventListener = () => {
  const publicClient = usePublicClient()
  const lastBlockRef = useRef<bigint>(BigInt(0))
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    // Guard against multiple initializations
    if (isInitializedRef.current) return
    if (!publicClient) return

    isInitializedRef.current = true

    const setupListener = async () => {
      try {
        console.log('🎧 Setting up campaign event listener...')

        // Get the initial block number
        const currentBlock = await publicClient.getBlockNumber()
        lastBlockRef.current = currentBlock

        // Poll for events every 15 seconds instead of using filters (which expire on Base Sepolia)
        intervalRef.current = setInterval(async () => {
          try {
            const latestBlock = await publicClient.getBlockNumber()
            
            if (latestBlock <= lastBlockRef.current) {
              return // No new blocks
            }

            console.log(
              `📡 Polling CampaignCreated events: blocks ${lastBlockRef.current} → ${latestBlock}`
            )
            const logs = await (publicClient as any).getLogs({
              address: CONTRACT_ADDRESSES.ZKTCore as `0x${string}`,
              event: {
                name: 'CampaignPoolCreated',
                type: 'event',
                inputs: [
                  { indexed: true, name: 'poolId', type: 'uint256' },
                  { indexed: true, name: 'proposalId', type: 'uint256' },
                  { indexed: false, name: 'campaignType', type: 'uint8' },
                ],
              },
              fromBlock: lastBlockRef.current + BigInt(1),
              toBlock: latestBlock,
            })

            lastBlockRef.current = latestBlock

            if (logs.length > 0) {
              console.log(`✅ Found ${logs.length} CampaignPoolCreated event(s)`)
            }

            // Process each event
            for (const log of logs) {
              const poolId = log.args?.poolId as bigint

              console.log('📢 CampaignPoolCreated event detected:', poolId.toString())

              // Check if pool already exists in Supabase
              try {
                const { data, error } = await supabase
                  .from('campaigns')
                  .select('id, status')
                  .eq('pool_id', poolId.toString())
                  .single()

                if (
                  error &&
                  error.code === 'PGRST116'
                ) {
                  console.log(
                    '⚠️ Pool exists on-chain but not in Supabase:',
                    poolId.toString()
                  )
                } else if (!error && data) {
                  // Pool exists in Supabase
                  if (data.status === 'pending_execution') {
                    // Update status to 'active' since transaction executed
                    console.log(
                      '🔄 Updating campaign status to active:',
                      poolId.toString()
                    )
                    
                    const { error: updateError } = await supabase
                      .from('campaigns')
                      .update({ status: 'active' })
                      .eq('pool_id', poolId.toString())
                    
                    if (updateError) {
                      console.error('❌ Failed to update campaign status:', updateError)
                    } else {
                      console.log('✅ Campaign status updated to active - now visible in explorer!')
                    }
                  } else {
                    console.log(
                      '✅ Campaign already active in Supabase'
                    )
                  }
                }
              } catch (err) {
                console.error(
                  '❌ Error checking/updating campaign in Supabase:',
                  err
                )
              }
            }
          } catch (pollError) {
            console.error('❌ Error polling for events:', pollError)
          }
        }, 15000) // Poll every 15 seconds

        console.log('✅ Campaign event listener setup complete')
      } catch (err) {
        console.error('❌ Failed to setup event listener:', err)
      }
    }

    setupListener()

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        console.log('🛑 Campaign event listener stopped')
      }
    }
  }, [publicClient])
}