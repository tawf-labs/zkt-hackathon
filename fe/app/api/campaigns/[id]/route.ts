import { NextRequest, NextResponse } from 'next/server';
import { getCampaignPool, calculateDaysLeft } from '@/lib/contract-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const poolId = parseInt(id, 10);

    if (isNaN(poolId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Fetch campaign from contract
    const campaign = await getCampaignPool(poolId);

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Format campaign detail
    const campaignDetail = {
      id: poolId,
      campaignIdHash: `pool-${poolId}`,
      title: campaign.title,
      description: campaign.description,
      organization: {
        name: campaign.organizationName,
        verified: campaign.organizationVerified,
        logo: '/org-logo.jpg',
      },
      category: campaign.category,
      location: campaign.location,
      raised: campaign.raised,
      goal: campaign.goal,
      donors: campaign.donors,
      daysLeft: calculateDaysLeft(campaign.endTime),
      createdDate: new Date(campaign.createdAt * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      image: campaign.imageUrl,
      images: campaign.imageUrls.length > 0 ? campaign.imageUrls : [campaign.imageUrl],
      // Mock updates
      updates: [
        {
          date: new Date(campaign.createdAt * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          title: 'Campaign Started',
          content: `This campaign was created to help with ${campaign.title}.`,
        },
      ],
      milestones: [
        {
          amount: campaign.goal * 0.33,
          label: '33% of Goal - Initial Support',
          achieved: campaign.raised >= campaign.goal * 0.33,
        },
        {
          amount: campaign.goal * 0.66,
          label: '66% of Goal - Strong Progress',
          achieved: campaign.raised >= campaign.goal * 0.66,
        },
        {
          amount: campaign.goal,
          label: '100% of Goal - Campaign Complete',
          achieved: campaign.raised >= campaign.goal,
        },
      ],
    };

    return NextResponse.json(
      {
        success: true,
        campaign: campaignDetail,
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
    console.error('Error fetching campaign detail:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
