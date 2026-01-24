import { NextRequest, NextResponse } from 'next/server';
import { formatPinataImageUrl } from '@/lib/pinata-client';
import { supabase } from '@/lib/supabase-client';

// Helper function to calculate days left
function calculateDaysLeft(endDate: number): number {
  const now = Math.floor(Date.now() / 1000);
  const daysLeft = Math.ceil((endDate - now) / 86400);
  return Math.max(daysLeft, 0);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = parseInt(id, 10);

    // Fetch all campaigns from Supabase
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch campaign' },
        { status: 500 }
      );
    }

    // Find campaign by campaign_id
    const campaign = campaigns?.find((c: any) => {
      // Parse campaign_id if it's numeric
      const cId = parseInt(c.campaign_id, 10);
      return cId === campaignId;
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const endTime = campaign.end_time || Math.floor(Date.now() / 1000) + 86400 * 90;

    // Format image URLs
    const images = [];
    if (campaign.image_urls && Array.isArray(campaign.image_urls)) {
      images.push(...campaign.image_urls.map((url: string) => formatPinataImageUrl(url)));
    }
    if (images.length === 0) {
      images.push('https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=500');
    }

    const campaignDetail = {
      id: campaignId,
      campaignIdHash: campaign.campaign_id || '', // blockchain campaign ID (hash for Safe campaigns, numeric for others)
      title: campaign.title || '',
      description: campaign.description || '',
      organization: {
        name: campaign.organization_name || 'Unknown Organization',
        verified: campaign.organization_verified || false,
        logo: '/org-logo.jpg',
      },
      category: campaign.category || 'General',
      location: campaign.location || 'Global',
      raised: campaign.total_raised || 0,
      goal: campaign.goal || 0,
      donors: campaign.donors_count || 0,
      daysLeft: calculateDaysLeft(endTime),
      createdDate: campaign.created_at ? new Date(campaign.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }) : 'Unknown',
      image: images[0],
      images: images,
      // Mock data untuk fields yang tidak ada di database
      updates: [
        {
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          title: 'Campaign Started',
          content: `This campaign was created on ${campaign.created_at ? new Date(campaign.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'recently'} to help with ${campaign.title}.`,
        },
      ],
      milestones: [
        {
          amount: campaign.goal * 0.33,
          label: '33% of Goal - Initial Support',
          achieved: (campaign.total_raised || 0) >= campaign.goal * 0.33,
        },
        {
          amount: campaign.goal * 0.66,
          label: '66% of Goal - Strong Progress',
          achieved: (campaign.total_raised || 0) >= campaign.goal * 0.66,
        },
        {
          amount: campaign.goal,
          label: '100% of Goal - Campaign Complete',
          achieved: (campaign.total_raised || 0) >= campaign.goal,
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
