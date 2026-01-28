# ZK Sharia Coordinator - Deployment Guide

This guide covers deploying the ZK Sharia Council coordinator to Phala Cloud (TEE) and setting up Supabase for authentication and data storage.

---

## Prerequisites

- Node.js 20+
- Docker installed
- Phala Cloud CLI
- Supabase CLI
- Alchemy API key (for Base Sepolia RPC)

---

## Phase 1: Dockerize the Coordinator

### Build Docker Image

```bash
cd sc/offchain-coordinator
docker build -t sharia-zk-coordinator .
```

### Test Locally

```bash
docker run -p 3000:3000 \
  -e RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY \
  -e PRIVATE_KEY=your_private_key \
  -e SHARIA_QUORUM=3 \
  sharia-zk-coordinator
```

Test the health endpoint:
```bash
curl http://localhost:3000/health
```

---

## Phase 2: Deploy to Phala Cloud

### Install Phala CLI

```bash
npm install -g @phala/cloud
```

### Login to Phala

```bash
phala login
```

### Configure Environment

Edit `.env.production` with your values:

```bash
# Blockchain Configuration
RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=<encrypted_via_phala_secrets>
DAO_CONTRACT_ADDRESS=0x...

# Coordinator Configuration
PORT=3000
SHARIA_QUORUM=3
AUTO_PUBLISH=false

# Circuit Paths (adjust after deployment)
CIRCUIT_WASM_PATH=/app/circuits/ShariaVoteAggregator.wasm
CIRCUIT_ZKEY_PATH=/app/circuits/sharia_0000.zkey
CIRCUIT_VKEY_PATH=/app/circuits/verification_key.json

# Supabase Integration
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=<encrypted_via_phala_secrets>
SUPABASE_SERVICE_ROLE_KEY=<encrypted_via_phala_secrets>
```

### Set Encrypted Secrets

```bash
# Store private key securely
phala secrets set PRIVATE_KEY --encrypted

# Store Supabase keys
phala secrets set SUPABASE_ANON_KEY --encrypted
phala secrets set SUPABASE_SERVICE_ROLE_KEY --encrypted
```

### Deploy to Phala

```bash
phala deploy \
  --name sharia-zk-coordinator \
  --docker sharia-zk-coordinator \
  --env .env.production \
  --tee \
  --region us-east
```

### Monitor Deployment

```bash
# View logs
phala logs sharia-zk-coordinator --follow

# Check health
phala exec sharia-zk-coordinator -- curl -s http://localhost:3000/health
```

---

## Phase 3: Setup Supabase

### Create Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon/service keys

### Run Migration

```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref YOUR_PROJECT_ID

# Run migrations
supabase db push
```

Or manually run the SQL in the Supabase SQL Editor:
- Open SQL Editor in Supabase dashboard
- Copy contents of `supabase/migrations/001_council.sql`
- Execute the script

### Insert Council Members

```sql
-- Insert council members (in SQL Editor)
INSERT INTO council_members (address, name, email, is_active)
VALUES
  ('0x1234...', 'Council Member 1', 'member1@example.com', true),
  ('0x5678...', 'Council Member 2', 'member2@example.com', true),
  ('0x9abc...', 'Council Member 3', 'member3@example.com', true);
```

### Configure Environment Variables

In Supabase dashboard → Settings → Edge Functions:

```
PHALA_COORDINATOR_URL=https://your-coordinator.phala.network
```

---

## Phase 4: Deploy Supabase Edge Functions

### Deploy Vote Function

```bash
cd supabase

# Deploy the vote function
supabase functions deploy vote \
  --no-verify-jwt
```

### Get Function URL

The function will be available at:
```
https://YOUR_PROJECT_ID.supabase.co/functions/vote
```

---

## Phase 5: Configure Frontend

### Frontend Vote Submission

