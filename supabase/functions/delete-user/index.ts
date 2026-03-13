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

    // Check admin role using service role client to bypass RLS
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    const { data: roleData } = await adminClient
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

    console.log(`Deleting user ${user_id}...`);

    // Delete auth account first to immediately revoke login capability
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(user_id);

    if (deleteAuthError) {
      console.error("Error deleting auth user:", deleteAuthError);
      return new Response(JSON.stringify({ error: `Failed to delete auth account: ${deleteAuthError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify auth account is actually gone (prevents false positive success)
    const { data: authLookup } = await adminClient.auth.admin.getUserById(user_id);
    if (authLookup?.user) {
      console.error("Auth account still exists after delete attempt", { user_id });
      return new Response(JSON.stringify({ error: "Failed to fully remove auth account. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Auth user deleted. Cleaning up related data...`);

    // 1. Delete student_answers (references quiz_submissions)
    const { data: submissions, error: submissionsError } = await adminClient
      .from("quiz_submissions")
      .select("id")
      .eq("student_id", user_id);

    if (submissionsError) throw submissionsError;

    if (submissions && submissions.length > 0) {
      const submissionIds = submissions.map((s: any) => s.id);
      const { error: answersError } = await adminClient.from("student_answers").delete().in("submission_id", submissionIds);
      if (answersError) throw answersError;
    }

    // 2. Delete certificates
    const { error: certificatesError } = await adminClient.from("certificates").delete().eq("student_id", user_id);
    if (certificatesError) throw certificatesError;

    // 3. Delete quiz_submissions
    const { error: submissionsDeleteError } = await adminClient.from("quiz_submissions").delete().eq("student_id", user_id);
    if (submissionsDeleteError) throw submissionsDeleteError;

    // 4. Delete questions for quizzes created by this user
    const { data: userQuizzes, error: userQuizzesError } = await adminClient
      .from("quizzes")
      .select("id")
      .eq("created_by", user_id);

    if (userQuizzesError) throw userQuizzesError;

    if (userQuizzes && userQuizzes.length > 0) {
      const quizIds = userQuizzes.map((q: any) => q.id);
      const { error: questionsDeleteError } = await adminClient.from("questions").delete().in("quiz_id", quizIds);
      if (questionsDeleteError) throw questionsDeleteError;
    }

    // 5. Delete quizzes created by this user
    const { error: quizzesDeleteError } = await adminClient.from("quizzes").delete().eq("created_by", user_id);
    if (quizzesDeleteError) throw quizzesDeleteError;

    // 6. Delete materials uploaded by this user
    const { error: materialsDeleteError } = await adminClient.from("materials").delete().eq("uploaded_by", user_id);
    if (materialsDeleteError) throw materialsDeleteError;

    // 7. Delete user_roles and profiles
    const { error: userRolesDeleteError } = await adminClient.from("user_roles").delete().eq("user_id", user_id);
    if (userRolesDeleteError) throw userRolesDeleteError;

    const { error: profilesDeleteError } = await adminClient.from("profiles").delete().eq("user_id", user_id);
    if (profilesDeleteError) throw profilesDeleteError;

    console.log(`User ${user_id} fully deleted.`);

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
