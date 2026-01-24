// Smart Contract ABIs and Configuration for Base Sepolia Network

export const CONTRACT_ADDRESSES = {
  ZKTCore: '0x827a10a3bcc12c315774e134235046f378c7699d' as const,
  MockIDRX: '0x8790ec119e8fcdc46305246662ddf6a4a5d9ad04' as const,
  DonationReceiptNFT: '0x9c2c6ad056f508dd9d2a3e7747843decc54cb4c5' as const,
  VotingToken: '0x8b015d081f03cc7a7c329d1582d9ec43270c733b' as const,
  VotingManager: '0x6e2b5b1bbf99d44f01dc15d81a59a5caaddc37fa' as const,
  ShariaReviewManager: '0xce976dadd27e70e8a9fb2a7cad24ebb2c5b43b2e' as const,
} as const;

export const ZKTCoreABI = [
  {
    type: 'constructor',
    inputs: [
      { name: '_idrxToken', type: 'address', internalType: 'address' },
      { name: '_receiptNFT', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'campaigns',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256', internalType: 'uint256' },
      { name: 'organization', type: 'address', internalType: 'address' },
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'description', type: 'string', internalType: 'string' },
      { name: 'targetAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'raisedAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'isActive', type: 'bool', internalType: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'createCampaign',
    inputs: [
      { name: '_name', type: 'string', internalType: 'string' },
      { name: '_description', type: 'string', internalType: 'string' },
      { name: '_targetAmount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'createProposal',
    inputs: [
      { name: '_title', type: 'string', internalType: 'string' },
      { name: '_description', type: 'string', internalType: 'string' },
      { name: '_votingPeriod', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'donate',
    inputs: [
      { name: '_campaignId', type: 'uint256', internalType: 'uint256' },
      { name: '_amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getCampaign',
    inputs: [{ name: '_campaignId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct ZKTCore.Campaign',
        components: [
          { name: 'id', type: 'uint256', internalType: 'uint256' },
          { name: 'organization', type: 'address', internalType: 'address' },
          { name: 'name', type: 'string', internalType: 'string' },
          { name: 'description', type: 'string', internalType: 'string' },
          { name: 'targetAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'raisedAmount', type: 'uint256', internalType: 'uint256' },
          { name: 'isActive', type: 'bool', internalType: 'bool' },
        ],
      },
    ],
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
          { name: 'id', type: 'uint256', internalType: 'uint256' },
          { name: 'proposer', type: 'address', internalType: 'address' },
          { name: 'title', type: 'string', internalType: 'string' },
          { name: 'description', type: 'string', internalType: 'string' },
          { name: 'votesFor', type: 'uint256', internalType: 'uint256' },
          { name: 'votesAgainst', type: 'uint256', internalType: 'uint256' },
          { name: 'endTime', type: 'uint256', internalType: 'uint256' },
          { name: 'executed', type: 'bool', internalType: 'bool' },
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
    name: 'organizationCompliance',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'isVerified', type: 'bool', internalType: 'bool' },
      { name: 'totalDonations', type: 'uint256', internalType: 'uint256' },
      { name: 'totalDistributed', type: 'uint256', internalType: 'uint256' },
      { name: 'complianceScore', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'proposals',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256', internalType: 'uint256' },
      { name: 'proposer', type: 'address', internalType: 'address' },
      { name: 'title', type: 'string', internalType: 'string' },
      { name: 'description', type: 'string', internalType: 'string' },
      { name: 'votesFor', type: 'uint256', internalType: 'uint256' },
      { name: 'votesAgainst', type: 'uint256', internalType: 'uint256' },
      { name: 'endTime', type: 'uint256', internalType: 'uint256' },
      { name: 'executed', type: 'bool', internalType: 'bool' },
    ],
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
    name: 'vote',
    inputs: [
      { name: '_proposalId', type: 'uint256', internalType: 'uint256' },
      { name: '_support', type: 'bool', internalType: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'CampaignCreated',
    inputs: [
      { name: 'campaignId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'organization', type: 'address', indexed: true, internalType: 'address' },
      { name: 'name', type: 'string', indexed: false, internalType: 'string' },
      { name: 'targetAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'DonationReceived',
    inputs: [
      { name: 'donor', type: 'address', indexed: true, internalType: 'address' },
      { name: 'campaignId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'receiptTokenId', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ProposalCreated',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'proposer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'title', type: 'string', indexed: false, internalType: 'string' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'VoteCast',
    inputs: [
      { name: 'voter', type: 'address', indexed: true, internalType: 'address' },
      { name: 'proposalId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'support', type: 'bool', indexed: false, internalType: 'bool' },
    ],
    anonymous: false,
  },
] as const;

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
] as const;

// VotingToken ABI (ERC20-based governance token)
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
] as const;

// DonationReceiptNFT ABI (Soulbound NFT for donation receipts)
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
