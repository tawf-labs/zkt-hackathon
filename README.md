# ZKT - Zakat On Chain 

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.31-blue.svg)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

A decentralized Zakat donation platform combining zero-knowledge proofs, smart contracts, and dual governance (community + Sharia council) for transparent, verifiable charitable giving on Base Sepolia.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Smart Contracts](#smart-contracts)
- [Frontend Application](#frontend-application)
- [ZK Circuits](#zk-circuits)
- [Supabase Integration](#supabase-integration)
- [Development](#development)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Overview

ZKT Zakat DAO is a Web3 platform that enables:

- **Sharia-compliant charitable crowdfunding** with built-in governance
- **Zero-knowledge proof verification** for private donations and KYC
- **Dual governance system** combining community voting and Sharia council review
- **Multiple campaign types**: Normal, Zakat-compliant (30-day distribution), and Emergency (DRCP-style disaster response)
- **Soulbound NFT receipts** for donation verification and governance rights

The platform follows a **progressive decentralization** approach, starting with core team multisig control and transitioning to full DAO governance.

## Key Features

### Governance
- **Tiered Voting System** (vZKT NFT): 1-3 votes based on participation
- **Campaign-Specific Governance** (ZKT-RECEIPT NFT): Donors vote on milestone releases
- **Sharia Council Review**: Bundled proposal review for Sharia compliance
- **Hybrid Organizer Approval**: Community proposes → Sharia approves → KYC verifies

### Campaign Types
| Type | Distribution | Voting | Sharia Review | Time Limit |
|------|--------------|--------|---------------|------------|
| **Normal** | Milestone-based tranches | 7 days | Standard bundle | None |
| **Zakat** | 30-day distribution window | 7 days | Standard bundle | 30 days (+14 extension) |
| **Emergency** | Parametric/Instant | 24-48 hours | Skipped | DRCP rules |

### Privacy
- **Private Donations**: Pedersen commitment scheme
- **ZK-KYC**: Zero-knowledge identity verification (Circom circuits)
- **Anonymous Options**: Donor privacy while maintaining transparency


## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           ZKTCore (Orchestrator)                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  Proposal       │  │  Voting         │  │  Sharia         │          │
│  │  Manager        │  │  Manager        │  │  Review         │          │
│  │                 │  │                 │  │  Manager        │          │
│  │ - Proposals     │  │ - Community     │  │ - Bundling      │          │
│  │ - KYC Registry  │  │   Voting        │  │ - Council       │          │
│  │ - Lifecycle     │  │ - Expedited     │  │   Review        │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  Pool           │  │  Zakat          │  │  Emergency      │          │
│  │  Manager        │  │  Escrow         │  │  Escrow         │          │
│  │                 │  │  Manager        │  │  (DRCP)         │          │
│  │ - Normal        │  │ - Zakat Only    │  │ - Disaster     │          │
│  │   Campaigns     │  │ - 30-Day        │  │   Response     │          │
│  │                 │  │   Timeout       │  │ - Fast Track   │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
zkt-hackathon/
├── fe/                              # Frontend (Next.js 16.1.1)
│   ├── app/                         # Next.js App Router
│   │   ├── campaigns/              # Campaign pages
│   │   │   ├── page.tsx           # Campaign explorer
│   │   │   ├── [id]/              # Campaign detail
│   │   │   └── new/               # Create campaign
│   │   ├── dashboard/              # Role-based dashboards
│   │   │   ├── donor/             # Donor dashboard
│   │   │   ├── organization/      # Org management
│   │   │   └── auditor/           # Auditor oversight
│   │   ├── governance/            # DAO voting (page.tsx)
│   │   ├── api/                   # API routes
│   │   │   ├── campaigns/         # Campaign endpoints
│   │   │   ├── certificates/      # Certificate generation
│   │   │   └── upload-to-pinata/  # IPFS upload
│   │   ├── contact/               # Contact page
│   │   ├── explorer/              # Block explorer
│   │   ├── faucet/                # Token faucet
│   │   ├── mainnet/               # Mainnet info
│   │   ├── partners/              # Partner showcase
│   │   ├── zakat/                 # Zakat calculator
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Home page
│   │
│   ├── components/                  # React components
│   │   ├── campaigns/              # Campaign-specific
│   │   │   ├── allocation-progress.tsx
│   │   │   ├── campaign-map.tsx
│   │   │   └── campaign-status-badge.tsx
│   │   ├── donations/              # Donation flow
│   │   │   └── donation-dialog.tsx
│   │   ├── landing/                # Landing sections
│   │   │   ├── badge.tsx
│   │   │   ├── featured-campaigns.tsx
│   │   │   ├── hero.tsx
│   │   │   └── how-it-works.tsx
│   │   ├── layout/                 # Layout components
│   │   │   ├── footer.tsx
│   │   │   └── header.tsx
│   │   ├── providers/              # Context providers
│   │   │   ├── currency-provider.tsx
│   │   │   ├── language-provider.tsx
│   │   │   └── web3-provider.tsx
│   │   ├── shared/                 # Reusable components
│   │   │   ├── SearchContext.tsx
│   │   │   ├── SearchDropdown.tsx
│   │   │   ├── campaign-card.tsx
│   │   │   └── lock-allocation-button.tsx
│   │   ├── wallet/                 # Wallet integration
│   │   │   ├── client-wallet-wrapper.tsx
│   │   │   ├── connect-wallet-button.tsx
│   │   │   └── wallet-context.tsx
│   │   ├── certificates/            # Certificate components
│   │   │   └── zakat-certificate-modal.tsx
│   │   └── ui/                     # Shadcn/ui (50+ components)
│   │
│   ├── hooks/                       # Custom React hooks (22 hooks)
│   │   ├── useCampaign.ts
│   │   ├── useCampaigns.ts
│   │   ├── useCampaignEventListener.ts
│   │   ├── useCampaignStatus.ts
│   │   ├── useCreateCampaign.ts
│   │   ├── useCreateCampaignOnChain.ts
│   │   ├── useCreateCampaignWithSafe.ts
│   │   ├── useCreateProposal.ts
│   │   ├── useDonate.ts
│   │   ├── useDonationReceipts.ts
│   │   ├── useExplorerTransactions.ts
│   │   ├── useFallbackPools.ts
│   │   ├── useIDRXBalance.ts
│   │   ├── useMilestones.ts
│   │   ├── usePoolManager.ts
│   │   ├── usePrivateDonate.ts
│   │   ├── useProposals.ts
│   │   ├── useShariaReview.ts
│   │   ├── useVoting.ts
│   │   ├── useVotingPower.ts
│   │   ├── useZakatCertificate.ts
│   │   └── useZakatLifecycle.ts
│   │
│   ├── lib/                         # Utilities & configs
│   │   ├── abis/                   # Contract ABIs
│   │   ├── contracts.ts            # Contract addresses
│   │   ├── constants.ts            # App constants
│   │   └── utils.ts                # Helper functions
│   │
│   ├── public/                      # Static assets
│   └── package.json
│
├── sc/                              # Smart Contracts (Foundry)
│   ├── src/
│   │   ├── DAO/                    # Core DAO contracts
│   │   │   ├── ZKTCore.sol        # Main orchestrator
│   │   │   ├── core/              # Manager contracts
│   │   │   │   ├── EmergencyEscrow.sol
│   │   │   │   ├── PoolManager.sol
│   │   │   │   ├── ProposalManager.sol
│   │   │   │   ├── ShariaReviewManager.sol
│   │   │   │   ├── VotingManager.sol
│   │   │   │   └── ZakatEscrow.sol
│   │   │   ├── interfaces/        # Contract interfaces
│   │   │   └── verifiers/         # ZK verifier contracts
│   │   │       └── Groth16Verifier.sol
│   │   └── tokens/                # ERC20/721 tokens
│   │       ├── DonationReceiptNFT.sol
│   │       ├── MockIDRX.sol
│   │       ├── OrganizerNFT.sol
│   │       └── VotingToken.sol
│   ├── script/                     # Deployment scripts
│   │   └── DeployZKT.s.sol
│   ├── test/                       # Contract tests
│   ├── foundry.toml
│   └── package.json
│
├── circuits/                        # ZK Circuits (Circom)
│   ├── ShariaVoteAggregator.circom # Main circuit
│   ├── components/                 # Circuit components
│   ├── build/                      # Compiled circuit outputs
│   └── package.json
│
├── supabase/                        # Backend (Supabase)
│   ├── config.toml
│   ├── functions/                  # Edge functions
│   └── migrations/                 # Database migrations
│
├── next_work.md                     # Development roadmap
└── README.md                        # This file
```

## Quick Start

### Prerequisites

- **Node.js** 18+ and **pnpm**
- **Foundry** (for smart contracts)
- **Circom** & **snarkjs** (for ZK circuits)
- **Supabase CLI** (optional, for local backend)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/tawf-labs/zkt-hackathon.git
cd zkt-hackathon
```

2. **Install frontend dependencies**
```bash
cd fe
pnpm install
```

3. **Install smart contract dependencies**
```bash
cd ../sc
forge install
```

4. **Install circuit dependencies**
```bash
cd ../circuits
npm install
```

### Running Locally

**Frontend:**
```bash
cd fe
pnpm dev
# Visit http://localhost:3000
```

**Smart Contracts (compile):**
```bash
cd sc
forge build
```

**ZK Circuits (build):**
```bash
cd circuits
npm run build
```

## Smart Contracts

### Deployed Contracts (Base Sepolia)

| Contract | Address | Purpose |
|----------|---------|---------|
| **ZKTCore** | `0xacc7d3d90ba0e06dfa3ddd702214ed521726efdd` | Main orchestrator |
| **MockIDRX** | `0xb3970735048e6db24028eb383d458e16637cbc7a` | Test ERC20 with faucet |
| **DonationReceiptNFT** | `0x3d40bad0a1ac627d59bc142ded202e08e002b6a7` | Soulbound receipts |
| **VotingToken** | `0x4461b304f0ce2a879c375ea9e5124be8bc73522d` | Governance token |

### Key Contract Functions

```solidity
// Campaign Creation
function createProposal(
    string memory title,
    string memory description,
    uint256 fundingGoal,
    bool isEmergency,
    bytes32 mockZKKYCProof,
    string[] memory zakatChecklistItems,
    string memory metadataURI
) external returns (uint256 proposalId);

// Voting
function castVote(uint256 proposalId, uint8 support) external;
// 0 = against, 1 = for, 2 = abstain

// Donations
function donate(uint256 poolId, uint256 amount, string memory metadataURI) external;
function donatePrivate(uint256 poolId, uint256 amount, bytes32 commitment, string memory metadataURI) external;

// Fund Withdrawal
function withdrawFunds(uint256 poolId) external;
```

### Deploying Contracts

```bash
cd sc

# Deploy to Base Sepolia
forge script script/DeployZKT.s.sol \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  -vvvv
```

## Frontend Application

### Tech Stack & Architecture

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | 16.1.1 | App Router, Server Components |
| **UI Library** | React | 19 | Component rendering |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | 4.1.9 | Utility-first CSS with custom theme |
| **Components** | Radix UI + shadcn/ui | Latest | Accessible component primitives |
| **Icons** | Lucide React | Latest | Icon library |
| **Web3** | viem/wagmi | 2.x | Ethereum interaction |
| **Wallets** | XellarKit | Latest | Multi-wallet connection |
| **Charts** | Recharts | Latest | Data visualization |
| **Forms** | React Hook Form | Latest | Form state management |
| **State** | React Context | Built-in | Global state (currency, language) |
| **Data Fetching** | React Query | Built-in | Server state caching |

### Project Structure

```
fe/
├── app/                          # Next.js App Router
│   ├── campaigns/               # Campaign pages
│   │   ├── page.tsx            # Campaign explorer
│   │   ├── [id]/               # Campaign detail view
│   │   └── new/                # Campaign creation form
│   ├── dashboard/              # Role-based dashboards
│   │   ├── donor/              # Donor dashboard
│   │   ├── organization/       # Org management
│   │   └── auditor/            # Auditor oversight
│   ├── governance/             # DAO voting interface
│   ├── api/                    # API routes
│   │   ├── campaigns/          # Campaign data endpoints
│   │   ├── certificates/       # Certificate generation
│   │   └── upload-to-pinata/   # IPFS upload
│   └── layout.tsx              # Root layout with providers
│
├── components/                  # React components
│   ├── campaigns/               # Campaign-specific components
│   │   ├── campaign-card.tsx
│   │   ├── campaign-map.tsx
│   │   ├── allocation-progress.tsx
│   │   └── campaign-status-badge.tsx
│   ├── donations/               # Donation flow components
│   │   └── donation-dialog.tsx  # Two-step donation UI
│   ├── landing/                 # Landing page sections
│   │   ├── hero.tsx
│   │   ├── featured-campaigns.tsx
│   │   ├── how-it-works.tsx
│   │   └── badge.tsx
│   ├── layout/                  # Layout components
│   │   ├── header.tsx           # Navigation + wallet connect
│   │   └── footer.tsx           # Site footer
│   ├── providers/               # Context providers
│   │   ├── web3-provider.tsx    # Web3 connection
│   │   ├── currency-provider.tsx # Currency conversion
│   │   └── language-provider.tsx # i18n support
│   ├── shared/                  # Reusable components
│   │   ├── SearchContext.tsx    # Search state
│   │   ├── SearchDropdown.tsx   # Search UI
│   │   └── lock-allocation-button.tsx
│   ├── wallet/                  # Wallet integration
│   │   ├── client-wallet-wrapper.tsx
│   │   ├── connect-wallet-button.tsx
│   │   └── wallet-context.tsx
│   ├── certificates/            # Certificate components
│   │   └── zakat-certificate-modal.tsx
│   └── ui/                      # Shadcn/ui components (50+)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       └── ...                  # Additional UI primitives
│
├── hooks/                       # Custom React hooks
│   ├── useCampaigns.ts          # Fetch all campaigns
│   ├── useCampaign.ts           # Single campaign data
│   ├── useDonate.ts             # Public donations
│   ├── usePrivateDonate.ts      # Private donations
│   ├── useIDRXBalance.ts        # Token balance
│   ├── useVoting.ts             # Governance voting
│   ├── useProposals.ts          # DAO proposals
│   ├── useCreateCampaign.ts     # Campaign creation
│   ├── useDonationReceipts.ts   # NFT receipts
│   ├── useZakatCertificate.ts   # Certificate generation
│   ├── useMilestones.ts         # Milestone management
│   ├── useShariaReview.ts       # Council review
│   ├── useVotingPower.ts        # Vote calculation
│   └── useZakatLifecycle.ts     # Zakat deadlines
│
├── lib/                         # Utilities & configs
│   ├── utils.ts                 # Helper functions
│   ├── constants.ts             # App constants
│   ├── abis/                    # Contract ABIs
│   └── contracts.ts             # Contract addresses
│
└── data/                        # Static data
    └── mockData.ts              # Development mock data
```

### Pages Reference

| Route | Page | Status | Description |
|-------|------|--------|-------------|
| `/` | Home | Complete | Landing page with hero, featured campaigns, how it works |
| `/campaigns` | Explorer | Complete | Browse/search all campaigns with filters |
| `/campaigns/[id]` | Detail | Partial | Single campaign view with milestones, donations |
| `/campaigns/new` | Create | Complete | Campaign creation form with metadata upload |
| `/governance` | DAO Voting | Complete | Community governance, proposal voting |
| `/dashboard/donor` | Donor Dashboard | Complete | Donation history, governance rights, certificates |
| `/dashboard/organization` | Org Dashboard | Partial | Campaign management, fund withdrawal |
| `/dashboard/auditor` | Auditor Dashboard | Partial | Verification oversight, reviews |
| `/zakat` | Calculator | Complete | Zakat calculation tool |
| `/faucet` | Token Faucet | Complete | Test token claims (IDRX) |
| `/explorer` | Block Explorer | Complete | Transaction history, contract interactions |
| `/contact` | Contact | Complete | Contact form |
| `/partners` | Partners | Complete | Partner showcase |
| `/mainnet` | Mainnet | Complete | Mainnet deployment information |

### Key Components

#### Layout Components
- **Header** (`components/layout/header.tsx`) - Site navigation, wallet connection, mobile menu
- **Footer** (`components/layout/footer.tsx`) - Site links, social media, legal

#### Campaign Components
- **CampaignCard** (`components/shared/campaign-card.tsx`) - Campaign preview with status, progress
- **CampaignMap** (`components/campaigns/campaign-map.tsx`) - Geographic campaign visualization
- **AllocationProgress** (`components/campaigns/allocation-progress.tsx`) - Fund allocation display
- **StatusBadge** (`components/campaigns/campaign-status-badge.tsx`) - Campaign status indicator

#### Donation Components
- **DonationDialog** (`components/donations/donation-dialog.tsx`) - Two-step donation flow:
  1. Approve token spending
  2. Execute donation transaction

#### Landing Components
- **Hero** (`components/landing/hero.tsx`) - Main hero section with CTA
- **FeaturedCampaigns** (`components/landing/featured-campaigns.tsx`) - Highlighted campaigns
- **HowItWorks** (`components/landing/how-it-works.tsx`) - Process explanation
- **Badge** (`components/landing/badge.tsx`) - Trust indicators

#### Shared Components
- **SearchContext** (`components/shared/SearchContext.tsx`) - Global search state
- **SearchDropdown** (`components/shared/SearchDropdown.tsx`) - Search UI with results
- **LockAllocationButton** (`components/shared/lock-allocation-button.tsx`) - Fund locking control

#### Provider Components
- **Web3Provider** (`components/providers/web3-provider.tsx`) - Wallet connection, wagmi config
- **CurrencyProvider** (`components/providers/currency-provider.tsx`) - Multi-currency support
- **LanguageProvider** (`components/providers/language-provider.tsx`) - i18n context

### Custom Hooks Reference

| Hook | Purpose | Returns |
|------|---------|---------|
| `useCampaigns()` | Fetch all campaigns from contract | `Campaign[]` |
| `useCampaign(id)` | Single campaign data with milestones | `Campaign` |
| `useDonate()` | Public donation transactions | `donate()` function |
| `usePrivateDonate()` | Private donation with commitment | `donatePrivate()` function |
| `useIDRXBalance(address)` | Token balance for address | `balance` string |
| `useVoting()` | Governance vote casting | `castVote()` function |
| `useProposals()` | Fetch DAO proposals | `Proposal[]` |
| `useCreateCampaign()` | Campaign creation flow | `createCampaign()` function |
| `useDonationReceipts(address)` | NFT receipts for donor | `Receipt[]` |
| `useZakatCertificate()` | Certificate PDF generation | `generateCertificate()` function |
| `useMilestones(poolId)` | Campaign milestone data | `Milestone[]` |
| `useShariaReview()` | Council review operations | Review functions |
| `useVotingPower(address)` | Calculate governance votes | Vote count |
| `useZakatLifecycle(poolId)` | Zakat deadline tracking | Lifecycle status |

### Web3 Integration

#### Wallet Providers
- **Primary**: XellarKit (multi-wallet aggregator)
- **Supported**:
  - MetaMask
  - Coinbase Wallet
  - WalletConnect
  - Safe (multisig)
  - XellarKit-compatible wallets

#### Network Configuration
- **Network**: Base Sepolia (enforced, auto-switch prompt)
- **RPC URL**: `https://sepolia.base.org`
- **Chain ID**: 84532

#### Token Flow (Two-Step Donation)
1. **Approval**: User approves IDRX spending allowance
2. **Donation**: User executes donation with approved amount

#### Real-Time Features
- Balance tracking via `useIDRXBalance`
- Transaction status updates
- Block confirmation monitoring

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/campaigns` | GET | Fetch all campaigns from smart contract |
| `/api/campaigns/[id]` | GET | Campaign details with milestones |
| `/api/upload-to-pinata` | POST | Upload metadata to IPFS via Pinata |
| `/api/certificates` | POST | Generate Zakat certificate PDF |

### Environment Variables

Create `fe/.env`:

```env
# Web3 Configuration
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org

# Contract Addresses (Base Sepolia)
NEXT_PUBLIC_ZKT_CORE_ADDRESS=0xacc7d3d90ba0e06dfa3ddd702214ed521726efdd
NEXT_PUBLIC_IDRX_ADDRESS=0xb3970735048e6db24028eb383d458e16637cbc7a
NEXT_PUBLIC_DONATION_RECEIPT_NFT_ADDRESS=0x3d40bad0a1ac627d59bc142ded202e08e002b6a7
NEXT_PUBLIC_VOTING_TOKEN_ADDRESS=0x4461b304f0ce2a879c375ea9e5124be8bc73522d

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# IPFS / Pinata
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt

# Supabase (optional)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

### Development Commands

```bash
cd fe

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start

# Lint code
pnpm lint

# Type check
pnpm tsc --noEmit
```

## ZK Circuits

### ShariaVoteAggregator Circuit

Located in `circuits/ShariaVoteAggregator.circom`

This circuit aggregates Sharia council votes while preserving voter privacy through Groth16 proofs.

### Building Circuits

```bash
cd circuits

# Compile circuit
npm run build

# Setup trusted setup (test)
npm run setup:test

# Export Solidity verifier
npm run export:verifier

# Generate proof
npm run prove
```

### Circuit Outputs

- `build/ShariaVoteAggregator.r1cs` - Rank-1 Constraint System
- `build/ShariaVoteAggregator_js/` - WASM for proving
- `build/sharia_0000.zkey` - Proving key
- `sc/src/DAO/verifiers/Groth16Verifier.sol` - Solidity verifier

## Supabase Integration

### Configuration

Edit `supabase/config.toml`:

```toml
project_id = "your-project-id"

[api]
enabled = true
port = 54321

[db]
port = 54322

[studio]
port = 54323
```

### Running Locally

```bash
cd supabase
supabase start
```

### Migrations

Database migrations are stored in `supabase/migrations/`.

## Development

### Code Quality

```bash
# Frontend linting
cd fe
pnpm lint

# Smart contract testing
cd sc
forge test

# Circuit testing
cd circuits
npm test
```

### Git Workflow

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open Pull Request

## Deployment

### Frontend (Vercel)

```bash
cd fe
vercel deploy
```

### Smart Contracts

See deployment scripts in `sc/script/DeployZKT.s.sol`.

### Pre-Mainnet Checklist

- [ ] Replace mock ZK proofs with real circuits
- [ ] Implement tranche-based funding for Normal campaigns
- [ ] Add Emergency Vault contract
- [ ] Complete security audit
- [ ] Deploy real IDRX token (fiat-backed)
- [ ] Configure production monitoring
- [ ] Set up IPFS for metadata

## Roadmap

### Phase 1: Foundation (Current)
- ✅ Core smart contracts deployed
- ✅ Frontend application
- ✅ Basic ZK circuits
- ✅ Supabase integration

### Phase 2: Security & Privacy
- [ ] Real ZK-KYC integration
- [ ] Tranche-based milestone funding
- [ ] Emergency vault system
- [ ] True private donations

### Phase 3: Enhancement
- [ ] NFT-based governance
- [ ] Organization verification
- [ ] IPFS metadata integration
- [ ] Multi-chain support

### Phase 4: Mainnet
- [ ] Security audit completion
- [ ] Base Mainnet deployment
- [ ] Real IDRX token integration
- [ ] Progressive decentralization

## Contributing

Contributions are welcome! Please see our contributing guidelines:

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

Copyright 2026 Tawf Labs

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Support

- **GitHub Issues**: [tawf-labs/zkt-hackathon](https://github.com/tawf-labs/zkt-hackathon/issues)
- **Documentation**: See `sc/README.md` for smart contract details
- **Next Steps**: See `next_work.md` for development roadmap
