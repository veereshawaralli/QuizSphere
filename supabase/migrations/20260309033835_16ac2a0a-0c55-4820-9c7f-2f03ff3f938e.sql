
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.quiz_submissions(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  quiz_title TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(submission_id)
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Anyone can view certificates (for public verification)
CREATE POLICY "Anyone can view certificates"
ON public.certificates
FOR SELECT
USING (true);

-- Students can insert their own certificates
CREATE POLICY "Students can insert own certificates"
ON public.certificates
FOR INSERT
WITH CHECK (student_id = auth.uid());
