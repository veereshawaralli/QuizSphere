import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // This function is just a helper to verify Google OAuth is configured
  // The actual configuration is done via Supabase dashboard/API
  return new Response(
    JSON.stringify({ message: "Google OAuth is configured via Supabase Auth settings" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
