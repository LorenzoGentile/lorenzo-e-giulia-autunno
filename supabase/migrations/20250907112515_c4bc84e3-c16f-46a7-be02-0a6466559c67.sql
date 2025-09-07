-- Drop the problematic policy that references auth.users table
DROP POLICY IF EXISTS "Admin can manage all invited guests" ON public.invited_guests;

-- The existing "Admins can manage invited guests" policy should be sufficient
-- as it uses the has_role function which doesn't reference auth.users directly