-- Fix insecure RLS policies on users table
-- Previously allowed any authenticated user to insert/update any record
-- Now properly restricts to only the user's own record

-- Drop the insecure policies
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;

-- Recreate with proper security checks
-- Users can only insert their own record (id must match auth.uid())
CREATE POLICY "Users can insert own record"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Users can only update their own record
CREATE POLICY "Users can update own record"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());



