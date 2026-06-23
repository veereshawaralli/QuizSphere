// Returns each question for a submitted attempt together with the student's
// chosen answer and the correct answer. Only the owning student (after they
// submitted) or a faculty/admin reviewer can access it.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminClient, corsHeaders, requireRole, requireUser } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;

  try {
    const { submissionId } = await req.json();
    if (typeof submissionId !== "string" || !submissionId) {
      return new Response(JSON.stringify({ error: "submissionId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = adminClient();
    const { data: submission, error: subErr } = await admin
      .from("quiz_submissions")
      .select("id, quiz_id, student_id, is_submitted")
      .eq("id", submissionId)
      .maybeSingle();
    if (subErr) throw subErr;
    if (!submission || !submission.is_submitted) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isOwner = submission.student_id === auth.user.id;
    const isStaff = await requireRole(auth.user.id, ["faculty", "admin"]);
    if (!isOwner && !isStaff) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: questions, error: qErr }, { data: answers, error: aErr }] = await Promise.all([
      admin
        .from("questions")
        .select("id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, sort_order")
        .eq("quiz_id", submission.quiz_id)
        .order("sort_order", { ascending: true }),
      admin
        .from("student_answers")
        .select("question_id, selected_option, is_correct")
        .eq("submission_id", submissionId),
    ]);
    if (qErr) throw qErr;
    if (aErr) throw aErr;

    const ansMap = new Map((answers ?? []).map((a: any) => [a.question_id, a]));
    const merged = (questions ?? []).map((q: any) => {
      const a = ansMap.get(q.id);
      return {
        ...q,
        selected_option: a?.selected_option ?? null,
        is_correct: a?.is_correct ?? false,
      };
    });

    return new Response(JSON.stringify({ questions: merged }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("quiz-review error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});