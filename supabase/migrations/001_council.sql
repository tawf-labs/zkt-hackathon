-- =====================================================
-- ZK Sharia Council - Supabase Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Council Members Table
-- =====================================================
-- Stores authorized Sharia council members with their authentication details
CREATE TABLE council_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for address lookups
CREATE INDEX idx_members_address ON council_members(address);
CREATE INDEX idx_members_active ON council_members(is_active);

-- =====================================================
-- Council Votes Table
-- =====================================================
-- Public audit trail for council votes (not proof generation data)
CREATE TABLE council_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id BIGINT NOT NULL,
    proposal_id BIGINT NOT NULL,
    voter_address TEXT NOT NULL REFERENCES council_members(address) ON DELETE CASCADE,
    vote INT NOT NULL CHECK (vote IN (0, 1)), -- 0 = reject, 1 = approve
    nullifier TEXT UNIQUE,
    submitted_at TIMESTAMP DEFAULT NOW(),
    proof_submitted BOOLEAN DEFAULT false
);

-- Indexes for vote queries
CREATE INDEX idx_votes_bundle_proposal ON council_votes(bundle_id, proposal_id);
CREATE INDEX idx_votes_voter ON council_votes(voter_address);
CREATE INDEX idx_votes_nullifier ON council_votes(nullifier);
CREATE INDEX idx_votes_submitted ON council_votes(proof_submitted);

-- =====================================================
-- Proof Events Table
-- =====================================================
-- Records when ZK proofs are generated and submitted
CREATE TABLE proof_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id BIGINT NOT NULL,
    proposal_id BIGINT NOT NULL,
    proof_hash TEXT NOT NULL,
    tx_hash TEXT,
    submitted_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed'))
);

-- Indexes for proof queries
CREATE INDEX idx_proofs_bundle ON proof_events(bundle_id);
CREATE INDEX idx_proofs_hash ON proof_events(proof_hash);
CREATE INDEX idx_proofs_tx ON proof_events(tx_hash);
CREATE INDEX idx_proofs_status ON proof_events(status);

-- =====================================================
-- Council Sessions Table
-- =====================================================
-- Tracks council member authentication sessions
CREATE TABLE council_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES council_members(id) ON DELETE CASCADE,
    auth_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for session lookups
CREATE INDEX idx_sessions_token ON council_sessions(auth_token);
CREATE INDEX idx_sessions_member ON council_sessions(member_id);

-- =====================================================
-- Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE council_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies for Council Members
-- =====================================================

-- Public can read active members (for transparency)
CREATE POLICY "Public can read active members"
ON council_members FOR SELECT
USING (is_active = true);

-- Only service role can insert/update members
CREATE POLICY "Service can manage members"
ON council_members FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- RLS Policies for Council Votes
-- =====================================================

-- Authenticated council members can insert their own votes
CREATE POLICY "Council can insert votes"
ON council_votes FOR INSERT
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM council_members WHERE is_active = true AND address = council_votes.voter_address
    )
);

-- Public can read votes (transparent audit trail)
CREATE POLICY "Public can read votes"
ON council_votes FOR SELECT
USING (true);

-- =====================================================
-- RLS Policies for Proof Events
-- =====================================================

-- Public can read proof events (transparency)
CREATE POLICY "Public can read proofs"
ON proof_events FOR SELECT
USING (true);

-- Only service role can insert proof events
CREATE POLICY "Service can insert proofs"
ON proof_events FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- RLS Policies for Sessions
-- =====================================================

-- Service role can manage sessions
CREATE POLICY "Service can manage sessions"
ON council_sessions FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Update updated_at timestamp on council_members
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_council_members_updated_at
BEFORE UPDATE ON council_members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to check if a member has voted on a proposal
CREATE OR REPLACE FUNCTION has_voted_on_proposal(
    p_voter_address TEXT,
    p_bundle_id BIGINT,
    p_proposal_id BIGINT
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM council_votes
        WHERE voter_address = p_voter_address
        AND bundle_id = p_bundle_id
        AND proposal_id = p_proposal_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Views for Common Queries
-- =====================================================

-- Vote summary view per proposal
CREATE OR REPLACE VIEW vote_summary AS
SELECT
    bundle_id,
    proposal_id,
    COUNT(*) FILTER (WHERE vote = 1) AS approvals,
    COUNT(*) FILTER (WHERE vote = 0) AS rejections,
    COUNT(*) AS total_votes
FROM council_votes
GROUP BY bundle_id, proposal_id;

-- Active council members view
CREATE OR REPLACE VIEW active_council AS
SELECT
    address,
    name,
    joined_at
FROM council_members
WHERE is_active = true
ORDER BY joined_at;
