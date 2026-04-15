-- Create a function to allow admins to reset user passwords
-- This will be called from an edge function with service role
CREATE OR REPLACE FUNCTION public.admin_reset_password(target_user_id uuid, new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- This function exists as a marker - actual password reset 
    -- will be done via service role in edge function
    -- We just verify admin permission here
    IF NOT has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Only admins can reset passwords';
    END IF;
    
    RETURN true;
END;
$$;