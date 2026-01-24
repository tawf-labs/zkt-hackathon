import { createPublicClient, http, getAddress } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACT_ADDRESSES, ZKTCoreABI } from './abi';

// Create a public client for reading contract data
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
});

// Campaign metadata type (stored on-chain via IPFS URI)
export interface CampaignMetadata {
  title: string;
  description: string;
  category: string;
  location: string;
  imageUrls: string[];
  tags: string[];
  organizationName: string;
  organizationVerified: boolean;
}

// Full campaign data from contract + IPFS
export interface CampaignData {
  poolId: number;
  proposalId: number;
  title: string;
  description: string;
  category: string;
  location: string;
  goal: number;
  organizationName: string;
  organizationVerified: boolean;
  imageUrl: string;
  imageUrls: string[];
  tags: string[];
  createdAt: number;
  endTime: number;
  raised: number;
  donors: number;
  isActive: boolean;
  isVerified: boolean;
  organizer: string;
  campaignType: number;
  metadataURI?: string;
}

// Fetch IPFS metadata from URI
export async function fetchIPFSMetadata(ipfsURI: string): Promise<CampaignMetadata | null> {
  try {
    // Convert ipfs:// URI to gateway URL
    const gatewayUrl = ipfsURI.replace('ipfs://', 'https://ipfs.io/ipfs/');

    const response = await fetch(gatewayUrl);
    if (!response.ok) {
      console.warn('Failed to fetch IPFS metadata:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data as CampaignMetadata;
  } catch (error) {
    console.error('Error fetching IPFS metadata:', error);
    return null;
  }
}

// Get all campaign pools from contract
export async function getAllCampaignPools(): Promise<CampaignData[]> {
  try {
    // Get pool count
    const poolCount = await publicClient.readContract({
      address: getAddress(CONTRACT_ADDRESSES.ZKTCore),
      abi: ZKTCoreABI,
      functionName: 'poolCount',
    }) as bigint;

    const count = Number(poolCount);
    const campaigns: CampaignData[] = [];

    // Fetch each pool
    for (let i = 1; i <= count; i++) {
      try {
        const pool = await publicClient.readContract({
          address: getAddress(CONTRACT_ADDRESSES.ZKTCore),
          abi: ZKTCoreABI,
          functionName: 'getPool',
          args: [BigInt(i)],
        }) as any;

        if (!pool || !pool.campaignTitle) continue;

        // Get proposal for metadata
        const proposal = await publicClient.readContract({
          address: getAddress(CONTRACT_ADDRESSES.ZKTCore),
          abi: ZKTCoreABI,
          functionName: 'getProposal',
          args: [BigInt(pool.proposalId)],
        }) as any;

        // Default metadata from contract data
        let metadata: CampaignMetadata = {
          title: pool.campaignTitle,
          description: proposal?.description || '',
          category: pool.campaignType === 1 ? 'Zakat' : 'General',
          location: 'Indonesia',
          imageUrls: [],
          tags: [],
          organizationName: pool.organizer
            ? `${pool.organizer.slice(0, 6)}...${pool.organizer.slice(-4)}`
            : 'Unknown',
          organizationVerified: pool.campaignType === 1,
        };

        // Try to fetch IPFS metadata if available
        if (proposal?.metadataURI && proposal.metadataURI.length > 0) {
          const ipfsMetadata = await fetchIPFSMetadata(proposal.metadataURI);
          if (ipfsMetadata) {
            metadata = { ...metadata, ...ipfsMetadata };
          }
        }

        const fundingGoal = Number(pool.fundingGoal || 0n) / 1e18;
        const raisedAmount = Number(pool.raisedAmount || 0n) / 1e18;
        const createdAt = Number(pool.createdAt || 0n);
        const endTime = createdAt + (90 * 24 * 60 * 60); // 90 days from creation

        campaigns.push({
          poolId: i,
          proposalId: Number(pool.proposalId),
          title: metadata.title,
          description: metadata.description,
          category: metadata.category,
          location: metadata.location,
          goal: fundingGoal,
          organizationName: metadata.organizationName,
          organizationVerified: metadata.organizationVerified,
          imageUrl: metadata.imageUrls[0] || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=500',
          imageUrls: metadata.imageUrls,
          tags: metadata.tags,
          createdAt,
          endTime,
          raised: raisedAmount,
          donors: pool.donors?.length || 0,
          isActive: pool.isActive || false,
          isVerified: pool.campaignType === 1,
          organizer: pool.organizer,
          campaignType: pool.campaignType,
          metadataURI: proposal?.metadataURI,
        });
      } catch (error) {
        console.error(`Error fetching pool ${i}:`, error);
        continue;
      }
    }

    return campaigns;
  } catch (error) {
    console.error('Error fetching campaigns from contract:', error);
    return [];
  }
}

// Get single campaign by pool ID
export async function getCampaignPool(poolId: number): Promise<CampaignData | null> {
  try {
    const pool = await publicClient.readContract({
      address: getAddress(CONTRACT_ADDRESSES.ZKTCore),
      abi: ZKTCoreABI,
      functionName: 'getPool',
      args: [BigInt(poolId)],
    }) as any;

    if (!pool || !pool.campaignTitle) return null;

    // Get proposal for metadata
    const proposal = await publicClient.readContract({
      address: getAddress(CONTRACT_ADDRESSES.ZKTCore),
      abi: ZKTCoreABI,
      functionName: 'getProposal',
      args: [BigInt(pool.proposalId)],
    }) as any;

    // Default metadata from contract data
    let metadata: CampaignMetadata = {
      title: pool.campaignTitle,
      description: proposal?.description || '',
      category: pool.campaignType === 1 ? 'Zakat' : 'General',
      location: 'Indonesia',
      imageUrls: [],
      tags: [],
      organizationName: pool.organizer
        ? `${pool.organizer.slice(0, 6)}...${pool.organizer.slice(-4)}`
        : 'Unknown',
      organizationVerified: pool.campaignType === 1,
    };

    // Try to fetch IPFS metadata if available
    if (proposal?.metadataURI && proposal.metadataURI.length > 0) {
      const ipfsMetadata = await fetchIPFSMetadata(proposal.metadataURI);
      if (ipfsMetadata) {
        metadata = { ...metadata, ...ipfsMetadata };
      }
    }

    const fundingGoal = Number(pool.fundingGoal || 0n) / 1e18;
    const raisedAmount = Number(pool.raisedAmount || 0n) / 1e18;
    const createdAt = Number(pool.createdAt || 0n);
    const endTime = createdAt + (90 * 24 * 60 * 60); // 90 days from creation

    return {
      poolId,
      proposalId: Number(pool.proposalId),
      title: metadata.title,
      description: metadata.description,
      category: metadata.category,
      location: metadata.location,
      goal: fundingGoal,
      organizationName: metadata.organizationName,
      organizationVerified: metadata.organizationVerified,
      imageUrl: metadata.imageUrls[0] || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=500',
      imageUrls: metadata.imageUrls,
      tags: metadata.tags,
      createdAt,
      endTime,
      raised: raisedAmount,
      donors: pool.donors?.length || 0,
      isActive: pool.isActive || false,
      isVerified: pool.campaignType === 1,
      organizer: pool.organizer,
      campaignType: pool.campaignType,
      metadataURI: proposal?.metadataURI,
    };
  } catch (error) {
    console.error('Error fetching campaign from contract:', error);
    return null;
  }
}

// Helper function to calculate days left
export function calculateDaysLeft(endDate: number): number {
  const now = Math.floor(Date.now() / 1000);
  const daysLeft = Math.ceil((endDate - now) / 86400);
  return Math.max(daysLeft, 0);
}
