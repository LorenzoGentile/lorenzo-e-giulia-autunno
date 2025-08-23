-- Add admin policies for additional_guests table to allow RSVP management
CREATE POLICY "Admins can manage all additional guests" 
ON public.additional_guests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Also ensure admins can manage all RSVP responses (might be missing)
DROP POLICY IF EXISTS "Admins can manage all RSVP responses" ON public.rsvp_responses;
CREATE POLICY "Admins can manage all RSVP responses" 
ON public.rsvp_responses 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));