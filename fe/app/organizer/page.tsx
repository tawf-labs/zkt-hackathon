'use client';

import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, FileText, Upload, CheckCircle2, AlertCircle, Building2, Users, Clock, Target, Wallet, ArrowRight, Settings, ChevronRight, LayoutDashboard, PlusCircle } from "lucide-react";
import { useIsVerifiedOrganizer } from "@/hooks/useOrganizerApplication";
import { useAccount } from "wagmi";

export default function OrganizerPage() {
  const { address, isConnected } = useAccount();
  const { isVerified } = useIsVerifiedOrganizer(address);

  // Organizer navigation items
  const organizerNavItems = [
    { href: "/organizer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/organizer/proposals", label: "My Proposals", icon: FileText },
    { href: "/organizer/campaigns", label: "My Campaigns", icon: Target },
    { href: "/organizer/create", label: "Create Proposal", icon: PlusCircle },
    { href: "/organizer/settings", label: "Settings", icon: Settings },
  ];

  if (isConnected && !isVerified) {
    // Show application page if connected but not verified
    return <OrganizerNotVerified />;
  }

  // Show dashboard if verified
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Organizer Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
              ZK
            </div>
            <div>
              <div className="font-bold text-sm">ZKT Organizer</div>
              <div className="text-xs text-muted-foreground">Verified</div>
            </div>
          </div>

          {/* User Info */}
          <div className="mb-6 p-3 bg-secondary/30 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Connected as</div>
            <div className="text-sm font-mono truncate">{address}</div>
          </div>

          <nav className="space-y-1">
            {organizerNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.href === "/organizer/create" && (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-200">
            <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowRight className="h-4 w-4" />
              Back to Donor View
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <OrganizerDashboardContent />
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2">
        <div className="flex justify-around">
          {organizerNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-2 text-xs text-muted-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrganizerNotVerified() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>

          <h1 className="text-2xl font-bold">Become an Organizer</h1>
          <p className="text-muted-foreground">
            Your wallet is connected but you are not yet verified as an organizer.
          </p>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To create campaigns and manage fundraising, you need to apply and be verified as an organizer.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Link href="/organizer/apply">
              <Button className="w-full">
                Apply to Become an Organizer
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>

            <Link href="/">
              <Button variant="outline" className="w-full">
                Return to Donor View
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrganizerDashboardContent() {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Organizer Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your campaigns, track milestones, and engage with donors
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Campaigns"
          value="0"
          description="Campaigns currently fundraising"
          icon={Target}
          color="blue"
        />
        <StatCard
          title="Total Raised"
          value="0 IDRX"
          description="Across all campaigns"
          icon={Wallet}
          color="green"
        />
        <StatCard
          title="Milestones Completed"
          value="0/0"
          description="Milestone funds released"
          icon={CheckCircle2}
          color="purple"
        />
        <StatCard
          title="Donors"
          value="0"
          description="Unique contributors"
          icon={Users}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Create New Campaign"
          description="Launch a new Zakat or Normal campaign"
          icon={Upload}
          href="/organizer/create"
        />
        <QuickActionCard
          title="My Proposals"
          description="View and manage your campaign proposals"
          icon={FileText}
          href="/organizer/proposals"
        />
        <QuickActionCard
          title="Campaign Settings"
          description="Configure campaign parameters"
          icon={Settings}
          href="/organizer/settings"
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest campaign and proposal updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm">Create your first campaign to get started!</p>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Follow these steps to launch your first campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <span className="font-medium">Verify as an organizer (if not already done)</span>
            </li>
            <li className="flex gap-3">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <span className="font-medium">Create a proposal with campaign details and milestones</span>
            </li>
            <li className="flex gap-3">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <span className="font-medium">Submit for community voting and get approved</span>
            </li>
            <li className="flex gap-3">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">4</span>
              <span className="font-medium">Create campaign pool and start fundraising</span>
            </li>
            <li className="flex gap-3">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">5</span>
              <span className="font-medium">Manage milestones, withdraw funds, or handle Zakat redistribution</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color
}: {
  title: string;
  value: string;
  description: string;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className={`h-10 w-10 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href
}: {
  title: string;
  description: string;
  icon: any;
  href: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="transition-all hover:shadow-md hover:border-primary/50 h-full">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
