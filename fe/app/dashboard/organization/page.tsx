"use client";

import React, { useState } from 'react';
import { LayoutDashboard, TrendingUp, Users, FileText, Settings, Download, Plus, ArrowUpRight, ArrowDownRight, CheckCircle2, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { LockAllocationButton } from '@/components/shared/lock-allocation-button';
import { CampaignStatusBadge } from '@/components/campaigns/campaign-status-badge';
import { AllocationProgress } from '@/components/campaigns/allocation-progress';
import { useCampaignStatus } from '@/hooks/useCampaignStatus';
import { Progress } from '@/components/ui/progress';

type SidebarTab = 'overview' | 'campaigns' | 'donors' | 'reports' | 'settings';

interface CampaignData {
  id: string;
  name: string;
  target: string;
  raised: string;
  percentage: number;
  status: string;
  locked: boolean;
}

// Campaign card component with status tracking
function CampaignCard({ campaign }: { campaign: CampaignData }) {
  const { statusInfo, totalBps, allocationLocked, canDonate, isLoading } = useCampaignStatus(campaign.id);

  return (
    <div className="border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{campaign.name}</h3>
            <CampaignStatusBadge statusInfo={statusInfo} isLoading={isLoading} size="sm" />
          </div>
          <p className="text-sm text-muted-foreground">
            {campaign.raised} raised of {campaign.target} target
          </p>
        </div>
      </div>

      {/* Fundraising Progress */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-primary h-2 rounded-full" style={{ width: `${campaign.percentage}%` }}></div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{campaign.percentage}% complete</span>
        <span>{canDonate ? '✓ Accepting donations' : 'Not accepting donations'}</span>
      </div>

      {/* Allocation Progress - Only show for active campaigns */}
      {campaign.status === 'Active' && (
        <div className="pt-3 border-t border-border">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading allocation status...</span>
            </div>
          ) : (
            <AllocationProgress
              totalBps={totalBps}
              allocationLocked={allocationLocked}
              campaignId={campaign.id}
              campaignName={campaign.name}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function BaznasDashboard() {
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('overview');
  const donations = [
    { donor: 'Anonymous Donor', address: '0x72...9a2', campaign: 'Emergency Relief for...', amount: '$150.00', status: 'Verified' },
    { donor: 'Anonymous Donor', address: '0x72...9a2', campaign: 'Emergency Relief for...', amount: '$150.00', status: 'Verified' },
    { donor: 'Anonymous Donor', address: '0x72...9a2', campaign: 'Emergency Relief for...', amount: '$150.00', status: 'Verified' },
    { donor: 'Anonymous Donor', address: '0x72...9a2', campaign: 'Emergency Relief for...', amount: '$150.00', status: 'Verified' },
    { donor: 'Anonymous Donor', address: '0x72...9a2', campaign: 'Emergency Relief for...', amount: '$150.00', status: 'Verified' },
  ];

  const deploymentRequests = [
    { title: 'Medical Supplies Procurement', amount: '$12,500', status: 'Pending Approval' },
    { title: 'Medical Supplies Procurement', amount: '$12,500', status: 'Pending Approval' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-black hidden lg:block">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center text-black font-bold">
              BZ
            </div>
            <div>
              <div className="font-bold">Baznas Ind...</div>
              <div className="text-xs text-muted-foreground">Organization</div>
            </div>
          </div>
          
          <nav className="space-y-1">
            <button 
              onClick={() => setSidebarTab('overview')}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-md ${
                sidebarTab === 'overview' ? 'bg-white shadow-sm font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </button>
            <button 
              onClick={() => setSidebarTab('campaigns')}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-md ${
                sidebarTab === 'campaigns' ? 'bg-white shadow-sm font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Campaigns
            </button>
            <button 
              onClick={() => setSidebarTab('donors')}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-md ${
                sidebarTab === 'donors' ? 'bg-white shadow-sm font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="h-4 w-4" />
              Donors
            </button>
            <button 
              onClick={() => setSidebarTab('reports')}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-md ${
                sidebarTab === 'reports' ? 'bg-white shadow-sm font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="h-4 w-4" />
              Reports
            </button>
            <button 
              onClick={() => setSidebarTab('settings')}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-md ${
                sidebarTab === 'settings' ? 'bg-white shadow-sm font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-100'
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
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-black">Welcome back, admin. Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-md border border-black bg-white shadow-sm">
              <Download className="h-4 w-4" />
              Export Data
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-white text-black shadow-md">
              <Plus className="h-4 w-4" />
              New Campaign
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
            <div className="text-sm font-medium text-black mb-2">Total Funds Raised</div>
            <div className="text-2xl font-bold">$2,450,000</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <ArrowUpRight className="h-3 w-3" />
              +15% this month
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
            <div className="text-sm font-medium text-black mb-2">Active Donors</div>
            <div className="text-2xl font-bold">12,543</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <ArrowUpRight className="h-3 w-3" />
              +8% new donors
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
            <div className="text-sm font-medium text-black mb-2">Funds Deployed</div>
            <div className="text-2xl font-bold">$1,800,000</div>
            <div className="text-xs text-black mt-1">73% utilization rate</div>
          </div>
          
          <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
            <div className="text-sm font-medium text-black mb-2">Pending Reports</div>
            <div className="text-2xl font-bold">3</div>
            <div className="text-xs text-orange-600 mt-1">Action required</div>
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

          {/* Sidebar Cards */}
          <div className="space-y-6">
            {/* One-Click Reporting */}
            <div className="bg-gray-100/50 rounded-xl border border-black shadow-sm">
              <div className="p-6 border-b border-black">
                <h2 className="font-semibold">One-Click Reporting</h2>
                <p className="text-sm text-black mt-1">Generate compliance reports for Baznas automatically.</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Financials</span>
                    <span className="px-2 py-0.5 rounded-md border border-black text-xs font-medium">Ready</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Impact Assessment</span>
                    <span className="px-2 py-0.5 rounded-md border border-black text-xs font-medium">Ready</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Donor Transparency</span>
                    <span className="px-2 py-0.5 rounded-md border border-black text-xs font-medium">Ready</span>
                  </div>
                </div>
                <button className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-white text-black hover:bg-gray-100 shadow-sm font-medium">
                  <Download className="h-4 w-4" />
                  Generate PDF Report
                </button>
              </div>
            </div>

            {/* Deployment Requests */}
            <div className="bg-white rounded-xl border border-black shadow-sm">
              <div className="p-6 border-b border-black">
                <h2 className="font-semibold">Deployment Requests</h2>
                <p className="text-sm text-black mt-1">Funds waiting for deployment approval.</p>
              </div>
              <div className="p-6 space-y-4">
                {deploymentRequests.map((request, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-4 border-b border-black last:border-0 last:pb-0">
                    <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                      <ArrowDownRight className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{request.title}</div>
                      <div className="text-xs text-black">{request.amount} • {request.status}</div>
                      <div className="flex gap-2 mt-2">
                        <button className="px-3 py-1 text-xs font-medium rounded-md border border-black hover:bg-gray-50">
                          View
                        </button>
                        <button className="px-3 py-1 text-xs font-medium rounded-md bg-white text-black hover:bg-gray-100">
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </>
        )}

        {/* Campaigns Tab */}
        {sidebarTab === 'campaigns' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
                <p className="text-black">Manage all your fundraising campaigns</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white shadow-md hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                New Campaign
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
                <div className="text-sm font-medium text-black mb-2">Active Campaigns</div>
                <div className="text-2xl font-bold">8</div>
              </div>
              <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
                <div className="text-sm font-medium text-black mb-2">Completed Campaigns</div>
                <div className="text-2xl font-bold">24</div>
              </div>
              <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
                <div className="text-sm font-medium text-black mb-2">Total Raised</div>
                <div className="text-2xl font-bold">$2,450,000</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-black shadow-sm">
              <div className="p-6 border-b border-black">
                <h2 className="font-semibold">All Campaigns</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { id: '0x7d8b402003c09b26e55ac0a61bc8cf936a62a286490096ca7a193a3b63ae81f8', name: 'Emergency Relief Fund', target: '$50,000', raised: '$38,500', percentage: 77, status: 'Active', locked: false },
                    { id: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0', name: 'Education for All', target: '$30,000', raised: '$24,000', percentage: 80, status: 'Active', locked: false },
                    { id: '0x9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h', name: 'Clean Water Initiative', target: '$40,000', raised: '$40,000', percentage: 100, status: 'Completed', locked: true },
                  ].map((campaign, idx) => (
                    <CampaignCard key={idx} campaign={campaign} />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Donors Tab */}
        {sidebarTab === 'donors' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Donors</h1>
              <p className="text-black">Manage your donor community</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
                <div className="text-sm font-medium text-black mb-2">Total Donors</div>
                <div className="text-2xl font-bold">12,543</div>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +8% new donors
                </div>
              </div>
              <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
                <div className="text-sm font-medium text-black mb-2">Recurring Donors</div>
                <div className="text-2xl font-bold">3,421</div>
              </div>
              <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
                <div className="text-sm font-medium text-black mb-2">Average Donation</div>
                <div className="text-2xl font-bold">$195</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-black shadow-sm">
              <div className="p-6 border-b border-black">
                <h2 className="font-semibold">Top Donors</h2>
              </div>
              <div className="p-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="text-left py-2 px-2 font-medium text-black">Donor</th>
                      <th className="text-left py-2 px-2 font-medium text-black">Total Donated</th>
                      <th className="text-left py-2 px-2 font-medium text-black">Campaigns</th>
                      <th className="text-left py-2 px-2 font-medium text-black">Last Donation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Anonymous Donor', address: '0x72...9a2', total: '$5,000', campaigns: 12, lastDate: 'Nov 20, 2025' },
                      { name: 'Anonymous Donor', address: '0x8b...4f3', total: '$3,500', campaigns: 8, lastDate: 'Nov 18, 2025' },
                      { name: 'Anonymous Donor', address: '0x3d...7c1', total: '$2,800', campaigns: 15, lastDate: 'Nov 15, 2025' },
                    ].map((donor, idx) => (
                      <tr key={idx} className="border-b border-black hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <div className="font-medium">{donor.name}</div>
                          <div className="text-xs text-black">{donor.address}</div>
                        </td>
                        <td className="py-3 px-2 font-bold text-green-600">{donor.total}</td>
                        <td className="py-3 px-2">{donor.campaigns}</td>
                        <td className="py-3 px-2 text-black">{donor.lastDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  { title: 'Baznas Compliance Report', desc: 'Regulatory compliance documentation', period: 'November 2025' },
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
                  <input type="text" defaultValue="Baznas Indonesia" className="w-full mt-1 px-3 py-2 border border-border rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
                  <input type="text" defaultValue="REG-2025-001" className="w-full mt-1 px-3 py-2 border border-border rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
                  <input type="email" defaultValue="contact@baznas.org" className="w-full mt-1 px-3 py-2 border border-border rounded-md" />
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