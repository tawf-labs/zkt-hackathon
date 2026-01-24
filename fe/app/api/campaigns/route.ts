import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getAddress } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACT_ADDRESSES, ZKTCoreABI } from '@/lib/abi';
import { Campaign } from '@/hooks/useCampaigns';
import { formatPinataImageUrl } from '@/lib/pinata-client';
import { supabase } from '@/lib/supabase-client';

// Create a public client for reading contract data
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
});

// Helper function to calculate days left
function calculateDaysLeft(endDate: number): number {
  const now = Math.floor(Date.now() / 1000);
  const daysLeft = Math.ceil((endDate - now) / 86400);
  return Math.max(daysLeft, 0);
}

export async function GET(request: NextRequest) {
  try {
    const campaigns: Campaign[] = [];

    console.log('📡 [API] Fetching campaigns...')

    // Fetch campaigns from Supabase first
    try {
      const { data: supabaseCampaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error:', error);
      } else if (supabaseCampaigns && supabaseCampaigns.length > 0) {
        console.log(`✅ Found ${supabaseCampaigns.length} campaigns in Supabase`)
        
        // Convert Supabase campaigns to Campaign type
        const now = Math.floor(Date.now() / 1000);
        supabaseCampaigns.forEach((camp: any, index: number) => {
          // Skip expired campaigns
          const endTime = camp.end_time || Math.floor(Date.now() / 1000) + 86400 * 90;
          if (endTime < now) {
            console.log(`⏰ Skipping expired campaign: ${camp.title}`)
            return;
          }

          // ⚠️ IMPORTANT: Skip campaigns still pending Safe execution (waiting for 3/3 signatures)
          // Only show campaigns that have been fully executed on-chain (status === 'active')
          if (camp.status === 'pending_execution') {
            console.log(`⏳ Skipping pending Safe transaction: ${camp.title} (ID: ${camp.campaign_id?.substring(0, 16)}...) - waiting for 3/3 signatures`)
            return;
          }

          console.log(`📝 Processing campaign: ${camp.title} (ID: ${camp.campaign_id?.substring(0, 16)}...)`)

          // Get image URL and ensure it's properly formatted for Pinata
          let imageUrl = 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=500';
          if (camp.image_urls && Array.isArray(camp.image_urls) && camp.image_urls.length > 0) {
            imageUrl = formatPinataImageUrl(camp.image_urls[0]);
          }

          const campaign: Campaign = {
            id: camp.campaign_id || index,
            title: camp.title || '',
            description: camp.description || '',
            imageUrl: imageUrl,
            image: imageUrl,
            organizationName: camp.organization_name || 'Unknown',
            organizationAddress: camp.organization_address || '',
            category: camp.category || 'General',
            location: camp.location || 'Global',
            raised: camp.total_raised || 0,
            goal: camp.goal || 0,
            donors: camp.donors_count || 0,
            daysLeft: calculateDaysLeft(endTime),
            isActive: camp.status === 'active' && endTime > now,
            isVerified: camp.organization_verified || false,
            startDate: camp.start_time || now,
            endDate: endTime,
          };
          campaigns.push(campaign);
        });
        
        console.log(`✅ Processed ${campaigns.length} active campaigns`)
      } else {
        console.log('⚠️ No campaigns found in Supabase')
      }
    } catch (error) {
      console.error('❌ Error fetching from Supabase:', error);
    }

    // Try to fetch from ZKTCore contract as secondary source (only if Supabase is empty)
    if (campaigns.length === 0) {
      try {
        const poolCount = await publicClient.readContract({
          address: getAddress(CONTRACT_ADDRESSES.ZKTCore),
          abi: ZKTCoreABI,
          functionName: 'poolCount',
          args: [],
        }) as bigint;

        const count = Number(poolCount);
        for (let i = 0; i < count && i < 10; i++) {
          try {
            const poolData = await publicClient.readContract({
              address: getAddress(CONTRACT_ADDRESSES.ZKTCore),
              abi: ZKTCoreABI,
              functionName: 'getPool',
              args: [BigInt(i)],
            }) as any;

            if (!poolData || !poolData.campaignTitle) continue;

            const fundingGoal = Number(poolData.fundingGoal || 0n) / 1e18;
            const raisedAmount = Number(poolData.raisedAmount || 0n) / 1e18;

            if (fundingGoal === 0) continue;

            const now = Math.floor(Date.now() / 1000);
            const endDate = now + (90 * 86400);

            const alreadyExists = campaigns.some(c => c.title === poolData.campaignTitle);
            if (!alreadyExists) {
              const campaign: Campaign = {
                id: campaigns.length,
                title: poolData.campaignTitle,
                description: '',
                imageUrl: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=500',
                image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=500',
                organizationName: poolData.organizer || 'Unknown Organization',
                organizationAddress: poolData.organizer || '',
                category: 'Zakat',
                location: 'Global',
                raised: Math.floor(raisedAmount),
                goal: Math.floor(fundingGoal),
                donors: poolData.donors?.length || 0,
                daysLeft: calculateDaysLeft(endDate),
                isActive: poolData.isActive && endDate > now,
                isVerified: false,
                startDate: Number(poolData.createdAt || now),
                endDate,
              };
              campaigns.push(campaign);
            }
          } catch (error) {
            continue;
          }
        }
      } catch (error) {
        console.log('ℹ️ Contract data skipped - using Supabase data only');
      }
    }

    return NextResponse.json(
      {
        success: true,
        campaigns: campaigns,
        total: campaigns.length,
        source: campaigns.length > 0 ? 'supabase' : 'empty',
        timestamp: new Date().toISOString(),
        debug: {
          message: campaigns.length === 0 ? '❌ No campaigns found - check Supabase data' : `✅ ${campaigns.length} campaigns loaded`,
          checkUrl: '/api/debug/supabase-campaigns'
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`📊 [API] Returning ${campaigns.length} campaigns`)
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch campaigns',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
