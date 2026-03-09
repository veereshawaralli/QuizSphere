-- Create a function to get all users with their emails (admin only)
CREATE OR REPLACE FUNCTION public.get_users_with_emails()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  role app_role,
  role_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    ur.user_id,
    au.email::text,
    p.full_name,
    ur.role,
    ur.id as role_id
  FROM public.user_roles ur
  LEFT JOIN public.profiles p ON p.user_id = ur.user_id
  LEFT JOIN auth.users au ON au.id = ur.user_id
  ORDER BY p.full_name;
END;
$$;