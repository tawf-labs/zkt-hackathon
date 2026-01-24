"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { campaigns, calculateProgress, formatCurrency } from "@/data/campaigns";
import { CampaignCard } from "@/components/shared/campaign-card";

export function FeaturedCampaigns() {
  // Ambil hanya 3 campaign pertama untuk featured
  const featuredCampaigns = campaigns.slice(0, 3);

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container px-4 mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Featured Campaigns</h2>
            <p className="text-muted-foreground max-w-2xl">
              Support verified projects and track your impact on the blockchain.
            </p>
          </div>

          <Link href="/campaigns">
            <button className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all h-9 px-4 py-2 group hover:bg-accent hover:text-accent-foreground">
              View all campaigns
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              calculateProgress={calculateProgress}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
      </div>
    </section>
  );
}