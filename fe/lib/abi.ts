// Smart Contract ABIs and Configuration for Base Sepolia Network
// New ZKTCore Deployed Contracts

export const CONTRACT_ADDRESSES = {
  ZKTCore: '0x86ceb44b46681a22ba32f8e8b4c10e50eeb50df6' as const,
  ProposalManager: '0x5d05133f9de9892688831613c0a3cb80b4cb2d22' as const,
  VotingManager: '0x44e228196549d5276452fe3648a005c25589e615' as const,
  ShariaReviewManager: '0xc378d519c27b5be6563cd2f318611b7729a13761' as const,
  PoolManager: '0xca149c6ff741702d12e5926b6d09322eb80f86d6' as const,
  ZakatEscrowManager: '0xb7922a57efb7af13733de3e3130ab6ed2a265983' as const,
  MilestoneManager: '0x7e91090c0c3b5e7e1e2dafad9da9ebceed438f84' as const,
  MockIDRX: '0x06317b6009e39dbcd49d6654e08363fdc17e88a9' as const,
  DonationReceiptNFT: '0x6d09c766c606519c5eb71cd03ac7c450fc14bb72' as const,
  VotingToken: '0xa7ff9fd09ed70c174ae9cb580fb6b31325869a05' as const,
} as const;

// ZKTCore ABI - Main orchestrator contract
export const ZKTCoreABI = [
  // View Functions
  {
    type: "function",
    name: "proposalCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "poolCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "bundleCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProposal",
    inputs: [{ name: "_proposalId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct ZKTCore.Proposal",
        components: [
          { name: "proposalId", type: "uint256", internalType: "uint256" },
          { name: "organizer", type: "address", internalType: "address" },
          { name: "title", type: "string", internalType: "string" },
          { name: "description", type: "string", internalType: "string" },
          { name: "fundingGoal", type: "uint256", internalType: "uint256" },
          { name: "isEmergency", type: "bool", internalType: "bool" },
          { name: "mockZKKYCProof", type: "string", internalType: "string" },
          {
            name: "zakatChecklistItems",
            type: "string[]",
            internalType: "string[]",
          },
          { name: "createdAt", type: "uint256", internalType: "uint256" },
          {
            name: "status",
            type: "uint8",
            internalType: "enum ZKTCore.ProposalStatus",
          },
          {
            name: "kycStatus",
            type: "uint8",
            internalType: "enum ZKTCore.KYCStatus",
          },
          {
            name: "campaignType",
            type: "uint8",
            internalType: "enum ZKTCore.CampaignType",
          },
          { name: "poolId", type: "uint256", internalType: "uint256" },
          {
            name: "communityVoteStartTime",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "communityVoteEndTime",
            type: "uint256",
            internalType: "uint256",
          },
          { name: "votesFor", type: "uint256", internalType: "uint256" },
          { name: "votesAgainst", type: "uint256", internalType: "uint256" },
          { name: "votesAbstain", type: "uint256", internalType: "uint256" },
          { name: "communityVotePassed", type: "bool", internalType: "bool" },
          { name: "metadataURI", type: "string", internalType: "string" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPool",
    inputs: [{ name: "_poolId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct ZKTCore.CampaignPool",
        components: [
          { name: "poolId", type: "uint256", internalType: "uint256" },
          { name: "proposalId", type: "uint256", internalType: "uint256" },
          { name: "organizer", type: "address", internalType: "address" },
          { name: "fundingGoal", type: "uint256", internalType: "uint256" },
          { name: "raisedAmount", type: "uint256", internalType: "uint256" },
          {
            name: "campaignType",
            type: "uint8",
            internalType: "enum ZKTCore.CampaignType",
          },
          { name: "campaignTitle", type: "string", internalType: "string" },
          { name: "isActive", type: "bool", internalType: "bool" },
          { name: "createdAt", type: "uint256", internalType: "uint256" },
          { name: "donors", type: "address[]", internalType: "address[]" },
          { name: "fundsWithdrawn", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "idrxToken",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IERC20" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "receiptNFT",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IDonationReceiptNFT",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "votingToken",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract IVotingToken" },
    ],
    stateMutability: "view",
  },
  // Write Functions - Proposal Management
  {
    type: "function",
    name: "createProposal",
    inputs: [
      { name: "_title", type: "string", internalType: "string" },
      { name: "_description", type: "string", internalType: "string" },
      { name: "_fundingGoal", type: "uint256", internalType: "uint256" },
      { name: "_isEmergency", type: "bool", internalType: "bool" },
      { name: "_mockZKKYCProof", type: "bytes32", internalType: "bytes32" },
      {
        name: "_zakatChecklistItems",
        type: "string[]",
        internalType: "string[]",
      },
      { name: "_metadataURI", type: "string", internalType: "string" },
      {
        name: "_milestoneInputs",
        type: "tuple[]",
        internalType: "struct IProposalManager.MilestoneInput[]",
        components: [
          { name: "description", type: "string", internalType: "string" },
          { name: "targetAmount", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateKYCStatus",
    inputs: [
      { name: "_proposalId", type: "uint256", internalType: "uint256" },
      {
        name: "_newStatus",
        type: "uint8",
        internalType: "enum ZKTCore.KYCStatus",
      },
      { name: "_notes", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitForCommunityVote",
    inputs: [{ name: "_proposalId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Write Functions - Voting
  {
    type: "function",
    name: "castVote",
    inputs: [
      { name: "_proposalId", type: "uint256", internalType: "uint256" },
      { name: "_support", type: "uint8", internalType: "uint8" }, // 0=against, 1=for, 2=abstain
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "finalizeCommunityVote",
    inputs: [{ name: "_proposalId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Write Functions - Pool Management
  {
    type: "function",
    name: "createCampaignPool",
    inputs: [{ name: "_proposalId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "donate",
    inputs: [
      { name: "_poolId", type: "uint256", internalType: "uint256" },
      { name: "_amount", type: "uint256", internalType: "uint256" },
      { name: "_ipfsCID", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "donatePrivate",
    inputs: [
      { name: "_poolId", type: "uint256", internalType: "uint256" },
      { name: "_amount", type: "uint256", internalType: "uint256" },
      { name: "_commitment", type: "bytes32", internalType: "bytes32" },
      { name: "_ipfsCID", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawFunds",
    inputs: [{ name: "_poolId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Write Functions - Voting Token
  {
    type: "function",
    name: "grantVotingPower",
    inputs: [
      { name: "_account", type: "address", internalType: "address" },
      { name: "_amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Milestone View Functions
  {
    type: "function",
    name: "getMilestone",
    inputs: [
      { name: "proposalId", type: "uint256", internalType: "uint256" },
      { name: "milestoneId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IProposalManager.Milestone",
        components: [
          { name: "milestoneId", type: "uint256", internalType: "uint256" },
          { name: "description", type: "string", internalType: "string" },
          { name: "targetAmount", type: "uint256", internalType: "uint256" },
          { name: "proofIPFS", type: "string", internalType: "string" },
          {
            name: "status",
            type: "uint8",
            internalType: "enum IProposalManager.MilestoneStatus",
          },
          {
            name: "proofSubmittedAt",
            type: "uint256",
            internalType: "uint256",
          },
          { name: "voteStart", type: "uint256", internalType: "uint256" },
          { name: "voteEnd", type: "uint256", internalType: "uint256" },
          { name: "votesFor", type: "uint256", internalType: "uint256" },
          { name: "votesAgainst", type: "uint256", internalType: "uint256" },
          { name: "votesAbstain", type: "uint256", internalType: "uint256" },
          { name: "releasedAt", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMilestones",
    inputs: [{ name: "proposalId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct IProposalManager.Milestone[]",
        components: [
          { name: "milestoneId", type: "uint256", internalType: "uint256" },
          { name: "description", type: "string", internalType: "string" },
          { name: "targetAmount", type: "uint256", internalType: "uint256" },
          { name: "proofIPFS", type: "string", internalType: "string" },
          {
            name: "status",
            type: "uint8",
            internalType: "enum IProposalManager.MilestoneStatus",
          },
          {
            name: "proofSubmittedAt",
            type: "uint256",
            internalType: "uint256",
          },
          { name: "voteStart", type: "uint256", internalType: "uint256" },
          { name: "voteEnd", type: "uint256", internalType: "uint256" },
          { name: "votesFor", type: "uint256", internalType: "uint256" },
          { name: "votesAgainst", type: "uint256", internalType: "uint256" },
          { name: "votesAbstain", type: "uint256", internalType: "uint256" },
          { name: "releasedAt", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMilestoneCount",
    inputs: [{ name: "proposalId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasVotedOnMilestone",
    inputs: [
      { name: "proposalId", type: "uint256", internalType: "uint256" },
      { name: "milestoneId", type: "uint256", internalType: "uint256" },
      { name: "voter", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  // Milestone Write Functions
  {
    type: "function",
    name: "submitMilestoneProof",
    inputs: [
      { name: "proposalId", type: "uint256", internalType: "uint256" },
      { name: "milestoneId", type: "uint256", internalType: "uint256" },
      { name: "ipfsCID", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "startMilestoneVoting",
    inputs: [
      { name: "proposalId", type: "uint256", internalType: "uint256" },
      { name: "milestoneId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "voteMilestone",
    inputs: [
      { name: "proposalId", type: "uint256", internalType: "uint256" },
      { name: "milestoneId", type: "uint256", internalType: "uint256" },
      { name: "support", type: "uint8", internalType: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "finalizeMilestoneVote",
    inputs: [
      { name: "proposalId", type: "uint256", internalType: "uint256" },
      { name: "milestoneId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawMilestoneFunds",
    inputs: [
      { name: "poolId", type: "uint256", internalType: "uint256" },
      { name: "milestoneId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Zakat Lifecycle Functions
  {
    type: "function",
    name: "checkZakatTimeout",
    inputs: [{ name: "poolId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "councilExtendZakatDeadline",
    inputs: [
      { name: "poolId", type: "uint256", internalType: "uint256" },
      { name: "reasoning", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "executeZakatRedistribution",
    inputs: [{ name: "poolId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Fallback Pool Management
  {
    type: "function",
    name: "proposeFallbackPool",
    inputs: [
      { name: "pool", type: "address", internalType: "address" },
      { name: "reasoning", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "vetFallbackPool",
    inputs: [{ name: "pool", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setDefaultFallbackPool",
    inputs: [{ name: "pool", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Zakat View Functions
  {
    type: "function",
    name: "getZakatTimeRemaining",
    inputs: [{ name: "poolId", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "remaining", type: "uint256", internalType: "uint256" },
      { name: "inGracePeriod", type: "bool", internalType: "bool" },
      { name: "canRedistribute", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isZakatReadyForRedistribution",
    inputs: [{ name: "poolId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getZakatPoolStatusString",
    inputs: [{ name: "poolId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getFallbackPool",
    inputs: [{ name: "pool", type: "address", internalType: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct ZakatEscrowManager.FallbackPoolData",
        components: [
          { name: "pool", type: "address", internalType: "address" },
          {
            name: "status",
            type: "uint8",
            internalType: "enum ZakatEscrowManager.FallbackStatus",
          },
          { name: "proposedAt", type: "uint256", internalType: "uint256" },
          { name: "proposer", type: "address", internalType: "address" },
          { name: "reasoning", type: "string", internalType: "string" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAllFallbackPools",
    inputs: [],
    outputs: [{ name: "", type: "address[]", internalType: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getZakatPool",
    inputs: [{ name: "poolId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct ZakatEscrowManager.ZakatPool",
        components: [
          { name: "poolId", type: "uint256", internalType: "uint256" },
          { name: "proposalId", type: "uint256", internalType: "uint256" },
          { name: "organizer", type: "address", internalType: "address" },
          { name: "fundingGoal", type: "uint256", internalType: "uint256" },
          { name: "raisedAmount", type: "uint256", internalType: "uint256" },
          { name: "campaignTitle", type: "string", internalType: "string" },
          { name: "createdAt", type: "uint256", internalType: "uint256" },
          { name: "deadline", type: "uint256", internalType: "uint256" },
          { name: "gracePeriodEnd", type: "uint256", internalType: "uint256" },
          { name: "fallbackPool", type: "address", internalType: "address" },
          {
            name: "fallbackStatus",
            type: "uint8",
            internalType: "enum ZakatEscrowManager.FallbackStatus",
          },
          {
            name: "status",
            type: "uint8",
            internalType: "enum ZakatEscrowManager.PoolStatus",
          },
          { name: "redistributed", type: "bool", internalType: "bool" },
          { name: "extensionUsed", type: "bool", internalType: "bool" },
          { name: "extensionGranted", type: "bool", internalType: "bool" },
          {
            name: "extensionGrantedAt",
            type: "uint256",
            internalType: "uint256",
          },
          { name: "donors", type: "address[]", internalType: "address[]" },
          { name: "fundsWithdrawn", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  // Events
  {
    type: "event",
    name: "ProposalCreated",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "organizer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      { name: "title", type: "string", indexed: false, internalType: "string" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "KYCStatusUpdated",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "status",
        type: "uint8",
        indexed: false,
        internalType: "enum ZKTCore.KYCStatus",
      },
      { name: "notes", type: "string", indexed: false, internalType: "string" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ProposalSubmitted",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "startTime",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "endTime",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "VoteCast",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "voter",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      { name: "support", type: "uint8", indexed: false, internalType: "uint8" },
      {
        name: "weight",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "CampaignPoolCreated",
    inputs: [
      {
        name: "poolId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "campaignType",
        type: "uint8",
        indexed: false,
        internalType: "enum ZKTCore.CampaignType",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "DonationReceived",
    inputs: [
      {
        name: "poolId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "donor",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "receiptTokenId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FundsWithdrawn",
    inputs: [
      {
        name: "poolId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "organizer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  // Milestone Events
  {
    type: "event",
    name: "MilestoneProofSubmitted",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "milestoneId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "ipfsCID",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MilestoneVotingStarted",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "milestoneId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "voteStart",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "voteEnd",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MilestoneVoteCast",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "milestoneId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "voter",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      { name: "support", type: "uint8", indexed: false, internalType: "uint8" },
      {
        name: "weight",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MilestoneApproved",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "milestoneId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MilestoneRejected",
    inputs: [
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "milestoneId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MilestoneFundsReleased",
    inputs: [
      {
        name: "poolId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "milestoneId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const;

// ZakatEscrowManager ABI - For Zakat-compliant campaign timeout management
export const ZakatEscrowManagerABI = [
  // View Functions
  {
    type: "function",
    name: "getPool",
    inputs: [{ name: "poolId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct ZakatEscrowManager.ZakatPool",
        components: [
          { name: "poolId", type: "uint256", internalType: "uint256" },
          { name: "proposalId", type: "uint256", internalType: "uint256" },
          { name: "organizer", type: "address", internalType: "address" },
          { name: "fundingGoal", type: "uint256", internalType: "uint256" },
          { name: "raisedAmount", type: "uint256", internalType: "uint256" },
          { name: "campaignTitle", type: "string", internalType: "string" },
          { name: "createdAt", type: "uint256", internalType: "uint256" },
          { name: "deadline", type: "uint256", internalType: "uint256" },
          { name: "gracePeriodEnd", type: "uint256", internalType: "uint256" },
          { name: "fallbackPool", type: "address", internalType: "address" },
          {
            name: "fallbackStatus",
            type: "uint8",
            internalType: "enum ZakatEscrowManager.FallbackStatus",
          },
          {
            name: "status",
            type: "uint8",
            internalType: "enum ZakatEscrowManager.PoolStatus",
          },
          { name: "redistributed", type: "bool", internalType: "bool" },
          { name: "extensionUsed", type: "bool", internalType: "bool" },
          { name: "extensionGranted", type: "bool", internalType: "bool" },
          {
            name: "extensionGrantedAt",
            type: "uint256",
            internalType: "uint256",
          },
          { name: "donors", type: "address[]", internalType: "address[]" },
          { name: "fundsWithdrawn", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTimeRemaining",
    inputs: [{ name: "poolId", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "remaining", type: "uint256", internalType: "uint256" },
      { name: "inGracePeriod", type: "bool", internalType: "bool" },
      { name: "canRedistribute", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPoolStatusString",
    inputs: [{ name: "poolId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isReadyForRedistribution",
    inputs: [{ name: "poolId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "ready", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getFallbackPool",
    inputs: [{ name: "pool", type: "address", internalType: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct ZakatEscrowManager.FallbackPoolData",
        components: [
          { name: "pool", type: "address", internalType: "address" },
          {
            name: "status",
            type: "uint8",
            internalType: "enum ZakatEscrowManager.FallbackStatus",
          },
          { name: "proposedAt", type: "uint256", internalType: "uint256" },
          { name: "proposer", type: "address", internalType: "address" },
          { name: "reasoning", type: "string", internalType: "string" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAllFallbackPools",
    inputs: [],
    outputs: [{ name: "", type: "address[]", internalType: "address[]" }],
    stateMutability: "view",
  },
  // Write Functions - Pool Management
  {
    type: "function",
    name: "checkTimeout",
    inputs: [{ name: "poolId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "councilExtendDeadline",
    inputs: [
      { name: "poolId", type: "uint256", internalType: "uint256" },
      { name: "reasoning", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "executeRedistribution",
    inputs: [{ name: "poolId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Fallback Pool Management
  {
    type: "function",
    name: "proposeFallbackPool",
    inputs: [
      { name: "pool", type: "address", internalType: "address" },
      { name: "reasoning", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "vetFallbackPool",
    inputs: [{ name: "pool", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Events
  {
    type: "event",
    name: "ZakatPoolCreated",
    inputs: [
      {
        name: "poolId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "proposalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "organizer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "deadline",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "fallbackPool",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PoolEnteredGracePeriod",
    inputs: [
      {
        name: "poolId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "gracePeriodEnd",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "DeadlineExtended",
    inputs: [
      {
        name: "poolId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "newDeadline",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "reasoning",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FundsRedistributed",
    inputs: [
      {
        name: "poolId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "fallbackPool",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const;

// MockIDRX ABI - ERC20 token with faucet
export const MockIDRXABI = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "faucet",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "canClaimFaucet",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "lastClaimTime",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "FAUCET_AMOUNT",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "FAUCET_COOLDOWN",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferFrom",
    inputs: [
      { name: "from", type: "address", internalType: "address" },
      { name: "to", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "Approval",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "spender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "value",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true, internalType: "address" },
      { name: "to", type: "address", indexed: true, internalType: "address" },
      {
        name: "value",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FaucetClaimed",
    inputs: [
      {
        name: "recipient",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const;

// VotingToken ABI - Non-transferable voting token
export const VotingTokenABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPastVotes",
    inputs: [
      { name: "account", type: "address", internalType: "address" },
      { name: "timestamp", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "delegates",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
] as const;

// DonationReceiptNFT ABI - Soulbound NFT for donation receipts
export const DonationReceiptNFTABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "owner", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokenOfOwnerByIndex",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "index", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokenURI",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getReceiptData",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct DonationReceiptNFT.Receipt",
        components: [
          { name: "poolId", type: "uint256", internalType: "uint256" },
          { name: "donor", type: "address", internalType: "address" },
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "timestamp", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "ReceiptMinted",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "poolId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "donor",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const;

// Helper functions for formatting blockchain data
export function formatIDRX(amount: bigint): string {
  const value = Number(amount) / 1e18;
  return value.toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

export function parseIDRX(amount: number): bigint {
  return BigInt(Math.floor(amount * 1e18));
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAmount(amount: bigint, decimals: number = 18): string {
  const value = Number(amount) / Math.pow(10, decimals);
  return value.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

export function parseAmount(
  amount: string | number,
  decimals: number = 18,
): bigint {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return BigInt(Math.floor(num * Math.pow(10, decimals)));
}

// Zakat-specific helper functions

/**
 * Format time remaining for Zakat pool withdrawal
 * @param remainingSeconds Remaining time in seconds
 * @returns Formatted string like "25 days remaining" or "2 hours remaining"
 */
export function formatTimeRemaining(remainingSeconds: number | bigint): string {
  const seconds = Number(remainingSeconds);
  if (seconds <= 0) return "Expired";

  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  if (days > 0) {
    return `${days} day${days !== 1 ? "s" : ""} remaining`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""} remaining`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} remaining`;
  }
  return "Less than a minute remaining";
}

/**
 * Get Zakat pool status display information
 * @param status Pool status from contract
 * @param inGracePeriod Whether pool is in grace period
 * @param canRedistribute Whether pool can be redistributed
 * @returns Status display info
 */
export function getZakatPoolStatusInfo(
  status: number,
  inGracePeriod: boolean,
  canRedistribute: boolean,
): {
  label: string;
  variant: "default" | "warning" | "danger" | "success";
  description: string;
} {
  // PoolStatus enum: Active=0, GracePeriod=1, Redistributed=2, Completed=3
  if (status === 3) {
    return {
      label: "Completed",
      variant: "success",
      description: "Funds have been successfully distributed by the organizer.",
    };
  }

  if (status === 2) {
    return {
      label: "Redistributed",
      variant: "danger",
      description: "Funds were redistributed to an approved fallback pool.",
    };
  }

  if (inGracePeriod || status === 1) {
    return {
      label: "Grace Period",
      variant: "warning",
      description:
        "Withdrawal period has ended. Sharia council may grant extension or funds will be redistributed.",
    };
  }

  if (canRedistribute) {
    return {
      label: "Ready for Redistribution",
      variant: "danger",
      description:
        "Grace period has ended. Anyone can trigger redistribution to fallback pool.",
    };
  }

  return {
    label: "Active",
    variant: "default",
    description:
      "Organizer can withdraw funds within the 30-day Zakat distribution period.",
  };
}

/**
 * Calculate deadline from creation timestamp for Zakat pools
 * @param createdAt Pool creation timestamp
 * @param extensionUsed Whether extension was granted
 * @returns Deadline timestamp
 */
export function calculateZakatDeadline(
  createdAt: number,
  extensionUsed: boolean,
): number {
  const ZAKAT_PERIOD = 30 * 24 * 60 * 60; // 30 days in seconds
  const EXTENSION_DURATION = 14 * 24 * 60 * 60; // 14 days in seconds

  let deadline = createdAt + ZAKAT_PERIOD;
  if (extensionUsed) {
    deadline += EXTENSION_DURATION;
  }
  return deadline;
}

/**
 * Calculate grace period end timestamp
 * @param deadline Deadline timestamp
 * @returns Grace period end timestamp
 */
export function calculateGracePeriodEnd(deadline: number): number {
  const GRACE_PERIOD = 7 * 24 * 60 * 60; // 7 days in seconds
  return deadline + GRACE_PERIOD;
}

/**
 * Check if timestamp is within warning period (5 days before deadline)
 * @param remainingSeconds Remaining time in seconds
 * @returns True if in warning period
 */
export function isInWarningPeriod(remainingSeconds: number | bigint): boolean {
  const WARNING_PERIOD = 5 * 24 * 60 * 60; // 5 days in seconds
  const seconds = Number(remainingSeconds);
  return seconds > 0 && seconds <= WARNING_PERIOD;
}
