// Donation Contract ABI and Utilities

export const DONATION_CONTRACT_ADDRESS = '0xdAB8DF575324454673F6aFD16B6262468E31169b' as const; // Add your contract address here

export const DonationABI = [
  {
    inputs: [
      { internalType: 'address', name: '_admin', type: 'address' },
      { internalType: 'address', name: '_token', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousAdmin', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newAdmin', type: 'address' },
    ],
    name: 'AdminTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'bytes32', name: 'campaignId', type: 'bytes32' }],
    name: 'CampaignClosed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'campaignId', type: 'bytes32' },
      { indexed: false, internalType: 'uint256', name: 'startTime', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'endTime', type: 'uint256' },
    ],
    name: 'CampaignCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'campaignId', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'ngoId', type: 'bytes32' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'Disbursed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'campaignId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'donor', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'Donated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'Paused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'Unpaused',
    type: 'event',
  },
  {
    inputs: [],
    name: 'admin',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'bytes32', name: '', type: 'bytes32' },
    ],
    name: 'allocationBps',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'ngoId', type: 'bytes32' },
      { internalType: 'address', name: 'wallet', type: 'address' },
    ],
    name: 'approveNGO',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'approvedNGO',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'campaigns',
    outputs: [
      { internalType: 'bool', name: 'exists', type: 'bool' },
      { internalType: 'bool', name: 'allocationLocked', type: 'bool' },
      { internalType: 'bool', name: 'disbursed', type: 'bool' },
      { internalType: 'bool', name: 'closed', type: 'bool' },
      { internalType: 'uint256', name: 'totalRaised', type: 'uint256' },
      { internalType: 'uint256', name: 'startTime', type: 'uint256' },
      { internalType: 'uint256', name: 'endTime', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'campaignId', type: 'bytes32' }],
    name: 'closeCampaign',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'campaignId', type: 'bytes32' },
      { internalType: 'uint256', name: 'startTime', type: 'uint256' },
      { internalType: 'uint256', name: 'endTime', type: 'uint256' },
    ],
    name: 'createCampaign',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'campaignId', type: 'bytes32' },
      { internalType: 'bytes32[]', name: 'ngoIds', type: 'bytes32[]' },
    ],
    name: 'disburse',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'campaignId', type: 'bytes32' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'donate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'campaignId', type: 'bytes32' }],
    name: 'lockAllocation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'ngoWallet',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'campaignId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'ngoId', type: 'bytes32' },
      { internalType: 'uint256', name: 'bps', type: 'uint256' },
    ],
    name: 'setAllocation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token',
    outputs: [{ internalType: 'contract IERC20', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'totalBps',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newAdmin', type: 'address' }],
    name: 'transferAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Type definitions
export interface Campaign {
  exists: boolean;
  allocationLocked: boolean;
  disbursed: boolean;
  closed: boolean;
  totalRaised: bigint;
  startTime: bigint;
  endTime: bigint;
}

export interface DonationParams {
  campaignId: string;
  amount: bigint;
}

export interface AllocationParams {
  campaignId: string;
  ngoId: string;
  bps: number;
}

// Helper functions
export const createCampaignId = (identifier: string): number => {
  // Create a numeric campaign ID using a hash of the identifier
  // This is a simple approach - in production, you'd want a more robust solution
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to a positive number and use modulo to keep it reasonable
  return Math.abs(hash) % 1000000;
};

export const createNgoId = (identifier: string): string => {
  // Convert identifier to bytes32 format
  return '0x' + identifier.padEnd(64, '0');
};

export const bpsToPercentage = (bps: number): number => {
  return bps / 100;
};

export const percentageToBps = (percentage: number): number => {
  return percentage * 100;
};

export const formatDonationAmount = (amount: bigint, decimals: number = 18): string => {
  return (Number(amount) / Math.pow(10, decimals)).toFixed(2);
};

export const parseDonationAmount = (amount: string, decimals: number = 18): bigint => {
  return BigInt(Math.floor(Number(amount) * Math.pow(10, decimals)));
};
