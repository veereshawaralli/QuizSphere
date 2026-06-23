// Returns the full question rows (including the correct_option answer key)
// for a quiz — used by the quiz editor. Restricted to the quiz owner or admin.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminClient, corsHeaders, requireRole, requireUser } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;

  try {
    const { quizId } = await req.json();
    if (typeof quizId !== "string" || !quizId) {
      return new Response(JSON.stringify({ error: "quizId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = adminClient();

    // Ownership / role check
    const { data: quiz, error: quizErr } = await admin
      .from("quizzes")
      .select("id, created_by")
      .eq("id", quizId)
      .maybeSingle();
    if (quizErr) throw quizErr;
    if (!quiz) {
      return new Response(JSON.stringify({ error: "Quiz not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isOwner = quiz.created_by === auth.user.id;
    const isAdmin = await requireRole(auth.user.id, ["admin"]);
    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: questions, error } = await admin
      .from("questions")
      .select("id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, sort_order, created_at")
      .eq("quiz_id", quizId)
      .order("sort_order", { ascending: true });
    if (error) throw error;

    return new Response(JSON.stringify({ questions: questions ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-quiz-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});