// Public certificate verification by ID.
// The certificates table itself is no longer readable by anonymous users;
// this function exposes only the fields needed for the verification card.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminClient, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { certificateId } = await req.json();
    if (typeof certificateId !== "string" || !certificateId) {
      return new Response(JSON.stringify({ error: "certificateId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = adminClient();
    const { data, error } = await admin
      .from("certificates")
      .select("id, student_name, quiz_title, score, total_marks, percentage, issued_at")
      .eq("id", certificateId)
      .maybeSingle();
    if (error) throw error;

    return new Response(JSON.stringify({ certificate: data ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-cert error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});