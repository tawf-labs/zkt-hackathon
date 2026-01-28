/**
 * Supabase Edge Function: Vote Submission
 *
 * This function:
 * 1. Validates the authenticated council member
 * 2. Forwards the vote to the Phala TEE coordinator
 * 3. Records proof events when quorum is reached
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Environment variables (set in Supabase dashboard)
const PHALA_COORDINATOR_URL = Deno.env.get("PHALA_COORDINATOR_URL") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface VoteRequest {
  bundleId: number;
  proposalId: number;
  vote: 0 | 1;
  signature: string;
  nullifier?: string;
}

interface VoteResponse {
  success: boolean;
  quorumReached?: boolean;
  proof?: any;
  proofHash?: string;
  txHash?: string;
  voteCount?: { approvals: number; rejections: number; total: number };
  quorum?: number;
  error?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-council-address",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    const councilAddress = req.headers.get("X-Council-Address");

    if (!authHeader || !councilAddress) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing auth header or council address" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { bundleId, proposalId, vote, signature, nullifier }: VoteRequest = await req.json();

    // Validate inputs
    if (typeof bundleId !== "number" || typeof proposalId !== "number") {
      return new Response(JSON.stringify({ error: "Invalid bundleId or proposalId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (vote !== 0 && vote !== 1) {
      return new Response(JSON.stringify({ error: "Vote must be 0 (reject) or 1 (approve)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify council member is active
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: member, error: memberError } = await supabase
      .from("council_members")
      .select("*")
      .eq("address", councilAddress.toLowerCase())
      .eq("is_active", true)
      .single();

    if (memberError || !member) {
      return new Response(JSON.stringify({ error: "Not an active council member" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check for double voting
    const { data: existingVote } = await supabase
      .from("council_votes")
      .select("*")
      .eq("bundle_id", bundleId)
      .eq("proposal_id", proposalId)
      .eq("voter_address", councilAddress.toLowerCase())
      .maybeSingle();

    if (existingVote) {
      return new Response(JSON.stringify({ error: "Already voted on this proposal" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Forward to Phala coordinator
    const coordinatorUrl = PHALA_COORDINATOR_URL || Deno.env.get("PHALA_COORDINATOR_URL");
    if (!coordinatorUrl) {
      throw new Error("Coordinator URL not configured");
    }

    const response = await fetch(`${coordinatorUrl}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bundleId,
        proposalId,
        voterAddress: councilAddress,
        vote,
        signature,
        nullifier
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `Coordinator error: ${errorText}` }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data: VoteResponse = await response.json();

    // Record the vote in Supabase (for audit trail)
    await supabase.from("council_votes").insert({
      bundle_id: bundleId,
      proposal_id: proposalId,
      voter_address: councilAddress.toLowerCase(),
      vote,
      nullifier,
      proof_submitted: data.quorumReached || false,
    });

    // If quorum reached and proof generated, record the proof event
    if (data.quorumReached && data.proofHash) {
      await supabase.from("proof_events").insert({
        bundle_id: bundleId,
        proposal_id: proposalId,
        proof_hash: data.proofHash,
        tx_hash: data.txHash,
        status: data.txHash ? "pending" : "pending",
      });
    }

    // Return response
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Vote submission error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
