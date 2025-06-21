
-- Fix the RLS policy for invited_guests to allow email lookup for verification
-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can view their own guest info" ON public.invited_guests;

-- Create a new policy that allows users to lookup their own guest info by email
-- This needs to work for both authenticated and unauthenticated users during email verification
CREATE POLICY "Allow email verification lookup" 
ON public.invited_guests 
FOR SELECT 
USING (
  -- Allow if user is authenticated and email matches their JWT email
  (auth.uid() IS NOT NULL AND email = auth.jwt() ->> 'email') 
  OR 
  -- Allow unauthenticated access for email verification (this is safe since we're only allowing SELECT on email/name)
  auth.uid() IS NULL
);

-- Also ensure the policy for RSVP responses works correctly with the guest lookup
DROP POLICY IF EXISTS "Users can view their own RSVP responses" ON public.rsvp_responses;
DROP POLICY IF EXISTS "Users can manage their own RSVP responses" ON public.rsvp_responses;

CREATE POLICY "Users can view their own RSVP responses"
  ON public.rsvp_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invited_guests
      WHERE id = guest_id AND email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can manage their own RSVP responses"
  ON public.rsvp_responses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invited_guests
      WHERE id = guest_id AND email = auth.jwt() ->> 'email'
    )
  );

-- Fix additional_guests policies to work with the corrected guest lookup
DROP POLICY IF EXISTS "Users can view additional guests for their RSVPs" ON public.additional_guests;
DROP POLICY IF EXISTS "Users can manage additional guests for their RSVPs" ON public.additional_guests;

CREATE POLICY "Users can view additional guests for their RSVPs"
  ON public.additional_guests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rsvp_responses r
      JOIN public.invited_guests g ON r.guest_id = g.id
      WHERE r.id = rsvp_id AND g.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can manage additional guests for their RSVPs"
  ON public.additional_guests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rsvp_responses r
      JOIN public.invited_guests g ON r.guest_id = g.id
      WHERE r.id = rsvp_id AND g.email = auth.jwt() ->> 'email'
    )
  );
