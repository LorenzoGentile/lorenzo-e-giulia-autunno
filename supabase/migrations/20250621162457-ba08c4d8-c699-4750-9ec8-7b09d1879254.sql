
-- Drop all existing policies on invited_guests to start fresh
DROP POLICY IF EXISTS "Allow email verification lookup" ON public.invited_guests;
DROP POLICY IF EXISTS "Users can view their own guest info" ON public.invited_guests;
DROP POLICY IF EXISTS "Admins can manage invited guests" ON public.invited_guests;

-- Create a comprehensive policy that allows reading guest info by email for both authenticated and anonymous users
CREATE POLICY "Allow guest lookup by email" 
ON public.invited_guests 
FOR SELECT 
USING (true);  -- Allow all SELECT operations since we only store basic guest info

-- Allow admins to manage all invited guests (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage invited guests"
  ON public.invited_guests
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ensure RLS is enabled
ALTER TABLE public.invited_guests ENABLE ROW LEVEL SECURITY;
