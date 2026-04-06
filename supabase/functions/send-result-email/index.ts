import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId, studentEmail, studentName, quizTitle, score, totalMarks, percentage } = await req.json();

    if (!studentEmail || !quizTitle) {
      throw new Error("Missing required fields: studentEmail, quizTitle");
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const passed = percentage >= 50;
    const status = passed ? "PASSED ✅" : "FAILED ❌";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CSD Quiz Portal <onboarding@resend.dev>",
        to: [studentEmail],
        subject: `Quiz Result: ${quizTitle} - ${status}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Space Grotesk', 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f0f2f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, hsl(235, 45%, 28%) 0%, hsl(235, 45%, 38%) 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <img src="https://egcahlohmpfkgdouxcdj.supabase.co/storage/v1/object/public/email-assets/university-logo.png" alt="Sharnbasva University Logo" style="height: 70px; width: 70px; object-fit: contain; margin-bottom: 12px; border-radius: 8px; background: white; padding: 4px;" />
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-family: 'DM Serif Display', Georgia, serif;">Sharnbasva University</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0 0; font-size: 13px; letter-spacing: 0.5px;">Department of Computer Science &amp; Design</p>
                <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0 0; font-size: 12px;">CSD Quiz &amp; Learning Portal</p>
              </div>
              
              <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: hsl(235, 45%, 28%); margin: 0 0 20px 0; font-family: 'DM Serif Display', Georgia, serif;">Hello ${studentName || 'Student'},</h2>
                
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                  Your quiz submission has been evaluated. Here are your results:
                </p>
                
                <div style="background-color: ${passed ? '#e8f5e9' : '#ffebee'}; border-left: 4px solid ${passed ? '#2ea97d' : '#e53935'}; padding: 20px; margin: 20px 0; border-radius: 4px;">
                  <h3 style="color: hsl(235, 45%, 28%); margin: 0 0 15px 0;">${quizTitle}</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Score:</td>
                      <td style="padding: 8px 0; color: hsl(235, 45%, 28%); font-weight: bold; text-align: right;">${score} / ${totalMarks}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Percentage:</td>
                      <td style="padding: 8px 0; color: hsl(235, 45%, 28%); font-weight: bold; text-align: right;">${percentage.toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Status:</td>
                      <td style="padding: 8px 0; font-weight: bold; text-align: right; color: ${passed ? '#2ea97d' : '#e53935'};">${passed ? 'PASSED' : 'FAILED'}</td>
                    </tr>
                  </table>
                </div>
                
                <p style="color: #555; font-size: 14px; line-height: 1.6;">
                  ${passed 
                    ? 'Congratulations on passing the quiz! Keep up the good work.' 
                    : 'Don\'t worry, keep studying and you\'ll do better next time!'}
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
                
                <div style="text-align: center;">
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    Department of Computer Science &amp; Design<br>
                    Sharnbasva University, Kalaburagi
                  </p>
                  <p style="color: #bbb; font-size: 11px; margin: 8px 0 0 0;">
                    This is an automated email from the CSD Quiz Portal. Please do not reply.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${emailResponse.status} - ${errorData}`);
    }

    const result = await emailResponse.json();
    console.log("Email sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, message: "Result email sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending result email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
