"use client";

import React, { useState } from 'react';
import { LayoutDashboard, TrendingUp, Users, FileText, Settings, Download, Plus, ArrowUpRight, ArrowDownRight, CheckCircle2, DollarSign, Calendar, Loader2, Shield, Clock } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useProposals, useProposalCount } from '@/hooks/useProposals';
import { usePoolManager, usePool } from '@/hooks/usePoolManager';
import { ProposalStatus, CampaignType, getProposalStatusLabel, getProposalStatusColor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

type SidebarTab = 'overview' | 'proposals' | 'pools' | 'reports' | 'settings';

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
