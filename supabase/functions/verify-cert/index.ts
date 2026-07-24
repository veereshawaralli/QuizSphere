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
      .select("id, student_id, quiz_id, submission_id, student_name, quiz_title, score, total_marks, percentage, issued_at")
      .eq("id", certificateId)
      .maybeSingle();
    if (error) throw error;

    let rank: number | null = null;
    let totalParticipants: number | null = null;
    if (data?.quiz_id) {
      const { data: subs } = await admin
        .from("quiz_submissions")
        .select("student_id, score")
        .eq("quiz_id", data.quiz_id);
      if (subs && subs.length) {
        // Best score per student
        const best = new Map<string, number>();
        for (const s of subs as Array<{ student_id: string; score: number }>) {
          const prev = best.get(s.student_id) ?? -Infinity;
          if (s.score > prev) best.set(s.student_id, s.score);
        }
        const ordered = [...best.entries()].sort((a, b) => b[1] - a[1]);
        totalParticipants = ordered.length;
        const idx = ordered.findIndex(([sid]) => sid === data.student_id);
        if (idx >= 0) {
          // Dense-style rank based on score ties
          const myScore = ordered[idx][1];
          rank = ordered.filter(([, sc]) => sc > myScore).length + 1;
        }
      }
    }

    const payload = data
      ? {
          id: data.id,
          student_name: data.student_name,
          quiz_title: data.quiz_title,
          score: data.score,
          total_marks: data.total_marks,
          percentage: data.percentage,
          issued_at: data.issued_at,
          rank,
          total_participants: totalParticipants,
        }
      : null;

    return new Response(JSON.stringify({ certificate: payload }), {
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