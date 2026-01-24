'use client'

import { useEffect, useRef } from 'react'
import { usePublicClient } from 'wagmi'
import { DONATION_CONTRACT_ADDRESS } from '@/lib/donate'
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
              address: DONATION_CONTRACT_ADDRESS as `0x${string}`,
              event: {
                name: 'CampaignCreated',
                type: 'event',
                inputs: [
                  { indexed: true, name: 'campaignId', type: 'bytes32' },
                  { indexed: false, name: 'startTime', type: 'uint256' },
                  { indexed: false, name: 'endTime', type: 'uint256' },
                ],
              },
              fromBlock: lastBlockRef.current + BigInt(1),
              toBlock: latestBlock,
            })

            lastBlockRef.current = latestBlock

            if (logs.length > 0) {
              console.log(`✅ Found ${logs.length} CampaignCreated event(s)`)
            }

            // Process each event
            for (const log of logs) {
              const campaignId = log.args?.campaignId as string

              console.log('📢 CampaignCreated event detected:', campaignId)

              // Check if campaign already exists in Supabase
              try {
                const { data, error } = await supabase
                  .from('campaigns')
                  .select('id, status')
                  .eq('campaign_id', campaignId)
                  .single()

                if (
                  error &&
                  error.code === 'PGRST116'
                ) {
                  console.log(
                    '⚠️ Campaign exists on-chain but not in Supabase:',
                    campaignId
                  )
                } else if (!error && data) {
                  // Campaign exists in Supabase
                  if (data.status === 'pending_execution') {
                    // Update status to 'active' since Safe transaction executed
                    console.log(
                      '🔄 Updating campaign status to active (Safe executed):',
                      campaignId
                    )
                    
                    const { error: updateError } = await supabase
                      .from('campaigns')
                      .update({ status: 'active' })
                      .eq('campaign_id', campaignId)
                    
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