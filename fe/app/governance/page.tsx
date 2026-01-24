"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Vote, Users, Clock, CheckCircle2, Shield, Plus, ThumbsUp, ThumbsDown, LayoutDashboard, FileText, Settings, Download, TrendingUp, Loader2, AlertCircle } from "lucide-react"
import { useProposals, useProposalCount } from "@/hooks/useProposals"
import { useVoting } from "@/hooks/useVoting"
import { useVotingPower } from "@/hooks/useVotingPower"
import { useAccount } from "wagmi"
import { handleTransactionError, handleWalletError } from "@/lib/errors"
import { useToast } from "@/hooks/use-toast"
import { ProposalStatus, KYCStatus, CampaignType, getProposalStatusLabel, getCampaignTypeLabel, VoteSupport } from "@/lib/types"

export default function GovernancePage() {
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const [hasVoted, setHasVoted] = useState<Record<string, boolean>>({})

  // Get real voting power from blockchain
  const { votingPower, formattedVotingPower, isLoading: isLoadingVotingPower } = useVotingPower()

  // Get proposal count first
  const { proposalCount, isLoading: isLoadingCount } = useProposalCount()
  const proposalCountNum = proposalCount ? Number(proposalCount) : 0

  // Get all proposals
  const proposalIds = proposalCountNum > 0 ? Array.from({ length: Math.min(proposalCountNum, 10) }, (_, i) => i) : [0, 1, 2, 3]
  const { proposals: blockchainProposals, isLoading: isLoadingProposals, refetch: refetchProposals } = useProposals(proposalIds)

  // Voting hook
  const { castVote, finalizeCommunityVote, submitForCommunityVote, isLoading: isVoting } = useVoting()

  const handleVote = async (proposalId: string, voteType: "for" | "against" | "abstain") => {
    if (!isConnected) {
      handleWalletError(new Error("not-connected"), { toast })
      return
    }

    const support = voteType === "for" ? VoteSupport.For : voteType === "against" ? VoteSupport.Against : VoteSupport.Abstain

    const result = await castVote(BigInt(proposalId), support)
    if (result) {
      setHasVoted({ ...hasVoted, [proposalId]: true })
      await refetchProposals()
    }
  }

  const handleFinalize = async (proposalId: string) => {
    if (!isConnected) {
      handleWalletError(new Error("not-connected"), { toast })
      return
    }

    await finalizeCommunityVote(BigInt(proposalId))
    await refetchProposals()
  }

  const handleSubmitForVote = async (proposalId: string) => {
    if (!isConnected) {
      handleWalletError(new Error("not-connected"), { toast })
      return
    }

    await submitForCommunityVote(BigInt(proposalId))
    await refetchProposals()
  }

  const userVotingPower = Number(votingPower || BigInt(0))
  const isLoading = isLoadingVotingPower || isLoadingProposals || isLoadingCount

  // Map blockchain proposals to UI format
  const proposals = blockchainProposals.map((p) => {
    const totalVotes = BigInt(p.votesFor) + BigInt(p.votesAgainst) + BigInt(p.votesAbstain)
    const now = BigInt(Math.floor(Date.now() / 1000))
    const startTime = BigInt(p.createdAtRaw)
    const endTime = BigInt(p.createdAtRaw) + BigInt(7 * 24 * 60 * 60) // 7 days from creation

    const isActive = p.status === ProposalStatus.CommunityVote && now >= startTime && now <= endTime
    const isPending = p.status === ProposalStatus.CommunityPassed
    const isCompleted = p.status === ProposalStatus.Completed || p.status === ProposalStatus.PoolCreated
    const isRejected = p.status === ProposalStatus.CommunityRejected || p.status === ProposalStatus.ShariaRejected

    const daysLeft = endTime > now ? Number((endTime - now) / BigInt(86400)) : 0

    const votesFor = Number(p.votesFor)
    const votesAgainst = Number(p.votesAgainst)
    const votesAbstain = Number(p.votesAbstain)
    const totalVotesNum = votesFor + votesAgainst + votesAbstain
    const percentage = totalVotesNum > 0 ? (votesFor / totalVotesNum) * 100 : 0

    return {
      id: p.id,
      title: p.title,
      description: p.description,
      status: isActive ? "Active" : isPending ? "Pending Review" : isCompleted ? "Approved" : isRejected ? "Rejected" : "Draft",
      statusEnum: p.status,
      type: p.campaignType === CampaignType.ZakatCompliant ? "Sharia Council" : "Community",
      votesFor,
      votesAgainst,
      votesAbstain,
      totalVotes: totalVotesNum,
      quorum: 2000, // This should come from contract
      percentage,
      endsIn: isActive ? `${daysLeft} days` : isCompleted ? "Passed" : isPending ? "Awaiting Council" : "Draft",
      createdBy: p.organizer ? `${p.organizer.slice(0, 6)}...${p.organizer.slice(-4)}` : "Unknown",
      isEmergency: false,
      isShariaApproved: p.status === ProposalStatus.ShariaApproved || p.status === ProposalStatus.PoolCreated,
      canSubmitForVote: p.status === ProposalStatus.Draft,
      canFinalize: p.status === ProposalStatus.CommunityVote && now >= endTime,
    }
  })

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-white">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Governance Portal</h1>
            <p className="text-black">Participate in ZKT.app's dual-layer DAO governance system</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-white text-black shadow-md border border-black">
                  <Plus className="h-4 w-4" />
                  New Proposal
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Proposal</DialogTitle>
                  <DialogDescription>
                    Submit a proposal for community voting. Requires minimum 100 voting power.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Proposal Title</Label>
                    <Input id="title" placeholder="Brief, descriptive title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Detailed explanation of your proposal..." rows={6} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fundingGoal">Funding Goal (IDRX)</Label>
                    <Input id="fundingGoal" type="number" placeholder="10000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Your Voting Power</Label>
                    <div className="text-2xl font-bold text-black">{userVotingPower}</div>
                  </div>
                  <Button className="w-full">Submit Proposal</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-black">Your Voting Power</div>
              <Vote className="h-4 w-4 text-gray-600" />
            </div>
            <div className="text-2xl font-bold">
              {isLoadingVotingPower ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                formattedVotingPower
              )}
            </div>
            <div className="text-xs text-black mt-1">From donations</div>
          </div>

          <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-black">Active Proposals</div>
              <Clock className="h-4 w-4 text-gray-600" />
            </div>
            <div className="text-2xl font-bold">{proposals.filter((p) => p.status === "Active").length}</div>
            <div className="text-xs text-black mt-1">Open for voting</div>
          </div>

          <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-black">Total Voters</div>
              <Users className="h-4 w-4 text-gray-600" />
            </div>
            <div className="text-2xl font-bold">3,421</div>
            <div className="text-xs text-black mt-1">vZKT holders</div>
          </div>

          <div className="bg-white rounded-xl border border-black p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-black">Proposals Passed</div>
              <CheckCircle2 className="h-4 w-4 text-gray-600" />
            </div>
            <div className="text-2xl font-bold">{proposals.filter((p) => p.status === "Approved").length}</div>
            <div className="text-xs text-black mt-1">All-time</div>
          </div>
        </div>

        {/* DAO Structure Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-100/50 rounded-xl border border-black shadow-sm">
            <div className="p-6 border-b border-black">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-black" />
                <h2 className="font-semibold">Layer 1: Community DAO</h2>
              </div>
              <p className="text-sm text-black mt-1">Donors with vZKT tokens vote on platform proposals</p>
            </div>
            <div className="p-6 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Vote on campaign proposals</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Approve funding goals</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Platform governance</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-100/50 rounded-xl border border-black shadow-sm">
            <div className="p-6 border-b border-black">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-black" />
                <h2 className="font-semibold">Layer 2: Sharia Council</h2>
              </div>
              <p className="text-sm text-black mt-1">Final review to ensure Sharia compliance</p>
            </div>
            <div className="p-6 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Review community-approved proposals</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Ensure Zakat compliance</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Protect donor interests</span>
              </div>
            </div>
          </div>
        </div>

        {/* Proposals Section */}
        <div className="bg-white rounded-xl border border-black shadow-sm">
          <div className="p-6 border-b border-black">
            <h2 className="font-semibold">All Proposals</h2>
            <p className="text-sm text-black mt-1">View and vote on proposals to shape the platform's future</p>
          </div>

          <Tabs defaultValue="all" className="p-6">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Proposals</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-0">
              {proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  hasVoted={hasVoted[proposal.id]}
                  onVote={(voteType) => handleVote(proposal.id, voteType)}
                  onFinalize={() => handleFinalize(proposal.id)}
                  onSubmitForVote={() => handleSubmitForVote(proposal.id)}
                  isLoading={isVoting}
                />
              ))}
              {proposals.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No proposals found. Create one to get started!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4 mt-0">
              {proposals
                .filter((p) => p.status === "Active")
                .map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    hasVoted={hasVoted[proposal.id]}
                    onVote={(voteType) => handleVote(proposal.id, voteType)}
                    onFinalize={() => handleFinalize(proposal.id)}
                    onSubmitForVote={() => handleSubmitForVote(proposal.id)}
                    isLoading={isVoting}
                  />
                ))}
              {proposals.filter((p) => p.status === "Active").length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active proposals at the moment.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4 mt-0">
              {proposals
                .filter((p) => p.status === "Pending Review")
                .map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    hasVoted={hasVoted[proposal.id]}
                    onVote={(voteType) => handleVote(proposal.id, voteType)}
                    onFinalize={() => handleFinalize(proposal.id)}
                    onSubmitForVote={() => handleSubmitForVote(proposal.id)}
                    isLoading={isVoting}
                  />
                ))}
              {proposals.filter((p) => p.status === "Pending Review").length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No proposals pending Sharia Council review.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4 mt-0">
              {proposals
                .filter((p) => p.status === "Approved")
                .map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    hasVoted={hasVoted[proposal.id]}
                    onVote={(voteType) => handleVote(proposal.id, voteType)}
                    onFinalize={() => handleFinalize(proposal.id)}
                    onSubmitForVote={() => handleSubmitForVote(proposal.id)}
                    isLoading={isVoting}
                  />
                ))}
              {proposals.filter((p) => p.status === "Approved").length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No approved proposals yet.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

// Proposal Card Component
function ProposalCard({
  proposal,
  hasVoted,
  onVote,
  onFinalize,
  onSubmitForVote,
  isLoading,
}: {
  proposal: any
  hasVoted?: boolean
  onVote: (voteType: "for" | "against" | "abstain") => void
  onFinalize: () => void
  onSubmitForVote: () => void
  isLoading: boolean
}) {
  const quorumPercentage = proposal.totalVotes > 0 ? (proposal.totalVotes / proposal.quorum) * 100 : 0

  return (
    <div className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
      proposal.status === "Active" ? "border-black bg-white" :
      proposal.status === "Pending Review" ? "border-yellow-300 bg-yellow-50" :
      proposal.status === "Approved" ? "border-green-300 bg-green-50" :
      proposal.status === "Rejected" ? "border-red-300 bg-red-50" :
      "border-gray-300 bg-gray-50"
    }`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
              proposal.status === "Active" ? "bg-green-100 text-green-700 border-green-300" :
              proposal.status === "Pending Review" ? "bg-yellow-100 text-yellow-700 border-yellow-300" :
              proposal.status === "Approved" ? "bg-green-100 text-green-700 border-green-300" :
              proposal.status === "Rejected" ? "bg-red-100 text-red-700 border-red-300" :
              "bg-gray-100 text-gray-700 border-gray-300"
            }`}>
              {proposal.status}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-black">
              {proposal.type}
            </span>
            {proposal.isShariaApproved && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-black gap-1">
                <Shield className="h-3 w-3" />
                Sharia Compliant
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold mb-2">{proposal.title}</h3>
          <p className="text-sm text-gray-700 line-clamp-2">{proposal.description}</p>
        </div>
      </div>

      {/* Voting Stats */}
      {proposal.status !== "Draft" && (
        <>
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Votes</span>
              <span className="font-medium">
                {proposal.totalVotes.toLocaleString()} / {proposal.quorum.toLocaleString()} (quorum)
              </span>
            </div>
            <Progress value={Math.min(quorumPercentage, 100)} className="h-2" />

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" /> For
                  </span>
                  <span className="font-bold">{proposal.votesFor.toLocaleString()}</span>
                </div>
                <Progress value={proposal.percentage} className="h-1.5 [&>div]:bg-green-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600 font-medium flex items-center gap-1">
                    <ThumbsDown className="h-3 w-3" /> Against
                  </span>
                  <span className="font-bold">{proposal.votesAgainst.toLocaleString()}</span>
                </div>
                <Progress value={proposal.totalVotes > 0 ? (proposal.votesAgainst / proposal.totalVotes) * 100 : 0} className="h-1.5 [&>div]:bg-red-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">Abstain</span>
                  <span className="font-bold">{proposal.votesAbstain.toLocaleString()}</span>
                </div>
                <Progress value={proposal.totalVotes > 0 ? (proposal.votesAbstain / proposal.totalVotes) * 100 : 0} className="h-1.5 [&>div]:bg-gray-400" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <Clock className="inline h-3 w-3 mr-1" />
          {proposal.endsIn}
        </div>
        <div className="flex gap-2">
          {/* Draft - Submit for Vote */}
          {proposal.canSubmitForVote && (
            <Button
              size="sm"
              onClick={onSubmitForVote}
              disabled={isLoading}
            >
              Submit for Vote
            </Button>
          )}

          {/* Active - Vote Buttons */}
          {proposal.status === "Active" && (
            <>
              {hasVoted ? (
                <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-100 border border-black gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Voted
                </span>
              ) : (
                <>
                  <button
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md border border-green-600 text-green-600 hover:bg-green-600 hover:text-white bg-transparent disabled:opacity-50"
                    onClick={() => onVote("for")}
                    disabled={isLoading}
                  >
                    <ThumbsUp className="h-3 w-3" />
                    Vote For
                  </button>
                  <button
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md border border-red-600 text-red-600 hover:bg-red-600 hover:text-white bg-transparent disabled:opacity-50"
                    onClick={() => onVote("against")}
                    disabled={isLoading}
                  >
                    <ThumbsDown className="h-3 w-3" />
                    Against
                  </button>
                  <button
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md border border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white bg-transparent disabled:opacity-50"
                    onClick={() => onVote("abstain")}
                    disabled={isLoading}
                  >
                    Abstain
                  </button>
                </>
              )}
            </>
          )}

          {/* Can Finalize */}
          {proposal.canFinalize && (
            <Button
              size="sm"
              variant="outline"
              onClick={onFinalize}
              disabled={isLoading}
            >
              Finalize Vote
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
