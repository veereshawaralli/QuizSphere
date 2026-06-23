// Resolves a student's USN to their account email.
// Public on purpose (called from the login page before sign-in), but only
// returns the email — no other PII — and does so via a SECURITY DEFINER
// helper in the private schema.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminClient, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { usn } = await req.json();
    if (typeof usn !== "string" || !usn.trim()) {
      return new Response(JSON.stringify({ error: "usn is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service-role client can reach the private schema helper.
    const admin = adminClient();
    const { data, error } = await admin.schema("private").rpc("get_email_by_usn", { _usn: usn.trim() });
    if (error) throw error;

    return new Response(JSON.stringify({ email: data ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("resolve-usn-email error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});