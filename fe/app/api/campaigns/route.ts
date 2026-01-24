import { NextRequest, NextResponse } from 'next/server';
import { getAllCampaignPools, calculateDaysLeft } from '@/lib/contract-client';

export async function GET(request: NextRequest) {
  try {
    console.log('📡 [API] Fetching campaigns from contract...');

    // Fetch all campaigns from contract
    const campaigns = await getAllCampaignPools();

    // Filter active campaigns only
    const now = Math.floor(Date.now() / 1000);
    const activeCampaigns = campaigns
      .filter(c => c.isActive && c.endTime > now)
      .map(c => ({
        ...c,
        daysLeft: calculateDaysLeft(c.endTime),
      }));

    console.log(`✅ [API] Returning ${activeCampaigns.length} active campaigns`);

    return NextResponse.json(
      {
        success: true,
        campaigns: activeCampaigns,
        total: activeCampaigns.length,
        source: 'contract',
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Content-Type': 'application/json',
        },
      }
    );
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
