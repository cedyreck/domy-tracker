-- Drop existing policies on domy_relationships to recreate them
DROP POLICY IF EXISTS "Users can update their own relationships" ON public.domy_relationships;
DROP POLICY IF EXISTS "Users can insert their own relationships" ON public.domy_relationships;

-- Allow users to update their own relationships directly
CREATE POLICY "Users can update their own relationships"
ON public.domy_relationships
FOR UPDATE
USING (auth.uid() = player_id);

-- Allow users to insert their own relationships directly  
CREATE POLICY "Users can insert their own relationships"
ON public.domy_relationships
FOR INSERT
WITH CHECK (auth.uid() = player_id);

-- Allow SECURITY DEFINER functions to bypass RLS for system operations
-- This enables update_domy_balance to update both sides of the relationship
CREATE POLICY "System can manage all relationships"
ON public.domy_relationships
FOR ALL
TO authenticated
USING (
  -- Allow if current transaction is running a security definer function
  -- We detect this by checking if the current_setting for role is still 'authenticator'
  current_setting('role', true) = 'authenticator'
  OR auth.uid() = player_id
)
WITH CHECK (
  current_setting('role', true) = 'authenticator'
  OR auth.uid() = player_id
);