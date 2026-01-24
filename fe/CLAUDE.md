# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZK Zakat is a Next.js 15.2.4 web application that enables private and verifiable Zakat donations using zero-knowledge proof technology. This is a **client-side only mock implementation** - all blockchain interactions are simulated for demonstration purposes.

## Development Commands

```bash
pnpm dev          # Start development server (localhost:3000)
pnpm build        # Build for production (ignores ESLint/TypeScript errors)
pnpm start        # Start production server
pnpm lint         # Run ESLint (check only, not enforced during builds)
```

## Architecture & Tech Stack

### Core Framework
- **Next.js 15.2.4** with App Router pattern
- **React 19** with TypeScript
- **Tailwind CSS v4** with CSS Variables
- **pnpm** package manager

### UI Components
- **Radix UI** primitives for accessibility
- **Shadcn/ui** component library (60+ components in `components/ui/`)
- **Lucide React** for icons
- **Geist** for typography

### State Management
- **React Context** for global wallet state (`components/wallet/WalletProvider.tsx`)
- **React Hook Form** with Zod validation for forms
- **localStorage** for wallet persistence

### Key Features (Mock Implementation)
- **Wallet System**: Mock USDT transactions with simulated blockchain
- **Zero-Knowledge Proofs**: Mock IPFS URIs and verification
- **Campaign Management**: Browse and donate to Zakat campaigns
- **Dual Dashboards**: Separate interfaces for users and organizers
- **DAO Governance**: Voting system for charitable decisions

## Project Structure

```
app/                     # Next.js App Router pages
├── campaigns/[id]/     # Dynamic campaign details
├── dashboard/          # User & organizer dashboards
├── dao/               # DAO governance
├── bayar/             # Payment/donation flow
├── layout.tsx         # Root layout with theme providers
└── page.tsx           # Home landing page

components/
├── campaigns/         # Campaign-specific components
├── donations/         # Donation flow components
├── landing/           # Landing page sections
├── layout/            # Header, footer, navigation
├── shared/            # Reusable feature components
├── ui/                # Shadcn/ui component library
└── wallet/            # Mock Web3 wallet components

data/                  # Static mock data (campaigns, donations)
hooks/                 # Custom React hooks
lib/                   # Utilities, helpers, configurations
public/                # Static assets
```

## Important Development Notes

### Mock Implementation
- **No Backend**: Pure client-side application with no API routes
- **Mock Blockchain**: All transactions are simulated with fake hashes
- **Static Data**: Campaign and financial data are hardcoded
- **Mock ZK Proofs**: IPFS URIs are generated but not real

### Build Configuration
The `next.config.mjs` deliberately ignores build errors for rapid development:
- ESLint errors are ignored during builds
- TypeScript errors are ignored during builds
- Images are unoptimized for better compatibility

### Wallet System
- **WalletProvider**: Context managing mock USDT balance and transactions
- **Two-step Flow**: Approval → Donation transaction pattern
- **Transaction Hashes**: Generated using random hashes for realism
- **Local Storage**: Persists wallet state across sessions

### UI Language
- **Primary Language**: Indonesian (Bahasa Indonesia)
- ** RTL Support**: Not implemented
- **Date Formatting**: Uses `date-fns` for consistent date display

### Theme System
- **Next Themes**: Manages dark/light mode switching
- **Tailwind CSS**: Custom color variables in `styles/globals.css`
- **Component Theming**: Follows shadcn/ui patterns

## Common Development Tasks

### Adding New Campaigns
Edit `data/campaigns.ts` to add new campaign data with required fields:
- `id`, `title`, `description`, `target`, `raised`, `category`
- `organizer`, `deadline`, `image`, `verified` status

### Modifying Wallet Logic
Update `components/wallet/WalletProvider.tsx` for:
- Balance management
- Transaction processing
- Mock blockchain interactions

### UI Component Development
- Use existing components from `components/ui/` when possible
- Follow shadcn/ui patterns for new components
- Maintain TypeScript strict typing

### Page Routing
Use Next.js App Router conventions:
- Server components by default
- `"use client"` for interactivity
- File-based routing with dynamic segments `[id]`

## Environment Setup

No environment variables are required for the mock implementation. For production deployment with real blockchain integration, refer to the README.md for expected environment variables.