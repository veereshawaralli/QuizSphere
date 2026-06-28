// Creates or returns the verified certificate record for a submitted quiz.
// This keeps certificate QR creation server-side so missing client table grants
// can never produce a blank QR again.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminClient, corsHeaders, requireRole, requireUser } from "../_shared/auth.ts";

interface EnsureCertificateBody {
  submissionId: string;
  quizId: string;
  studentName?: string;
  quizTitle?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;

  try {
    const body = (await req.json()) as EnsureCertificateBody;
    if (!body?.submissionId || !body?.quizId) {
      return new Response(JSON.stringify({ error: "submissionId and quizId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = adminClient();

    const { data: existing, error: existingError } = await admin
      .from("certificates")
      .select("id")
      .eq("submission_id", body.submissionId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing?.id) {
      return new Response(JSON.stringify({ certificateId: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: submission, error: submissionError } = await admin
      .from("quiz_submissions")
      .select("id, quiz_id, student_id, score, total_marks, is_submitted")
      .eq("id", body.submissionId)
      .maybeSingle();
    if (submissionError) throw submissionError;
    if (!submission || !submission.is_submitted || submission.quiz_id !== body.quizId) {
      return new Response(JSON.stringify({ error: "Submitted quiz result not found" }), {
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

    const { data: quiz, error: quizError } = await admin
      .from("quizzes")
      .select("title")
      .eq("id", submission.quiz_id)
      .maybeSingle();
    if (quizError) throw quizError;

    const score = Number(submission.score ?? 0);
    const totalMarks = Number(submission.total_marks ?? 0);
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

    if (percentage < 70) {
      return new Response(JSON.stringify({ error: "Certificate eligibility not met" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fallbackName = auth.user.user_metadata?.full_name || auth.user.email?.split("@")[0] || "Student";
    const { data: created, error: createError } = await admin
      .from("certificates")
      .insert({
        student_id: submission.student_id,
        submission_id: submission.id,
        quiz_id: submission.quiz_id,
        student_name: body.studentName?.trim() || fallbackName,
        quiz_title: quiz?.title || body.quizTitle?.trim() || "Quiz",
        score,
        total_marks: totalMarks,
        percentage,
      })
      .select("id")
      .single();
    if (createError) throw createError;

    return new Response(JSON.stringify({ certificateId: created.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ensure-certificate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});