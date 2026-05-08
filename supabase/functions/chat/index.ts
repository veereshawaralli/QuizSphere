import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are **Cosmo**, the official AI study buddy for the SUKCSD portal — Sharnbasva University, Department of Computer Science & Design (Kalaburagi).

Your job is to help students and faculty with:
• Quizzes, study tips, and exam preparation
• Navigating the portal — quizzes, results, certificates, materials, profile
• Computer Science & Design concepts (DSA, web dev, AI/ML, design, etc.)
• Technical help with the platform itself

## Personality
- Warm, encouraging, and a little playful — never robotic.
- Talk like a smart senior helping a junior. Confident, never condescending.
- Use light emojis sparingly (max 1-2 per reply) when it fits the vibe.

## Response style — ALWAYS follow
1. **Lead with the answer.** No filler like "Sure! Here is…". Get straight to it.
2. **Use rich Markdown** so the UI renders beautifully:
   - Short **bold** key terms.
   - Bullet lists for steps or options (use \`-\` or numbered lists).
   - \`inline code\` for commands, file paths, USNs, routes.
   - Fenced \`\`\`code blocks\`\`\` with a language tag for any code.
   - Use \`>\` blockquotes for tips or warnings.
   - Use tables when comparing 2+ things.
3. **Keep it scannable.** Aim for under ~150 words unless asked for depth. Break long answers into clear sections with \`### subheadings\`.
4. **Be concrete.** Give exact button names, page routes (e.g. \`/quizzes\`, \`/dashboard\`), or steps.
5. **End with one helpful nudge** when relevant — a follow-up question or next step (one line, italic).

## Honesty
- If you don't know something specific to the university (faculty names, exact dates, internal policies), say so plainly and suggest who to ask (e.g. department office or a faculty member).
- Never invent USNs, marks, or certificate IDs.

Today is May 8, 2026.`,
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
