"use client";

import React, { useState } from 'react';
import { Search, ExternalLink, Filter, TrendingUp, Users, Coins, Vote, Calendar } from 'lucide-react';
import { CONTRACT_ADDRESSES, formatAddress, formatTimestamp, formatIDRX } from '@/lib/abi';

type TransactionType = 'all' | 'donation' | 'campaign' | 'proposal' | 'vote';

interface Transaction {
  hash: string;
  type: TransactionType;
  from: string;
  to?: string;
  amount?: string;
  timestamp: number;
  blockNumber: number;
  description: string;
  status: 'success' | 'pending' | 'failed';
}

const ExplorerPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionType>('all');

  // Mock transaction data - In production, this would come from blockchain queries
  const transactions: Transaction[] = [
    {
      hash: '0x7f3d8a21c9e4f5b6d8a9c7e2f1a3b5d8c9e4f5b6d8a9c7e2f1a3b5d8c9e4f5b6',
      type: 'donation',
      from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5',
      to: CONTRACT_ADDRESSES.ZKTCore,
      amount: '158000000000000000000000',
      timestamp: 1732492800,
      blockNumber: 15234567,
      description: 'Donation to Emergency Relief Fund',
      status: 'success'
    },
    {
      hash: '0x9e2ab34f8c7d6e5a4b3c2d1e9f8a7b6c5d4e3f2a1b9c8d7e6f5a4b3c2d1e9f8a',
      type: 'donation',
      from: '0x8B3c9D2E1F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C',
      to: CONTRACT_ADDRESSES.ZKTCore,
      amount: '316000000000000000000000',
      timestamp: 1732320000,
      blockNumber: 15234123,
      description: 'Donation to Children Education Fund',
      status: 'success'
    },
    {
      hash: '0x4c8ed92a5f7b6e3c1d9a8f7e6d5c4b3a2f1e9d8c7b6a5f4e3d2c1b9a8f7e6d5',
      type: 'vote',
      from: '0x5F9A2E3C4D1B8A7F6E5D4C3B2A1F9E8D7C6B5A4F',
      to: CONTRACT_ADDRESSES.ZKTCore,
      timestamp: 1732233600,
      blockNumber: 15233890,
      description: 'Voted FOR on Proposal #17: Increase Education Fund Allocation',
      status: 'success'
    },
    {
      hash: '0x1b5fe87d3c9a2f6e4d8b7c5a3f2e1d9c8b7a6f5e4d3c2b1a9f8e7d6c5b4a3f2',
      type: 'donation',
      from: '0x3D5A7C9F1E2B4D6A8C0E2F4B6D8A0C2E4F6A8C0E',
      to: CONTRACT_ADDRESSES.ZKTCore,
      amount: '79000000000000000000000',
      timestamp: 1731974400,
      blockNumber: 15232456,
      description: 'Donation to Emergency Relief Fund',
      status: 'success'
    },
    {
      hash: '0x6a9cf13b8e2d7a5f4c3b9e8d7c6a5f4e3d2c1b9a8f7e6d5c4b3a2f1e9d8c7b6',
      type: 'campaign',
      from: '0x9E1F3D5A7C2B4E6F8A0C2D4E6F8A0C2D4E6F8A0C',
      to: CONTRACT_ADDRESSES.ZKTCore,
      timestamp: 1731628800,
      blockNumber: 15231234,
      description: 'Created campaign: Medical Equipment Fund',
      status: 'success'
    },
    {
      hash: '0x2f8e9d7c6b5a4f3e2d1c9b8a7f6e5d4c3b2a1f9e8d7c6b5a4f3e2d1c9b8a7f6',
      type: 'proposal',
      from: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
      to: CONTRACT_ADDRESSES.ZKTCore,
      timestamp: 1731542400,
      blockNumber: 15230987,
      description: 'Created proposal: Implement Quarterly Impact Reports',
      status: 'success'
    },
    {
      hash: '0x8d7c6b5a4f3e2d1c9b8a7f6e5d4c3b2a1f9e8d7c6b5a4f3e2d1c9b8a7f6e5d4',
      type: 'vote',
      from: '0x7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D',
      to: CONTRACT_ADDRESSES.ZKTCore,
      timestamp: 1731456000,
      blockNumber: 15230654,
      description: 'Voted FOR on Proposal #16: Implement Quarterly Impact Reports',
      status: 'success'
    },
    {
      hash: '0x5c4b3a2f1e9d8c7b6a5f4e3d2c1b9a8f7e6d5c4b3a2f1e9d8c7b6a5f4e3d2c1',
      type: 'donation',
      from: '0x4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F',
      to: CONTRACT_ADDRESSES.ZKTCore,
      amount: '237000000000000000000000',
      timestamp: 1731369600,
      blockNumber: 15230123,
      description: 'Donation to Clean Water Initiative',
      status: 'success'
    }
  ];

  const filteredTransactions = transactions.filter(tx => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesSearch = searchQuery === '' || 
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Calculate stats
  const totalDonations = transactions
    .filter(tx => tx.type === 'donation' && tx.amount)
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  
  const totalTransactions = transactions.length;
  const activeCampaigns = transactions.filter(tx => tx.type === 'campaign').length;
  const totalProposals = transactions.filter(tx => tx.type === 'proposal').length;

  const getTypeIcon = (type: TransactionType) => {
    switch(type) {
      case 'donation': return <Coins className="h-4 w-4" />;
      case 'campaign': return <TrendingUp className="h-4 w-4" />;
      case 'proposal': return <Vote className="h-4 w-4" />;
      case 'vote': return <Users className="h-4 w-4" />;
      default: return null;
    }
  };

  const getTypeBadge = (type: TransactionType) => {
    const styles: Record<TransactionType, string> = {
      donation: 'bg-green-100 text-green-700 border-green-200',
      campaign: 'bg-blue-100 text-blue-700 border-blue-200',
      proposal: 'bg-purple-100 text-purple-700 border-purple-200',
      vote: 'bg-orange-100 text-orange-700 border-orange-200',
      all: ''
    };
    
    return (
      <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${styles[type]}`}>
        {getTypeIcon(type)}
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="flex-1 py-8">
        <div className="container px-4 mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Blockchain Explorer</h1>
            <p className="text-muted-foreground">
              Explore all transactions on the ZKT platform • Base Sepolia Network
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white text-card-foreground rounded-xl border border-black shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Donated</div>
                  <div className="text-xl font-bold">{formatIDRX(BigInt(totalDonations))} IDRX</div>
                </div>
              </div>
            </div>

            <div className="bg-white text-card-foreground rounded-xl border border-black shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Active Campaigns</div>
                  <div className="text-xl font-bold">{activeCampaigns}</div>
                </div>
              </div>
            </div>

            <div className="bg-white text-card-foreground rounded-xl border border-black shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Vote className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Proposals</div>
                  <div className="text-xl font-bold">{totalProposals}</div>
                </div>
              </div>
            </div>

            <div className="bg-white text-card-foreground rounded-xl border border-black shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Transactions</div>
                  <div className="text-xl font-bold">{totalTransactions}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white text-card-foreground rounded-xl border border-black shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by transaction hash, address, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as TransactionType)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Types</option>
                  <option value="donation">Donations</option>
                  <option value="campaign">Campaigns</option>
                  <option value="proposal">Proposals</option>
                  <option value="vote">Votes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white text-card-foreground rounded-xl border border-black shadow-sm">
            <div className="p-6">
              <h2 className="font-semibold text-lg mb-4">Recent Transactions</h2>
              
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No transactions found matching your search criteria
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTransactions.map((tx) => (
                    <div 
                      key={tx.hash}
                      className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          {/* Transaction Type and Hash */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {getTypeBadge(tx.type)}
                            <a 
                              href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm font-mono text-primary hover:underline"
                            >
                              {formatAddress(tx.hash)}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <span className="inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium bg-green-100 text-green-700 border-green-200">
                              {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-sm font-medium">{tx.description}</p>

                          {/* From/To Addresses */}
                          <div className="flex flex-col sm:flex-row gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <span>From:</span>
                              <a 
                                href={`https://sepolia.basescan.org/address/${tx.from}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                              >
                                {formatAddress(tx.from)}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            {tx.to && (
                              <>
                                <span className="hidden sm:inline">→</span>
                                <div className="flex items-center gap-1">
                                  <span>To:</span>
                                  <a 
                                    href={`https://sepolia.basescan.org/address/${tx.to}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                                  >
                                    {formatAddress(tx.to)}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Amount and Time */}
                        <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-start gap-2">
                          {tx.amount && (
                            <div className="text-right">
                              <div className="text-sm font-semibold text-green-600">
                                {formatIDRX(BigInt(tx.amount))} IDRX
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground text-right">
                            <div>{formatTimestamp(tx.timestamp)}</div>
                            <div className="font-mono">Block #{tx.blockNumber.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contract Information */}
          <div className="mt-6 bg-gray-50 text-card-foreground rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-3">Smart Contract Addresses</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">ZKTCore</div>
                <a 
                  href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESSES.ZKTCore}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  {CONTRACT_ADDRESSES.ZKTCore}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">MockIDRX Token</div>
                <a 
                  href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESSES.MockIDRX}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  {CONTRACT_ADDRESSES.MockIDRX}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Receipt NFT</div>
                <a 
                  href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESSES.DonationReceiptNFT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  {CONTRACT_ADDRESSES.DonationReceiptNFT}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExplorerPage;