```typescript
const submitVote = async (
  bundleId: number,
  proposalId: number,
  vote: 0 | 1
) => {
  const response = await fetch(
    'https://YOUR_PROJECT_ID.supabase.co/functions/vote',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAccessToken}`,
        'Content-Type': 'application/json',
        'X-Council-Address': councilWalletAddress,
      },
      body: JSON.stringify({
        bundleId,
        proposalId,
        vote,
        signature: await signVote(bundleId, proposalId, vote),
      }),
    }
  );

  return response.json();
};
```

---

## Phase 6: Circuit Deployment

Before the coordinator can generate proofs, upload the circuit files:

```bash
# From Phala container or via kubectl
phala exec sharia-zk-coordinator -- mkdir -p /app/circuits

# Copy circuit files
phala cp ../../circuits/build/ShariaVoteAggregator_js/ShariaVoteAggregator.wasm \
  sharia-zk-coordinator:/app/circuits/

phala cp ../../circuits/build/sharia_0000.zkey \
  sharia-zk-coordinator:/app/circuits/

phala cp ../../circuits/build/verification_key.json \
  sharia-zk-coordinator:/app/circuits/
```

---

## Phase 7: Health Monitoring

### Coordinator Health Check

```bash
curl https://your-coordinator.phala.network/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": 1738080000000,
  "uptime": 3600,
  "environment": "production",
  "memory": { "rss": 134217728, "heapTotal": 10485760 },
  "tee": {
    "enabled": true,
    "attested": true
  },
  "council": {
    "root": "0x...",
    "memberCount": 3
  },
  "coordinator": {
    "quorum": 3,
    "autoPublish": false
  }
}
```

### Setup Alerts

Configure alerts in Phala dashboard for:
- Coordinator downtime
- High memory usage
- Failed health checks

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                              │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────┐  │
│  │   React/Web │────│  Supabase    │────│  Supabase Auth      │  │
│  │     UI      │    │  PostgreSQL  │    │  (Council Members)  │  │
│  └─────────────┘    └──────┬───────┘    └─────────────────────┘  │
│                            │                                       │
└────────────────────────────┼───────────────────────────────────────┘
                             │ Votes (via API)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      TEE Protected Layer                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Phala Cloud (TEE Coordinator)                    │  │
│  │  ┌────────────────┐  ┌───────────────┐  ┌─────────────────┐ │  │
│  │  │ Vote Aggregator│  │ Proof Generator│  │  Private Keys   │ │  │
│  │  │   (LevelDB)    │  │   (snarkjs)   │  │   (encrypted)   │ │  │
│  │  └────────────────┘  └───────┬───────┘  └─────────────────┘ │  │
│  └───────────────────────────────────┼──────────────────────────┘  │
└──────────────────────────────────────┼───────────────────────────────┘
                                       │ Proof Submission
                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Blockchain Layer                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    ZKTCore (Base Sepolia)                      │  │
│  │  submitShariaReviewProof() → verifyAndValidate()              │  │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

### Private Key Storage
- ✅ Private keys stored in Phala encrypted secrets
- ✅ Never exposed in environment variables
- ✅ Rotate keys periodically: `phala secrets rotate PRIVATE_KEY`

### TEE Verification
- ✅ Phala provides attestation that code runs in genuine TEE
- ✅ Verify attestation before trusting coordinator

### Council Authentication
- ✅ Supabase Auth for council member access control
- ✅ RLS policies ensure only active members can vote
- ✅ Double-voting prevented via database constraints

---

## Cost Estimates

| Service | Monthly Cost |
|---------|--------------|
| Phala Cloud (TEE) | ~$20-50 |
| Supabase Pro | $25/month |
| Alchemy RPC | Free tier |
| **Total** | ~$45-75/month |

---

## Troubleshooting

### Coordinator Not Starting
```bash
phala logs sharia-zk-coordinator --tail 100
```

### Proof Generation Failing
- Check circuit files are uploaded
- Verify WASM and zkey paths in environment
- Check memory allocation in Phala config

### Supabase Edge Function Errors
```bash
supabase functions logs vote --tail 100
```

### Database Connection Issues
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Check RLS policies allow access

---

## References

- [Phala Cloud Documentation](https://docs.phala.network)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Base Sepolia Faucet](https://sepoliafaucet.com)
