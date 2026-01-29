# ZKT Hackathon - ZK Zakat DAO

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
├── fe/                      # Frontend (Next.js 16)
│   ├── app/                # Next.js App Router pages
│   ├── components/         # React components
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities, ABIs
│   └── public/             # Static assets
│
├── sc/                      # Smart Contracts (Foundry)
│   ├── src/
│   │   ├── DAO/            # Core DAO contracts
│   │   │   ├── ZKTCore.sol              # Main orchestrator
│   │   │   ├── core/                    # Manager contracts
│   │   │   ├── interfaces/              # Contract interfaces
│   │   │   └── verifiers/               # ZK verifier contracts
│   │   └── tokens/          # ERC20/721 tokens
│   │       ├── MockIDRX.sol              # Test stablecoin
│   │       ├── DonationReceiptNFT.sol    # Soulbound receipts
│   │       ├── VotingNFT.sol             # Governance NFT
│   │       └── OrganizerNFT.sol          # Organizer status NFT
│   ├── script/            # Deployment scripts
│   └── test/              # Contract tests
│
├── circuits/                # ZK Circuits (Circom)
│   ├── ShariaVoteAggregator.circom
│   └── components/         # Circuit components
│
├── supabase/                # Backend (Supabase)
│   ├── config.toml
│   ├── functions/          # Edge functions
│   └── migrations/         # Database migrations
│
└── README.md                # This file
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

### Tech Stack

- **Next.js 16.1.1** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5.x** - Type safety
- **Tailwind CSS 4.1.9** - Styling
- **Radix UI + shadcn/ui** - Component library
- **viem/wagmi 2.x** - Web3 integration
- **XellarKit** - Multi-wallet support

### Available Pages

| Route | Page | Status |
|-------|------|--------|
| `/` | Home | Complete |
| `/campaigns` | Campaign Explorer | Complete |
| `/campaigns/[id]` | Campaign Details | Partial |
| `/campaigns/new` | Create Campaign | Complete |
| `/governance` | DAO Voting | Complete |
| `/dashboard/donor` | Donor Dashboard | Complete |
| `/dashboard/organization` | Organization Dashboard | Partial |
| `/dashboard/auditor` | Auditor Dashboard | Partial |
| `/zakat` | Zakat Calculator | Complete |
| `/faucet` | Token Faucet | Complete |
| `/explorer` | Block Explorer | Complete |

### Environment Variables

Create `fe/.env`:

```env
# Web3 Configuration
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

### Wallet Support

- MetaMask
- WalletConnect
- Coinbase Wallet
- Safe (multisig)
- XellarKit-compatible wallets

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
