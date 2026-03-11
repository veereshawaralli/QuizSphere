import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await callerClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (!roleData || roleData.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent self-deletion
    if (user_id === caller.id) {
      return new Response(JSON.stringify({ error: "Cannot delete yourself" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client to delete user data and auth entry
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Delete all related data in correct order (respecting foreign keys)
    // 1. Delete student_answers (references quiz_submissions)
    const { data: submissions } = await adminClient
      .from("quiz_submissions")
      .select("id")
      .eq("student_id", user_id);
    
    if (submissions && submissions.length > 0) {
      const submissionIds = submissions.map((s: any) => s.id);
      await adminClient.from("student_answers").delete().in("submission_id", submissionIds);
    }

    // 2. Delete certificates (references quiz_submissions and quizzes)
    await adminClient.from("certificates").delete().eq("student_id", user_id);

    // 3. Delete quiz_submissions
    await adminClient.from("quiz_submissions").delete().eq("student_id", user_id);

    // 4. Delete questions for quizzes created by this user
    const { data: userQuizzes } = await adminClient
      .from("quizzes")
      .select("id")
      .eq("created_by", user_id);
    
    if (userQuizzes && userQuizzes.length > 0) {
      const quizIds = userQuizzes.map((q: any) => q.id);
      await adminClient.from("questions").delete().in("quiz_id", quizIds);
    }

    // 5. Delete quizzes created by this user
    await adminClient.from("quizzes").delete().eq("created_by", user_id);

    // 6. Delete materials uploaded by this user
    await adminClient.from("materials").delete().eq("uploaded_by", user_id);

    // 7. Delete user_roles and profiles
    await adminClient.from("user_roles").delete().eq("user_id", user_id);
    await adminClient.from("profiles").delete().eq("user_id", user_id);
    // Delete from auth.users - this fully removes the user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("delete-user error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
