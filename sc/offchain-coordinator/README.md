# ZK Sharia Council Off-Chain Coordinator

A Docker-based service for aggregating Sharia council votes and generating zero-knowledge proofs for the ZKT protocol.

## Overview

This coordinator:
1. **Receives encrypted votes** from Sharia council members
2. **Aggregates votes** in secure LevelDB storage
3. **Generates Groth16 ZK proofs** using snarkjs when quorum is reached
4. **Optionally submits proofs** to the blockchain

## Architecture

```
Frontend → Supabase Edge Function → Docker Coordinator → Blockchain
                ↓                                  ↓
           PostgreSQL                      snarkjs Proofs
         (Audit Trail)                    (Docker Container)
```

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values
# - RPC_URL: Your Alchemy/Base RPC endpoint
# - PRIVATE_KEY: Wallet private key for proof submission
# - DAO_CONTRACT_ADDRESS: Deployed ZKTCore address

# Start the coordinator
npm run dev

# Or use Docker
docker-compose up
```

### Health Check

```bash
curl http://localhost:3000/health
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Coordinator health status |
| GET | `/council` | Get council membership info |
| POST | `/vote` | Submit a council member vote |
| GET | `/votes/:bundleId/:proposalId` | Get vote status for proposal |
| POST | `/proof/generate` | Manually trigger proof generation |
| POST | `/proof/publish` | Publish proof to blockchain |
| POST | `/council/setup` | Initialize council membership |

### POST /vote

Submit a vote from a council member.

```json
{
  "bundleId": 1,
  "proposalId": 5,
  "voterAddress": "0x...",
  "vote": 1,
  "signature": "0x...",
  "nullifier": "0x..."
}
```

### POST /proof/generate

Manually trigger proof generation.

```json
{
  "bundleId": 1,
  "proposalId": 5
}
```

### POST /proof/publish

Publish a generated proof to blockchain.

```json
{
  "bundleId": 1,
  "proposalId": 5,
  "proof": {...},
  "publicSignals": [...],
  "campaignType": 1
}
```

### POST /council/setup

Setup council membership.

```json
{
  "members": [
    { "address": "0x...", "secret": "..." }
  ]
}
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

### Quick Start with Docker Compose

```bash
# Copy environment file and configure
cp .env.example .env
# Edit .env with your values

# Prepare circuit files
mkdir -p circuits
# Copy ShariaVoteAggregator.wasm, sharia_0000.zkey, verification_key.json to circuits/

# Start with Docker Compose
docker-compose up -d

# Check health
curl http://localhost:3000/health

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Deployment Script

```bash
chmod +x deploy.sh
./deploy.sh
```

### Deploy Supabase Edge Functions

```bash
cd ../supabase
supabase functions deploy vote --no-verify-jwt
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `RPC_URL` | Blockchain RPC endpoint | Required |
| `PRIVATE_KEY` | Wallet private key | Required |
| `DAO_CONTRACT_ADDRESS` | ZKTCore contract address | Required |
| `SHARIA_QUORUM` | Votes needed for approval | `3` |
| `AUTO_PUBLISH` | Auto-submit proofs to chain | `false` |
| `SUPABASE_URL` | Supabase project URL | Optional |
| `SUPABASE_ANON_KEY` | Supabase anon key | Optional |

## Security

- **Docker Isolation**: Runs in isolated Docker containers
- **Secrets Management**: Private keys stored in environment variables
- **RLS Policies**: Only active council members can vote
- **Double Voting Prevention**: Database constraints prevent duplicates

## Data Storage

- **Votes**: Stored in LevelDB (`data/votes/`)
- **Audit Trail**: Mirrored to Supabase PostgreSQL
- **Proofs**: Generated on-demand with snarkjs

## Circuit Files

The coordinator requires compiled circuit files:

```
../../circuits/build/ShariaVoteAggregator_js/ShariaVoteAggregator.wasm
../../circuits/build/sharia_0000.zkey
../../circuits/build/verification_key.json
```

See [circuits/README.md](../../circuits/README.md) for compilation instructions.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start coordinator |
| `npm run dev` | Start with file watching |
| `npm run generate-proof` | Generate proof manually |
| `npm run verify-proof` | Verify a proof |
| `npm run setup-council` | Initialize council |

## Production Deployment

For production, consider:

1. **Use secure key management** (AWS KMS, HashiCorp Vault)
2. **Enable monitoring** (Prometheus, Grafana, or cloud provider metrics)
3. **Set up nginx reverse proxy** with HTTPS (Let's Encrypt)
4. **Use production RPC** with failover (Alchemy, Infura)
5. **Implement rate limiting** (via API gateway or nginx)
6. **Configure systemd service** for auto-restart on boot
7. **Regular security updates** for Docker images and dependencies

## Circuit Compilation

1. Compile the circuit:
```bash
cd circuits
npm install
npm run build
```

2. Generate production verifier:
```bash
snarkjs zkey export solidityverifier build/sharia_0000.zkey ../sc/src/DAO/verifiers/Groth16Verifier.sol
```

3. Run trusted setup ceremony (for production)

4. Deploy and test

## Troubleshooting

### Coordinator not starting
```bash
# Check logs
npm run dev 2>&1 | tee logs/error.log

# Verify environment
cat .env
```

### Proof generation failing
- Verify circuit files exist
- Check memory allocation (min 512MB)
- Review circuit configuration

### Database errors
```bash
# Clear LevelDB
rm -rf data/votes
npm start
```

## Cost Estimates

| Service | Monthly Cost |
|---------|--------------|
| VPS (DigitalOcean, Hetzner, etc.) | ~$5-20 |
| Supabase Pro | $25/month (or free tier for dev) |
| **Total** | ~$30-45/month |

## Security Considerations

1. **Council Membership**: The council root should be updated via governance
2. **Nullifier Tracking**: Prevents double-voting
3. **Proof Replay Protection**: On-chain contract tracks used proof commitments
4. **Trusted Setup**: Phase 2 ceremony required for production

## License

MIT
