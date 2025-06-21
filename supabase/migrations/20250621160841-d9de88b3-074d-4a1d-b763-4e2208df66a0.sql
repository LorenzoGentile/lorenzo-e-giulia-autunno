
-- First, let's drop the existing problematic policies
DROP POLICY IF EXISTS "Users can view their own guest info" ON public.invited_guests;
DROP POLICY IF EXISTS "Admins can manage invited guests" ON public.invited_guests;

-- Recreate the policies with corrected logic
-- Allow users to view their own guest information by email
CREATE POLICY "Users can view their own guest info"
  ON public.invited_guests
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Allow admins to manage all invited guests
CREATE POLICY "Admins can manage invited guests"
  ON public.invited_guests
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Also fix the other tables that might have similar issues
-- Fix the RLS policies for rsvp_responses
DROP POLICY IF EXISTS "Users can view their own RSVP responses" ON public.rsvp_responses;
DROP POLICY IF EXISTS "Users can manage their own RSVP responses" ON public.rsvp_responses;
DROP POLICY IF EXISTS "Admins can view all RSVP responses" ON public.rsvp_responses;

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

CREATE POLICY "Admins can view all RSVP responses"
  ON public.rsvp_responses
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix additional_guests policies
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
