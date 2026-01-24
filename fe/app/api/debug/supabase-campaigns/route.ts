import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

/**
 * Debug endpoint to fetch raw campaign data from Supabase
 * GET /api/debug/supabase-campaigns
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Fetching all campaigns from Supabase...')

    // Fetch all campaigns including expired ones
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: 500 }
      )
    }

    const now = Math.floor(Date.now() / 1000)

    console.log(`✅ Found ${campaigns?.length || 0} campaigns in Supabase`)

    if (campaigns && campaigns.length > 0) {
      campaigns.forEach((camp: any, idx: number) => {
        const isExpired = camp.end_time && camp.end_time < now
        const isPending = camp.status === 'pending_execution'
        const statusLabel = isPending ? '⏳ PENDING SAFE' : (isExpired ? '⏰ EXPIRED' : '✅ ACTIVE')
        console.log(
          `[${idx}] ${statusLabel} - ${camp.title} (ID: ${camp.campaign_id?.substring(0, 16)}...)`
        )
        console.log(`    Category: ${camp.category} | Location: ${camp.location}`)
        console.log(`    Goal: ${camp.goal} IDRX | Org: ${camp.organization_name}`)
        console.log(`    Status: ${camp.status}`)
        if (isPending) {
          console.log(`    ⚠️ Waiting for Safe execution (not yet 3/3 signatures) - will appear in explorer after 3rd signer approves`)
        }
        console.log(
          `    Created: ${new Date(camp.created_at).toLocaleString()}`
        )
        console.log(
          `    Start: ${new Date((camp.start_time || 0) * 1000).toLocaleString()}`
        )
        console.log(
          `    End: ${new Date((camp.end_time || 0) * 1000).toLocaleString()}`
        )
        console.log(`    Images: ${camp.image_urls?.length || 0}`)
        console.log(`    Status: ${camp.status}`)
        console.log('')
      })
    }

    return NextResponse.json(
      {
        success: true,
        total: campaigns?.length || 0,
        campaigns: campaigns || [],
        now: now,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
