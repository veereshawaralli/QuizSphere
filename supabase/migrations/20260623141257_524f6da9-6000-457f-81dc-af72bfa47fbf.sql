
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.get_email_by_usn(_usn text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT au.email::text FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  WHERE UPPER(p.usn) = UPPER(_usn) LIMIT 1;
$$;
REVOKE ALL ON FUNCTION private.get_email_by_usn(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_email_by_usn(text) TO service_role;

CREATE OR REPLACE FUNCTION private.get_users_with_emails()
RETURNS TABLE(user_id uuid, email text, full_name text, role public.app_role, role_id uuid, usn text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT ur.user_id, au.email::text, p.full_name, ur.role, ur.id AS role_id, p.usn
  FROM public.user_roles ur
  LEFT JOIN public.profiles p ON p.user_id = ur.user_id
  LEFT JOIN auth.users au ON au.id = ur.user_id
  ORDER BY p.full_name;
END;
$$;
REVOKE ALL ON FUNCTION private.get_users_with_emails() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_users_with_emails() TO service_role;

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

DROP POLICY IF EXISTS "Faculty can delete own materials" ON public.materials;
DROP POLICY IF EXISTS "Faculty can upload materials" ON public.materials;
CREATE POLICY "Faculty can delete own materials" ON public.materials
FOR DELETE TO authenticated
USING ((uploaded_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Faculty can upload materials" ON public.materials
FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'faculty'::public.app_role) OR private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Faculty can view all profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Faculty can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'faculty'::public.app_role) OR private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Faculty can add questions" ON public.questions;
DROP POLICY IF EXISTS "Faculty can delete questions" ON public.questions;
DROP POLICY IF EXISTS "Faculty can update questions" ON public.questions;
DROP POLICY IF EXISTS "View questions of accessible quizzes" ON public.questions;
CREATE POLICY "Faculty can add questions" ON public.questions
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes
  WHERE quizzes.id = questions.quiz_id
    AND (quizzes.created_by = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role))));
CREATE POLICY "Faculty can delete questions" ON public.questions
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.quizzes
  WHERE quizzes.id = questions.quiz_id
    AND (quizzes.created_by = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role))));
CREATE POLICY "Faculty can update questions" ON public.questions
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.quizzes
  WHERE quizzes.id = questions.quiz_id
    AND (quizzes.created_by = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role))));
CREATE POLICY "View questions of accessible quizzes" ON public.questions
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.quizzes
  WHERE quizzes.id = questions.quiz_id
    AND (quizzes.is_published = true OR quizzes.created_by = auth.uid()
         OR private.has_role(auth.uid(), 'admin'::public.app_role))));

DROP POLICY IF EXISTS "Students can update own submissions" ON public.quiz_submissions;
DROP POLICY IF EXISTS "View own submissions or faculty/admin" ON public.quiz_submissions;
CREATE POLICY "View own submissions or faculty/admin" ON public.quiz_submissions
FOR SELECT TO authenticated
USING ((student_id = auth.uid())
  OR private.has_role(auth.uid(), 'faculty'::public.app_role)
  OR private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Faculty can create quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Faculty can delete own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Faculty can update own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "View published quizzes" ON public.quizzes;
CREATE POLICY "Faculty can create quizzes" ON public.quizzes
FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'faculty'::public.app_role) OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Faculty can delete own quizzes" ON public.quizzes
FOR DELETE TO authenticated USING ((created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Faculty can update own quizzes" ON public.quizzes
FOR UPDATE TO authenticated USING ((created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "View published quizzes" ON public.quizzes
FOR SELECT TO authenticated
USING ((is_published = true) OR (created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "View own answers" ON public.student_answers;
CREATE POLICY "View own answers" ON public.student_answers
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.quiz_submissions
  WHERE quiz_submissions.id = student_answers.submission_id
    AND (quiz_submissions.student_id = auth.uid()
         OR private.has_role(auth.uid(), 'faculty'::public.app_role)
         OR private.has_role(auth.uid(), 'admin'::public.app_role))));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Faculty can delete materials" ON storage.objects;
DROP POLICY IF EXISTS "Faculty can upload materials" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read materials" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for email assets" ON storage.objects;

CREATE POLICY "Faculty can upload materials"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'materials'
  AND (private.has_role(auth.uid(), 'faculty'::public.app_role)
       OR private.has_role(auth.uid(), 'admin'::public.app_role)));

CREATE POLICY "Faculty can delete materials"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'materials'
  AND (private.has_role(auth.uid(), 'faculty'::public.app_role)
       OR private.has_role(auth.uid(), 'admin'::public.app_role)));

CREATE POLICY "Faculty can update materials"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'materials'
  AND (private.has_role(auth.uid(), 'faculty'::public.app_role)
       OR private.has_role(auth.uid(), 'admin'::public.app_role)))
WITH CHECK (bucket_id = 'materials'
  AND (private.has_role(auth.uid(), 'faculty'::public.app_role)
       OR private.has_role(auth.uid(), 'admin'::public.app_role)));

CREATE POLICY "Authenticated users can read materials"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'materials');

DROP POLICY IF EXISTS "Anyone can view certificates" ON public.certificates;
DROP POLICY IF EXISTS "Students can insert own certificates" ON public.certificates;
CREATE POLICY "Owner or staff can view certificates" ON public.certificates
FOR SELECT TO authenticated
USING ((student_id = auth.uid())
  OR private.has_role(auth.uid(), 'faculty'::public.app_role)
  OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Students insert own certificates" ON public.certificates
FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());
REVOKE ALL ON public.certificates FROM anon;
GRANT SELECT, INSERT ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.get_email_by_usn(text);
DROP FUNCTION IF EXISTS public.get_users_with_emails();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Column-level lockdown on questions.correct_option
REVOKE SELECT ON public.questions FROM anon, authenticated;
GRANT SELECT (id, quiz_id, question_text, option_a, option_b, option_c, option_d, marks, sort_order, created_at)
  ON public.questions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
REVOKE ALL ON public.questions FROM anon;

DROP EXTENSION IF EXISTS pg_graphql CASCADE;
