// Server-authoritative quiz scoring.
// The client sends only the chosen options; the score is computed here from
// the (hidden) correct_option column so a student cannot forge a score.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminClient, corsHeaders, requireUser } from "../_shared/auth.ts";

interface SubmitBody {
  quizId: string;
  answers: Record<string, string | null>; // questionId -> "A"|"B"|"C"|"D"|null
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;

  try {
    const body = (await req.json()) as SubmitBody;
    if (!body?.quizId || typeof body.answers !== "object" || body.answers === null) {
      return new Response(JSON.stringify({ error: "quizId and answers are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = adminClient();

    // Load quiz + verify availability window + max_attempts
    const { data: quiz, error: quizErr } = await admin
      .from("quizzes")
      .select("id, is_published, start_time, end_time, max_attempts")
      .eq("id", body.quizId)
      .maybeSingle();
    if (quizErr) throw quizErr;
    if (!quiz || !quiz.is_published) {
      return new Response(JSON.stringify({ error: "Quiz not available" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const now = Date.now();
    if (quiz.start_time && now < new Date(quiz.start_time).getTime()) {
      return new Response(JSON.stringify({ error: "Quiz has not started" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (quiz.end_time && now > new Date(quiz.end_time).getTime()) {
      return new Response(JSON.stringify({ error: "Quiz has ended" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Attempt cap (count previously submitted attempts)
    const { count: prevAttempts, error: countErr } = await admin
      .from("quiz_submissions")
      .select("id", { count: "exact", head: true })
      .eq("quiz_id", body.quizId)
      .eq("student_id", auth.user.id)
      .eq("is_submitted", true);
    if (countErr) throw countErr;
    const maxAttempts = quiz.max_attempts ?? 1;
    if ((prevAttempts ?? 0) >= maxAttempts) {
      return new Response(JSON.stringify({ error: "Maximum attempts reached" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pull the answer key (service role bypasses column-level RLS)
    const { data: questions, error: qErr } = await admin
      .from("questions")
      .select("id, correct_option, marks")
      .eq("quiz_id", body.quizId);
    if (qErr) throw qErr;

    let score = 0;
    let totalMarks = 0;
    const answerRows: Array<{ submission_id: string; question_id: string; selected_option: string | null; is_correct: boolean }> = [];

    // Build the answer + score set (submission_id filled in after we have it).
    const tempRows = (questions ?? []).map((q: any) => {
      const selected = body.answers[q.id] ?? null;
      const isCorrect = selected != null && selected === q.correct_option;
      if (isCorrect) score += q.marks;
      totalMarks += q.marks;
      return { question_id: q.id, selected_option: selected, is_correct: isCorrect };
    });

    // Create the submission with the computed score atomically.
    const { data: submission, error: insErr } = await admin
      .from("quiz_submissions")
      .insert({
        quiz_id: body.quizId,
        student_id: auth.user.id,
        is_submitted: true,
        submitted_at: new Date().toISOString(),
        score,
        total_marks: totalMarks,
      })
      .select("id")
      .single();
    if (insErr) throw insErr;

    for (const row of tempRows) {
      answerRows.push({ submission_id: submission.id, ...row });
    }
    if (answerRows.length > 0) {
      const { error: ansErr } = await admin.from("student_answers").insert(answerRows);
      if (ansErr) throw ansErr;
    }

    return new Response(
      JSON.stringify({ submissionId: submission.id, score, totalMarks }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("submit-quiz error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});