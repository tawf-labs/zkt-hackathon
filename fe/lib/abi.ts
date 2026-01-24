// Smart Contract ABIs and Configuration for Base Sepolia Network
// New ZKTCore Deployed Contracts

export const CONTRACT_ADDRESSES = {
  ZKTCore: '0xacc7d3d90ba0e06dfa3ddd702214ed521726efdd' as const,
  MockIDRX: '0xb3970735048e6db24028eb383d458e16637cbc7a' as const,
  DonationReceiptNFT: '0x3d40bad0a1ac627d59bc142ded202e08e002b6a7' as const,
  VotingToken: '0x4461b304f0ce2a879c375ea9e5124be8bc73522d' as const,
} as const;

// ZKTCore ABI - Main orchestrator contract
export const ZKTCoreABI = [
  // View Functions
  {
    type: 'function',
    name: 'proposalCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'poolCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'bundleCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getProposal',
    inputs: [{ name: '_proposalId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct ZKTCore.Proposal',
        components: [
          { name: 'proposalId', type: 'uint256', internalType: 'uint256' },
          { name: 'organizer', type: 'address', internalType: 'address' },
          { name: 'title', type: 'string', internalType: 'string' },
          { name: 'description', type: 'string', internalType: 'string' },
          { name: 'fundingGoal', type: 'uint256', internalType: 'uint256' },
          { name: 'isEmergency', type: 'bool', internalType: 'bool' },
          { name: 'mockZKKYCProof', type: 'string', internalType: 'string' },
          { name: 'zakatChecklistItems', type: 'string[]', internalType: 'string[]' },
          { name: 'createdAt', type: 'uint256', internalType: 'uint256' },
          { name: 'status', type: 'uint8', internalType: 'enum ZKTCore.ProposalStatus' },
          { name: 'kycStatus', type: 'uint8', internalType: 'enum ZKTCore.KYCStatus' },
          { name: 'campaignType', type: 'uint8', internalType: 'enum ZKTCore.CampaignType' },
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          { name: 'communityVoteStartTime', type: 'uint256', internalType: 'uint256' },
          { name: 'communityVoteEndTime', type: 'uint256', internalType: 'uint256' },
          { name: 'votesFor', type: 'uint256', internalType: 'uint256' },
          { name: 'votesAgainst', type: 'uint256', internalType: 'uint256' },
          { name: 'votesAbstain', type: 'uint256', internalType: 'uint256' },
          { name: 'communityVotePassed', type: 'bool', internalType: 'bool' },
          { name: 'metadataURI', type: 'string', internalType: 'string' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPool',
    inputs: [{ name: '_poolId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct ZKTCore.CampaignPool',
        components: [
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          { name: 'proposalId', type: 'uint256', internalType: 'uint256' },
          { name: 'organizer', type: 'address', internalType: 'address' },
          { name: 'fundingGoal', type: 'uint256', internalType: 'uint256' },
          { name: 'raisedAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'campaignType', type: 'uint8', internalType: 'enum ZKTCore.CampaignType' },
          { name: 'campaignTitle', type: 'string', internalType: 'string' },
          { name: 'isActive', type: 'bool', internalType: 'bool' },
          { name: 'createdAt', type: 'uint256', internalType: 'uint256' },
          { name: 'donors', type: 'address[]', internalType: 'address[]' },
          { name: 'fundsWithdrawn', type: 'bool', internalType: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'idrxToken',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract IERC20' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'receiptNFT',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract IDonationReceiptNFT' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'votingToken',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract IVotingToken' }],
    stateMutability: 'view',
  },
  // Write Functions - Proposal Management
  {
    type: 'function',
    name: 'createProposal',
    inputs: [
      { name: '_title', type: 'string', internalType: 'string' },
      { name: '_description', type: 'string', internalType: 'string' },
      { name: '_fundingGoal', type: 'uint256', internalType: 'uint256' },
      { name: '_isEmergency', type: 'bool', internalType: 'bool' },
      { name: '_mockZKKYCProof', type: 'string', internalType: 'string' },
      { name: '_zakatChecklistItems', type: 'string[]', internalType: 'string[]' },
      { name: '_metadataURI', type: 'string', internalType: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'updateKYCStatus',
    inputs: [
      { name: '_proposalId', type: 'uint256', internalType: 'uint256' },
      { name: '_newStatus', type: 'uint8', internalType: 'enum ZKTCore.KYCStatus' },
      { name: '_notes', type: 'string', internalType: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'submitForCommunityVote',
    inputs: [{ name: '_proposalId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // Write Functions - Voting
  {
    type: 'function',
    name: 'castVote',
    inputs: [
      { name: '_proposalId', type: 'uint256', internalType: 'uint256' },
      { name: '_support', type: 'uint8', internalType: 'uint8' }, // 0=against, 1=for, 2=abstain
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'finalizeCommunityVote',
    inputs: [{ name: '_proposalId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // Write Functions - Pool Management
  {
    type: 'function',
    name: 'createCampaignPool',
    inputs: [{ name: '_proposalId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'donate',
    inputs: [
      { name: '_poolId', type: 'uint256', internalType: 'uint256' },
      { name: '_amount', type: 'uint256', internalType: 'uint256' },
      { name: '_ipfsCID', type: 'string', internalType: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'donatePrivate',
    inputs: [
      { name: '_poolId', type: 'uint256', internalType: 'uint256' },
      { name: '_amount', type: 'uint256', internalType: 'uint256' },
      { name: '_commitment', type: 'bytes32', internalType: 'bytes32' },
      { name: '_ipfsCID', type: 'string', internalType: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdrawFunds',
    inputs: [{ name: '_poolId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // Write Functions - Voting Token
  {
    type: 'function',
    name: 'grantVotingPower',
    inputs: [
      { name: '_account', type: 'address', internalType: 'address' },
      { name: '_amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // Events
  {
    type: 'event',
    name: 'ProposalCreated',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'organizer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'title', type: 'string', indexed: false, internalType: 'string' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'KYCStatusUpdated',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'status', type: 'uint8', indexed: false, internalType: 'enum ZKTCore.KYCStatus' },
      { name: 'notes', type: 'string', indexed: false, internalType: 'string' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProposalSubmitted',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'startTime', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'endTime', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'VoteCast',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'voter', type: 'address', indexed: true, internalType: 'address' },
      { name: 'support', type: 'uint8', indexed: false, internalType: 'uint8' },
      { name: 'weight', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'CampaignPoolCreated',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'proposalId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'campaignType', type: 'uint8', indexed: false, internalType: 'enum ZKTCore.CampaignType' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'DonationReceived',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'donor', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'receiptTokenId', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'FundsWithdrawn',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'organizer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
] as const;

// MockIDRX ABI - ERC20 token with faucet
export const MockIDRXABI = [
  {
    type: 'constructor',
    inputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' },
      { name: 'spender', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'faucet',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'canClaimFaucet',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'lastClaimTime',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'FAUCET_AMOUNT',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'FAUCET_COOLDOWN',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address', internalType: 'address' },
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'spender', type: 'address', indexed: true, internalType: 'address' },
      { name: 'value', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true, internalType: 'address' },
      { name: 'to', type: 'address', indexed: true, internalType: 'address' },
      { name: 'value', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'FaucetClaimed',
    inputs: [
      { name: 'recipient', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
] as const;

// VotingToken ABI - Non-transferable voting token
export const VotingTokenABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPastVotes',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' },
      { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'delegates',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
] as const;

// DonationReceiptNFT ABI - Soulbound NFT for donation receipts
export const DonationReceiptNFTABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'owner', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenOfOwnerByIndex',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' },
      { name: 'index', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getReceiptData',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct DonationReceiptNFT.Receipt',
        components: [
          { name: 'poolId', type: 'uint256', internalType: 'uint256' },
          { name: 'donor', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
          { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'ReceiptMinted',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'poolId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'donor', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
] as const;

// Helper functions for formatting blockchain data
export function formatIDRX(amount: bigint): string {
  const value = Number(amount) / 1e18;
  return value.toLocaleString('id-ID', { maximumFractionDigits: 0 });
}

export function parseIDRX(amount: number): bigint {
  return BigInt(Math.floor(amount * 1e18));
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatAmount(amount: bigint, decimals: number = 18): string {
  const value = Number(amount) / Math.pow(10, decimals);
  return value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

export function parseAmount(amount: string | number, decimals: number = 18): bigint {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return BigInt(Math.floor(num * Math.pow(10, decimals)));
}
