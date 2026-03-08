
-- Allow faculty/admin to read all profiles (needed for results page)
CREATE POLICY "Faculty can view all profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'faculty')
  OR public.has_role(auth.uid(), 'admin')
);

-- Drop the old restrictive policy
DROP POLICY "Users can view their own profile" ON public.profiles;
