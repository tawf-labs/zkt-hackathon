"use client";

import React, { useState } from 'react';
import { LayoutDashboard, TrendingUp, Users, FileText, Settings, Download, Plus, ArrowUpRight, ArrowDownRight, CheckCircle2, DollarSign, Calendar, Loader2, Shield, Clock, Target, Upload, ExternalLink, Play, XCircle, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useProposals, useProposalCount } from '@/hooks/useProposals';
import { usePoolManager, usePool } from '@/hooks/usePoolManager';
import { useMilestones, useMilestoneActions } from '@/hooks/useMilestones';
import { ProposalStatus, CampaignType, getProposalStatusLabel, getProposalStatusColor, MilestoneStatus, getMilestoneStatusLabel, getMilestoneStatusColor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { uploadFilesToPinata } from '@/lib/pinata-client';

type SidebarTab = 'overview' | 'proposals' | 'pools' | 'milestones' | 'reports' | 'settings';

export default function OrganizationDashboard() {
  const { address, isConnected } = useAccount();
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('overview');

  // Get proposal count and proposals
  const { proposalCount, isLoading: isLoadingCount } = useProposalCount();
  const proposalCountNum = proposalCount ? Number(proposalCount) : 0;
  const proposalIds = proposalCountNum > 0 ? Array.from({ length: Math.min(proposalCountNum, 10) }, (_, i) => i) : [];
  const { proposals, isLoading: isLoadingProposals, refetch: refetchProposals } = useProposals(proposalIds);

  // Filter proposals for this organizer
  const myProposals = proposals.filter(p =>
    p.organizer.toLowerCase() === address?.toLowerCase()
  );

  // Pool manager hooks
  const { createCampaignPool, withdrawFunds, isLoading: isPoolManagerLoading } = usePoolManager();

  // Stats
  const stats = {
    totalProposals: myProposals.length,
    activeProposals: myProposals.filter(p => p.status === ProposalStatus.CommunityVote).length,
    approvedProposals: myProposals.filter(p =>
      p.status === ProposalStatus.ShariaApproved ||
      p.status === ProposalStatus.PoolCreated ||
      p.status === ProposalStatus.Completed
    ).length,
    totalRaised: myProposals.reduce((sum, p) => {
      // This would need pool data to be accurate
      return sum + 0;
    }, 0),
  };

  // Handlers
  const handleCreatePool = async (proposalId: string) => {
    try {
      await createCampaignPool(BigInt(proposalId));
      await refetchProposals();
      toast({
        title: "Success",
        description: "Campaign pool created successfully!",
      });
    } catch (error) {
      console.error("Error creating pool:", error);
    }
  };

  const handleWithdraw = async (poolId: string) => {
    try {
      await withdrawFunds(BigInt(poolId));
      await refetchProposals();
      toast({
        title: "Success",
        description: "Funds withdrawn successfully!",
      });
    } catch (error) {
      console.error("Error withdrawing funds:", error);
    }
  };

  const donations = [
    { donor: 'Anonymous Donor', address: '0x72...9a2', campaign: 'Emergency Relief for...', amount: '$150.00', status: 'Verified' },
    { donor: 'Anonymous Donor', address: '0x72...9a2', campaign: 'Emergency Relief for...', amount: '$150.00', status: 'Verified' },
    { donor: 'Anonymous Donor', address: '0x72...9a2', campaign: 'Emergency Relief for...', amount: '$150.00', status: 'Verified' },
    { donor: 'Anonymous Donor', address: '0x72...9a2', campaign: 'Emergency Relief for...', amount: '$150.00', status: 'Verified' },
    { donor: 'Anonymous Donor', address: '0x72...9a2', campaign: 'Emergency Relief for...', amount: '$150.00', status: 'Verified' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-black hidden lg:block">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
              ZK
            </div>
            <div>
              <div className="font-bold">ZK Zakat Org</div>
              <div className="text-xs text-muted-foreground">Organization</div>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setSidebarTab('overview')}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-md ${
                sidebarTab === 'overview' ? 'bg-primary text-primary-foreground font-semibold' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setSidebarTab('proposals')}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-md ${
                sidebarTab === 'proposals' ? 'bg-primary text-primary-foreground font-semibold' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Proposals
            </button>
            <button
              onClick={() => setSidebarTab('pools')}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-md ${
                sidebarTab === 'pools' ? 'bg-primary text-primary-foreground font-semibold' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              Campaign Pools
            </button>
            <button
              onClick={() => setSidebarTab('milestones')}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-md ${
                sidebarTab === 'milestones' ? 'bg-primary text-primary-foreground font-semibold' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Target className="h-4 w-4" />
              Milestones
            </button>
            <button
              onClick={() => setSidebarTab('reports')}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-md ${
                sidebarTab === 'reports' ? 'bg-primary text-primary-foreground font-semibold' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="h-4 w-4" />
              Reports
            </button>
            <button
              onClick={() => setSidebarTab('settings')}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-md ${
                sidebarTab === 'settings' ? 'bg-primary text-primary-foreground font-semibold' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-black">
          <div className="rounded-xl border border-black bg-white p-4">
            <div className="text-xs font-semibold text-black mb-1">Audit Status</div>
            <div className="flex items-center gap-2 text-sm font-bold">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Compliant
            </div>
            <div className="text-xs text-gray-500 mt-2">Last audit: 2 days ago</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-white">
        {/* Overview Tab */}
        {sidebarTab === 'overview' && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Organization Dashboard</h1>
                <p className="text-black">Welcome back! Here's what's happening today.</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="/campaigns/new"
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  New Proposal
                </a>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
                <div className="text-sm font-medium text-black mb-2">Total Proposals</div>
                <div className="text-2xl font-bold">{stats.totalProposals}</div>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  {stats.activeProposals} active
                </div>
              </div>

              <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
                <div className="text-sm font-medium text-black mb-2">Approved</div>
                <div className="text-2xl font-bold">{stats.approvedProposals}</div>
                <div className="text-xs text-black mt-1">Ready for fundraising</div>
              </div>

              <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
                <div className="text-sm font-medium text-black mb-2">Total Raised</div>
                <div className="text-2xl font-bold">${stats.totalRaised.toLocaleString()}</div>
                <div className="text-xs text-black mt-1">From all campaigns</div>
              </div>

              <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
                <div className="text-sm font-medium text-black mb-2">Active Donors</div>
                <div className="text-2xl font-bold">12,543</div>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +8% this month
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Donations Table */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-black shadow-sm">
                  <div className="p-6 border-b border-black">
                    <h2 className="font-semibold">Recent Donations</h2>
                    <p className="text-sm text-black mt-1">Real-time view of incoming funds.</p>
                  </div>
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-black">
                            <th className="text-left py-2 px-2 font-medium text-black">Donor</th>
                            <th className="text-left py-2 px-2 font-medium text-black">Campaign</th>
                            <th className="text-left py-2 px-2 font-medium text-black">Amount</th>
                            <th className="text-left py-2 px-2 font-medium text-black">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {donations.map((donation, idx) => (
                            <tr key={idx} className="border-b border-black hover:bg-gray-50">
                              <td className="py-3 px-2">
                                <div className="font-medium">{donation.donor}</div>
                                <div className="text-xs text-black">{donation.address}</div>
                              </td>
                              <td className="py-3 px-2 truncate max-w-[150px]">{donation.campaign}</td>
                              <td className="py-3 px-2 font-bold text-green-600">+{donation.amount}</td>
                              <td className="py-3 px-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700">
                                  {donation.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <div className="bg-primary/5 rounded-xl border border-primary/20 shadow-sm">
                  <div className="p-6 border-b border-primary/20">
                    <h2 className="font-semibold">Quick Actions</h2>
                  </div>
                  <div className="p-6 space-y-3">
                    <a
                      href="/campaigns/new"
                      className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      Create Proposal
                    </a>
                    <button className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-md border border-black hover:bg-gray-50 font-medium">
                      <Download className="h-4 w-4" />
                      Export Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Proposals Tab */}
        {sidebarTab === 'proposals' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">My Proposals</h1>
                <p className="text-black">Manage your fundraising proposals</p>
              </div>
              <a
                href="/campaigns/new"
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                New Proposal
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
                <div className="text-sm font-medium text-black mb-2">Total Proposals</div>
                <div className="text-2xl font-bold">{stats.totalProposals}</div>
              </div>
              <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
                <div className="text-sm font-medium text-black mb-2">Active</div>
                <div className="text-2xl font-bold">{stats.activeProposals}</div>
              </div>
              <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
                <div className="text-sm font-medium text-black mb-2">Approved</div>
                <div className="text-2xl font-bold">{stats.approvedProposals}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-black shadow-sm">
              <div className="p-6 border-b border-black">
                <h2 className="font-semibold">All Proposals</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {myProposals.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="mb-4">No proposals yet. Create your first proposal to get started!</p>
                      <a
                        href="/campaigns/new"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4" />
                        Create Proposal
                      </a>
                    </div>
                  ) : (
                    myProposals.map((proposal) => (
                      <ProposalCard
                        key={proposal.id}
                        proposal={proposal}
                        onCreatePool={() => handleCreatePool(proposal.id)}
                        isLoading={isPoolManagerLoading}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Pools Tab */}
        {sidebarTab === 'pools' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Campaign Pools</h1>
              <p className="text-black">Manage your active fundraising campaigns</p>
            </div>

            <div className="bg-white rounded-xl border border-black shadow-sm">
              <div className="p-6 border-b border-black">
                <h2 className="font-semibold">Active Pools</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {myProposals
                    .filter(p => p.poolId && p.poolId !== '0')
                    .map((proposal) => (
                      <PoolCard
                        key={proposal.id}
                        proposal={proposal}
                        onWithdraw={() => handleWithdraw(proposal.poolId)}
                        isLoading={isPoolManagerLoading}
                      />
                    ))}
                  {myProposals.filter(p => p.poolId && p.poolId !== '0').length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active pools. Create a proposal and get it approved to start fundraising!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Milestones Tab */}
        {sidebarTab === 'milestones' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Milestone Management</h1>
              <p className="text-black">Submit proof, track voting, and withdraw milestone funds</p>
            </div>

            <div className="space-y-6">
              {myProposals.filter(p => p.poolId && p.poolId !== '0').length === 0 ? (
                <div className="bg-white rounded-xl border border-black shadow-sm p-12 text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No campaigns with milestones yet.</p>
                  <p className="text-sm text-muted-foreground">Create a proposal with milestones and get it approved to start managing milestones.</p>
                </div>
              ) : (
                myProposals
                  .filter(p => p.poolId && p.poolId !== '0')
                  .map((proposal) => (
                    <MilestoneManagementCard
                      key={proposal.id}
                      proposal={proposal}
                      onRefresh={refetchProposals}
                    />
                  ))
              )}
            </div>
          </>
        )}

        {/* Reports Tab */}
        {sidebarTab === 'reports' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                <p className="text-black">Generate and download compliance reports</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-md border border-black bg-white shadow-sm hover:bg-gray-50">
                <Download className="h-4 w-4" />
                Generate Report
              </button>
            </div>

            <div className="bg-white rounded-xl border border-black shadow-sm mb-6">
              <div className="p-6 border-b border-black">
                <h2 className="font-semibold">Available Reports</h2>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { title: 'Monthly Financial Report', desc: 'Detailed breakdown of all donations and expenditures', period: 'November 2025' },
                  { title: 'Impact Assessment Report', desc: 'Measurable outcomes and beneficiary statistics', period: 'Q4 2025' },
                  { title: 'Donor Transparency Report', desc: 'Public report showing fund allocation', period: 'November 2025' },
                  { title: 'Zakat Compliance Report', desc: 'Religious compliance documentation', period: 'November 2025' },
                ].map((report, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50">
                    <div>
                      <h3 className="font-semibold">{report.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{report.desc}</p>
                      <p className="text-xs text-muted-foreground mt-1">Period: {report.period}</p>
                    </div>
                    <button className="px-4 py-2 rounded-md border border-black hover:bg-gray-50 text-sm font-medium">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Settings Tab */}
        {sidebarTab === 'settings' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
              <p className="text-black">Manage your organization profile and preferences</p>
            </div>

            <div className="bg-white rounded-xl border border-black shadow-sm mb-6">
              <div className="p-6 border-b border-border">
                <h3 className="font-semibold text-lg">Organization Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Organization Name</label>
                  <input type="text" defaultValue="ZK Zakat Organization" className="w-full mt-1 px-3 py-2 border border-border rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
                  <input type="text" defaultValue="REG-2025-001" className="w-full mt-1 px-3 py-2 border border-border rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
                  <input type="email" defaultValue="contact@zkt.app" className="w-full mt-1 px-3 py-2 border border-border rounded-md" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-black shadow-sm">
              <div className="p-6 border-b border-border">
                <h3 className="font-semibold text-lg">Compliance Status</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <div className="font-semibold">Verified Organization</div>
                    <div className="text-sm text-muted-foreground">Your organization is fully verified and compliant</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Last audit: 2 days ago</div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// Proposal Card Component
function ProposalCard({
  proposal,
  onCreatePool,
  isLoading
}: {
  proposal: any
  onCreatePool: () => void
  isLoading: boolean
}) {
  const statusLabel = getProposalStatusLabel(proposal.statusEnum);
  const statusColor = getProposalStatusColor(proposal.statusEnum);

  const canCreatePool = proposal.statusEnum === 5; // ShariaApproved

  return (
    <div className="border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{proposal.title}</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{proposal.description}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Funding Goal</span>
          <span className="font-medium">{proposal.fundingGoal}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Created</span>
          <span className="font-medium">{proposal.createdAt}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">KYC Status</span>
          <span className="font-medium">
            {proposal.kycStatus === 1 ? 'Verified' : proposal.kycStatus === 2 ? 'Not Required' : 'Pending'}
          </span>
        </div>
        {proposal.poolId && proposal.poolId !== '0' && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pool ID</span>
            <span className="font-medium">#{proposal.poolId}</span>
          </div>
        )}
      </div>

      {canCreatePool && (
        <Button
          onClick={onCreatePool}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Create Campaign Pool
        </Button>
      )}
    </div>
  );
}

// Pool Card Component
function PoolCard({
  proposal,
  onWithdraw,
  isLoading
}: {
  proposal: any
  onWithdraw: () => void
  isLoading: boolean
}) {
  return (
    <div className="border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{proposal.title}</h3>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-300">
              Active
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Pool #{proposal.poolId}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">0%</span>
        </div>
        <Progress value={0} className="h-2" />
      </div>

      <Button
        onClick={onWithdraw}
        disabled={isLoading}
        variant="outline"
        className="w-full"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
        Withdraw Funds
      </Button>
    </div>
  );
}

// Milestone Management Card Component
function MilestoneManagementCard({
  proposal,
  onRefresh
}: {
  proposal: any
  onRefresh: () => void
}) {
  const [uploadingMilestoneId, setUploadingMilestoneId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Get proposal ID from the proposal (assuming it's the numeric ID)
  const proposalId = parseInt(proposal.id);
  const poolId = parseInt(proposal.poolId);

  // Fetch milestones for this proposal
  const { milestones, isLoading: milestonesLoading, refetch: refetchMilestones } = useMilestones(proposalId);

  // Milestone actions
  const {
    submitMilestoneProof,
    startMilestoneVoting,
    withdrawMilestoneFunds,
    isLoading: actionLoading
  } = useMilestoneActions({
    onSuccess: () => {
      refetchMilestones();
      onRefresh();
    }
  });

  // Handle file selection for proof upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, milestoneId: number) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadingMilestoneId(milestoneId);
    }
  };

  // Handle proof submission
  const handleSubmitProof = async (milestoneId: number) => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    try {
      // Upload to Pinata
      const [ipfsCID] = await uploadFilesToPinata([selectedFile]);
      
      // Submit proof to contract
      await submitMilestoneProof(proposalId, milestoneId, ipfsCID);
      
      setSelectedFile(null);
      setUploadingMilestoneId(null);
      
      toast({
        title: "Success",
        description: "Proof submitted successfully!"
      });
    } catch (error: any) {
      console.error("Error submitting proof:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to submit proof",
        variant: "destructive"
      });
    }
  };

  // Handle start voting
  const handleStartVoting = async (milestoneId: number) => {
    try {
      await startMilestoneVoting(proposalId, milestoneId);
    } catch (error) {
      console.error("Error starting voting:", error);
    }
  };

  // Handle withdraw funds
  const handleWithdraw = async (milestoneId: number) => {
    try {
      await withdrawMilestoneFunds(poolId, milestoneId);
    } catch (error) {
      console.error("Error withdrawing funds:", error);
    }
  };

  if (milestonesLoading) {
    return (
      <div className="bg-white rounded-xl border border-black shadow-sm p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading milestones...</span>
        </div>
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-black shadow-sm p-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold">{proposal.title}</h3>
          <span className="text-xs text-muted-foreground">Pool #{proposal.poolId}</span>
        </div>
        <p className="text-sm text-muted-foreground">No milestones defined for this campaign.</p>
      </div>
    );
  }

  const completedCount = milestones.filter(m => m.status === MilestoneStatus.Completed).length;

  return (
    <div className="bg-white rounded-xl border border-black shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-black">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{proposal.title}</h3>
            <p className="text-sm text-muted-foreground">Pool #{proposal.poolId} • Proposal #{proposal.id}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{completedCount} / {milestones.length}</div>
            <div className="text-xs text-muted-foreground">Milestones completed</div>
          </div>
        </div>
        <Progress value={(completedCount / milestones.length) * 100} className="h-2 mt-4" />
      </div>

      {/* Milestones List */}
      <div className="p-6 space-y-4">
        {milestones.map((milestone, idx) => (
          <div key={idx} className="border border-border rounded-lg p-4 space-y-3">
            {/* Milestone Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Milestone {idx + 1}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getMilestoneStatusColor(milestone.status)}`}>
                    {milestone.statusLabel}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{milestone.description}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-primary">{milestone.targetAmount} IDRX</span>
              </div>
            </div>

            {/* Proof Link (if submitted) */}
            {milestone.proofIPFS && (
              <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-md p-2">
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-yellow-800">Community Voting in Progress</span>
                  <span className="text-yellow-600">Ends: {milestone.voteEnd}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600 font-medium">For: {milestone.votesFor}</span>
                  <span className="text-red-500 font-medium">Against: {milestone.votesAgainst}</span>
                  <span className="text-gray-500">Abstain: {milestone.votesAbstain}</span>
                </div>
              </div>
            )}

            {/* Actions based on status */}
            <div className="flex gap-2 pt-2">
              {/* Pending: Show upload proof button */}
              {milestone.canSubmitProof && (
                <div className="flex-1 space-y-2">
                  {uploadingMilestoneId === idx ? (
                    <div className="flex gap-2">
                      <input
                        type="file"
                        onChange={(e) => handleFileSelect(e, idx)}
                        className="flex-1 text-sm file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSubmitProof(idx)}
                        disabled={!selectedFile || actionLoading}
                      >
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setUploadingMilestoneId(null);
                          setSelectedFile(null);
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setUploadingMilestoneId(idx)}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Proof
                    </Button>
                  )}
                </div>
              )}

              {/* ProofSubmitted: Show start voting button */}
              {milestone.status === MilestoneStatus.ProofSubmitted && (
                <Button
                  size="sm"
                  onClick={() => handleStartVoting(idx)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  Start Voting
                </Button>
              )}

              {/* Approved: Show withdraw button */}
              {milestone.canWithdraw && (
                <Button
                  size="sm"
                  onClick={() => handleWithdraw(idx)}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
                  Withdraw Funds
                </Button>
              )}

              {/* Completed: Show completed badge */}
              {milestone.status === MilestoneStatus.Completed && (
                <div className="flex-1 flex items-center justify-center gap-2 text-green-600 bg-green-50 rounded-md py-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium text-sm">Completed on {milestone.releasedAt}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
