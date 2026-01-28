"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Clock, CircleCheck, Share2, Heart, MapPin, Calendar, Target, TrendingUp, Shield, FileText, Loader2, AlertTriangle, Timer, ExternalLink, Vote, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { DonationDialog } from '@/components/donations/donation-dialog';
import dynamic from 'next/dynamic';
import { useMilestones, useMilestoneActions, useHasVotedOnMilestone } from '@/hooks/useMilestones';
import { useAccount } from 'wagmi';
import { MilestoneStatus, MilestoneData, VoteSupport, getMilestoneStatusLabel, getMilestoneStatusColor } from '@/lib/types';

const CampaignMap = dynamic(() => import('@/components/campaigns/campaign-map'), {
  loading: () => <div className="w-full h-[400px] bg-muted animate-pulse rounded-xl" />,
  ssr: false
});

const donationAmounts = [10000, 25000, 50000, 100000, 250000, 500000];

interface CampaignDetailData {
  id: number;
  proposalId?: number; // On-chain proposal ID for milestone fetching
  poolId?: number; // On-chain pool ID for donations
  title: string;
  organization: {
    name: string;
    verified: boolean;
    logo: string;
  };
  category: string;
  location: string;
  raised: number;
  goal: number;
  donors: number;
  daysLeft: number;
  createdDate: string;
  image: string;
  images: string[];
  description: string;
  updates: Array<{
    date: string;
    title: string;
    content: string;
  }>;
  milestones: Array<{
    amount: number;
    label: string;
    achieved: boolean;
  }>;
  // Zakat-specific properties
  isZakat?: boolean;
  deadline?: number | null;
  timeRemaining?: string;
  poolStatus?: string;
  redistributionStatus?: 'none' | 'pending' | 'executed';
  inGracePeriod?: boolean;
  canRedistribute?: boolean;
}

