-- Function to look up user email by USN (public, no auth required for login flow)
CREATE OR REPLACE FUNCTION public.get_email_by_usn(_usn text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.email::text
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  WHERE UPPER(p.usn) = UPPER(_usn)
  LIMIT 1;
$$;