export default function CampaignDetail() {
  const params = useParams();
  const campaignId = params.id as string;

  const [campaignDetail, setCampaignDetail] = useState<CampaignDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [activeTab, setActiveTab] = useState('story');
  const [selectedImage, setSelectedImage] = useState(0);
  const [showDonationDialog, setShowDonationDialog] = useState(false);

  // Wallet connection for milestone voting
  const { address, isConnected } = useAccount();

  // Fetch on-chain milestones if proposalId is available
  const { 
    milestones: onChainMilestones, 
    isLoading: milestonesLoading, 
    refetch: refetchMilestones 
  } = useMilestones(campaignDetail?.proposalId);

  const { 
    voteMilestone, 
    isLoading: votingLoading 
  } = useMilestoneActions({
    onSuccess: () => {
      refetchMilestones();
    }
  });

  // Fetch campaign detail
  useEffect(() => {
    const fetchCampaignDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/campaigns/${campaignId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch campaign: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.campaign) {
          setCampaignDetail(data.campaign);
        } else {
          throw new Error(data.error || 'Invalid response format');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    if (campaignId) {
      fetchCampaignDetail();
    }
  }, [campaignId]);

  const calculateProgress = (raised: number, goal: number) => {
    return (raised / goal) * 100;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('id-ID', { maximumFractionDigits: 0 })} IDRX`;
  };

  if (isLoading) {
    return (
      <main className="flex-1 py-8 lg:py-12 bg-background">
        <div className="container px-4 mx-auto max-w-7xl flex items-center justify-center min-h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading campaign details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !campaignDetail) {
    return (
      <main className="flex-1 py-8 lg:py-12 bg-background">
        <div className="container px-4 mx-auto max-w-7xl">
          <Link href="/campaigns" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </Link>
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-red-500 font-semibold mb-4">Error loading campaign</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  const progress = calculateProgress(campaignDetail.raised, campaignDetail.goal);

  return (
    <main className="flex-1 py-8 lg:py-12 bg-background">
      <div className="container px-4 mx-auto max-w-7xl">
        {/* Back Button */}
        <Link href="/campaigns" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="relative h-[400px] rounded-xl overflow-hidden border border-border">
                <img
                  src={campaignDetail.images[selectedImage]}
                  alt={campaignDetail.title}
                  className="w-full h-full object-cover"
                />

                {/* Category Badge */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-semibold bg-background/90 backdrop-blur-sm border border-border">
                    {campaignDetail.category}
                  </span>
                  {campaignDetail.isZakat && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium bg-emerald-600/90 backdrop-blur-sm text-white rounded-md border border-emerald-500">
                      <Shield className="h-4 w-4" />
                      Zakat
                    </span>
                  )}
                </div>

                {/* Verified Badge */}
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium bg-background/90 backdrop-blur-sm rounded-md border border-border">
                    <CircleCheck className="h-4 w-4 text-green-600" />
                    Verified Campaign
                  </span>
                </div>
              </div>

              {/* Image Thumbnails */}
              <div className="flex gap-3">
                {campaignDetail.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-20 w-24 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-primary' : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <img
                      src={img}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Campaign Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span>by</span>
                    <span className="text-primary font-semibold hover:underline cursor-pointer">
                      {campaignDetail.organization.name}
                    </span>
                    {campaignDetail.organization.verified && (
                      <CircleCheck className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight mb-3">
                    {campaignDetail.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{campaignDetail.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Started {campaignDetail.createdDate}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button className="inline-flex items-center justify-center rounded-md border border-border bg-transparent hover:bg-accent hover:text-accent-foreground h-9 w-9">
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button className="inline-flex items-center justify-center rounded-md border border-border bg-transparent hover:bg-accent hover:text-accent-foreground h-9 w-9">
                    <Heart className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Progress Section */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-baseline">
                  <div>
                    <div className="text-3xl font-bold text-foreground">
                      {formatCurrency(campaignDetail.raised)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      raised of {formatCurrency(campaignDetail.goal)} goal
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(progress)}%
                    </div>
                    <div className="text-sm text-muted-foreground">funded</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{campaignDetail.donors.toLocaleString()}</span>
                    <span className="text-muted-foreground">donors</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-secondary px-3 py-1.5 rounded-md">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold">{campaignDetail.daysLeft} days left</span>
                  </div>
                </div>
              </div>

              {/* Zakat Status Indicator */}
              {campaignDetail.isZakat && (
                <div className={`bg-card border rounded-xl p-6 ${
                  campaignDetail.inGracePeriod
                    ? 'border-yellow-500/50 bg-yellow-500/5'
                    : campaignDetail.canRedistribute
                    ? 'border-red-500/50 bg-red-500/5'
                    : campaignDetail.poolStatus === 'Completed'
                    ? 'border-green-500/50 bg-green-500/5'
                    : campaignDetail.poolStatus === 'Redistributed'
                    ? 'border-orange-500/50 bg-orange-500/5'
                    : 'border-primary/20 bg-primary/5'
                }`}>
                  <div className="flex items-start gap-3">
                    {campaignDetail.inGracePeriod ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    ) : campaignDetail.canRedistribute ? (
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    ) : campaignDetail.poolStatus === 'Completed' ? (
                      <CircleCheck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : campaignDetail.poolStatus === 'Redistributed' ? (
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Timer className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          Zakat Distribution Status
                          {campaignDetail.poolStatus && (
                            <span className={`text-xs px-2 py-1 rounded-md ${
                              campaignDetail.poolStatus === 'Active'
                                ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
                                : campaignDetail.poolStatus === 'Grace Period'
                                ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                                : campaignDetail.poolStatus === 'Completed'
                                ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                                : 'bg-orange-500/20 text-orange-700 dark:text-orange-400'
                            }`}>
                              {campaignDetail.poolStatus}
                            </span>
                          )}
                        </h4>
                        {campaignDetail.timeRemaining && (
                          <span className="text-sm font-medium text-primary">
                            {campaignDetail.timeRemaining}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        {campaignDetail.inGracePeriod ? (
                          <>
                            <p className="text-yellow-700 dark:text-yellow-400">
                              <strong>Grace Period Active:</strong> The distribution deadline has passed. The Sharia council may grant a one-time 14-day extension, or funds will be automatically redistributed to an approved fallback pool.
                            </p>
                            <p className="text-muted-foreground">
                              Remaining time in grace period: {campaignDetail.timeRemaining || 'Check deadline'}
                            </p>
                          </>
                        ) : campaignDetail.canRedistribute ? (
                          <>
                            <p className="text-red-700 dark:text-red-400">
                              <strong>Ready for Redistribution:</strong> The grace period has ended. Anyone can trigger redistribution of the funds to an approved fallback pool.
                            </p>
                          </>
                        ) : campaignDetail.poolStatus === 'Completed' ? (
                          <p className="text-green-700 dark:text-green-400">
                            <strong>Successfully Completed:</strong> The organizer has distributed the Zakat funds to the beneficiaries within the required timeframe.
                          </p>
                        ) : campaignDetail.poolStatus === 'Redistributed' ? (
                          <p className="text-orange-700 dark:text-orange-400">
                            <strong>Redistributed:</strong> The funds were redistributed to an approved fallback pool after the deadline passed.
                          </p>
                        ) : (
                          <>
                            <p className="text-foreground">
                              <strong>Active Zakat Pool:</strong> Per Shafi'i requirements, this Zakat campaign has a 30-day hard limit for fund distribution.
                            </p>
                            <p className="text-muted-foreground">
                              Time remaining for organizer to distribute funds: <span className="font-medium text-foreground">{campaignDetail.timeRemaining || 'Loading...'}</span>
                            </p>
                          </>
                        )}
                      </div>

                      {/* Zakat Compliance Badge */}
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Shield className="h-4 w-4" />
                          <span>
                            Shafi'i Compliant • 30-day distribution period • 7-day grace period • One-time 14-day extension available
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Milestones - On-Chain Data */}
              {campaignDetail.proposalId !== undefined && onChainMilestones.length > 0 ? (
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      <h3 className="font-bold text-lg">Milestones (On-Chain)</h3>
                    </div>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                      {onChainMilestones.filter(m => m.status === MilestoneStatus.Completed).length} / {onChainMilestones.length} completed
                    </span>
                  </div>
                  <div className="space-y-4">
                    {onChainMilestones.map((milestone, idx) => (
                      <div key={idx} className="border border-border rounded-lg p-4 space-y-3">
                        {/* Milestone Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold">Milestone {idx + 1}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${getMilestoneStatusColor(milestone.status)}`}>
                                {milestone.statusLabel}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{milestone.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-primary">{milestone.targetAmount} IDRX</span>
                          </div>
                        </div>

                        {/* Proof Link */}
                        {milestone.proofIPFS && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={`https://gateway.pinata.cloud/ipfs/${milestone.proofIPFS}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              View Proof <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {/* Voting Progress (if in voting state) */}
                        {milestone.status === MilestoneStatus.Voting && (
                          <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">Community Vote</span>
                              <span className="text-muted-foreground">Ends: {milestone.voteEnd}</span>
                            </div>
                            <div className="flex gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="font-semibold text-green-600">{milestone.votesFor}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="font-semibold text-red-500">{milestone.votesAgainst}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MinusCircle className="h-4 w-4 text-gray-400" />
                                <span className="font-semibold text-gray-500">{milestone.votesAbstain}</span>
                              </div>
                            </div>

                            {/* Voting Buttons */}
                            {isConnected && milestone.isVotingActive && (
                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => voteMilestone(campaignDetail.proposalId!, idx, VoteSupport.For)}
                                  disabled={votingLoading}
                                  className="flex-1 text-xs py-2 px-3 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Approve
                                </button>
                                <button
                                  onClick={() => voteMilestone(campaignDetail.proposalId!, idx, VoteSupport.Against)}
                                  disabled={votingLoading}
                                  className="flex-1 text-xs py-2 px-3 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                                >
                                  <XCircle className="h-3 w-3" /> Reject
                                </button>
                                <button
                                  onClick={() => voteMilestone(campaignDetail.proposalId!, idx, VoteSupport.Abstain)}
                                  disabled={votingLoading}
                                  className="text-xs py-2 px-3 rounded-md border border-border hover:bg-accent disabled:opacity-50 transition-colors"
                                >
                                  Abstain
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Completed Status */}
                        {milestone.status === MilestoneStatus.Completed && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CircleCheck className="h-4 w-4" />
                            <span>Completed on {milestone.releasedAt}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Static Milestones Fallback (from API data) */
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5" />
                    <h3 className="font-bold text-lg">Campaign Milestones</h3>
                  </div>
                  <div className="space-y-3">
                    {campaignDetail.milestones.map((milestone, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${milestone.achieved ? 'border-green-600 bg-green-600' : 'border-border'
                          }`}>
                          {milestone.achieved && (
                            <CircleCheck className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-2">
                            <span className={`text-sm font-medium ${milestone.achieved ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {milestone.label}
                            </span>
                            <span className={`text-sm font-semibold ${milestone.achieved ? 'text-green-600' : 'text-muted-foreground'}`}>
                              {formatCurrency(milestone.amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab('story')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'story'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Campaign Story
                </button>
                <button
                  onClick={() => setActiveTab('updates')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'updates'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Updates ({campaignDetail.updates.length})
                </button>
                <button
                  onClick={() => setActiveTab('donors')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'donors'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Donors
                </button>
                <button
                  onClick={() => setActiveTab('blockchain')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'blockchain'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Blockchain
                </button>
                <button
                  onClick={() => setActiveTab('distribution')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'distribution'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Distribution
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'story' && (
              <div className="space-y-6">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-line text-foreground leading-relaxed">
                    {campaignDetail.description}
                  </div>
                </div>

                {/* Blockchain Verified Badge */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <div className="font-semibold">Blockchain Verified</div>
                      <p className="text-sm text-muted-foreground">
                        All donations are recorded on the blockchain. You'll receive an NFT receipt as permanent proof.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'updates' && (
              <div className="space-y-6">
                {campaignDetail.updates.map((update, idx) => (
                  <div key={idx} className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg">{update.title}</h4>
                        <p className="text-sm text-muted-foreground">{update.date}</p>
                      </div>
                    </div>
                    <p className="text-foreground leading-relaxed">{update.content}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'donors' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-2">Recent donors supporting this campaign</p>
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                          {String.fromCharCode(65 + i)}
                        </div>
                        <div>
                          <div className="font-medium">Anonymous Donor</div>
                          <div className="text-sm text-muted-foreground">
                            {i === 0 ? '2 mins ago' : `${Math.floor(Math.random() * 24) + 1} hours ago`}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-primary">
                        {Math.floor((Math.random() * 450 + 50) * 1000).toLocaleString('id-ID')} IDRX
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'blockchain' && (
              <div className="space-y-6">
                {/* Smart Contract */}
                <div className="bg-muted/50 border border-border rounded-xl p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Smart Contract</h4>
                    </div>
                    <div className="font-mono text-xs bg-background p-3 rounded border border-border break-all">
                      0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7
                    </div>
                    <button className="w-full border border-border rounded-md h-9 px-4 text-sm font-semibold hover:bg-accent transition-all">
                      View on Block Explorer
                    </button>
                  </div>
                </div>

                {/* Chain Info */}
                <div className="bg-muted/50 border border-border rounded-xl p-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">Chain: Base Sepolia Testnet</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Transactions</span>
                        <span className="font-semibold">2,500</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Update</span>
                        <span className="font-semibold">2 mins ago</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gas Used</span>
                        <span className="font-semibold">0.0045 ETH</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transparency Note */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <div className="font-semibold">100% Transparent</div>
                      <p className="text-sm text-muted-foreground">
                        Every donation and fund distribution is recorded on the blockchain, ensuring complete transparency and accountability.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'distribution' && (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Distribution Locations</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    See where the funds and aid are being distributed to the beneficiaries.
                  </p>

                  <CampaignMap
                    center={[-6.2088, 106.8456]}
                    zoom={12}
                    locations={[
                      { lat: -6.2088, lng: 106.8456, name: "Main Distribution Center", description: "Central warehouse for aid collection" },
                      { lat: -6.1751, lng: 106.8650, name: "North Jakarta Relief Post", description: "Distribution point for flood victims" },
                      { lat: -6.2251, lng: 106.8000, name: "South Jakarta Community Hall", description: "Food package distribution center" }
                    ]}
                  />

                  <div className="mt-6 space-y-4">
                    <h4 className="font-semibold text-sm text-foreground">Distribution Activity</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 text-sm">
                        <div className="h-2 w-2 rounded-full bg-green-500 mt-2"></div>
                        <div>
                          <p className="font-medium">North Jakarta Relief Post</p>
                          <p className="text-muted-foreground">distributed 500 food packages</p>
                          <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <div className="h-2 w-2 rounded-full bg-green-500 mt-2"></div>
                        <div>
                          <p className="font-medium">South Jakarta Community Hall</p>
                          <p className="text-muted-foreground">distributed medical supplies</p>
                          <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Donation Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-xl mb-6">Make a Donation</h3>

                {/* Donation Amounts */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {donationAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount('');
                      }}
                      className={`border rounded-lg py-3 px-4 text-center font-semibold transition-all ${selectedAmount === amount
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary hover:bg-accent'
                        }`}
                    >
                      {(amount / 1000).toFixed(0)}K IDRX
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">
                    Or enter custom amount (IDRX)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(null);
                      }}
                      placeholder="0"
                      className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      IDRX
                    </span>
                  </div>
                </div>

                {/* Donate Button */}
                <button
                  onClick={() => setShowDonationDialog(true)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent rounded-md h-11 px-4 text-sm font-bold transition-all shadow-sm mb-4"
                >
                  Donate Now
                </button>

                <p className="text-xs text-center text-muted-foreground">
                  Your donation is secure and 100% goes to the campaign
                </p>

                {/* Donation Info */}
                <div className="mt-6 pt-6 border-t border-border space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Average donation</span>
                    <span className="font-semibold">50,000 IDRX</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Recent donation</span>
                    <span className="font-semibold">2 mins ago</span>
                  </div>
                </div>
              </div>

              {/* Organization Info */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm mt-6">
                <h3 className="font-bold text-lg mb-4">About Organization</h3>
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center font-bold text-primary">
                    {campaignDetail.organization.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="font-semibold">{campaignDetail.organization.name}</span>
                      <CircleCheck className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">Verified Organization</p>
                  </div>
                </div>
                <button className="w-full border border-border rounded-md h-9 px-4 text-sm font-semibold hover:bg-accent transition-all">
                  View Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Donation Dialog */}
      {campaignDetail && (
        <DonationDialog
          open={showDonationDialog}
          onOpenChange={setShowDonationDialog}
          campaignId={campaignDetail.id}
          campaignTitle={campaignDetail.title}
          campaignGoal={campaignDetail.goal}
          campaignRaised={campaignDetail.raised}
          onSuccess={() => {
            setShowDonationDialog(false);
            // User must manually refresh to see updated data
          }}
        />
      )}
    </main>
  );
}