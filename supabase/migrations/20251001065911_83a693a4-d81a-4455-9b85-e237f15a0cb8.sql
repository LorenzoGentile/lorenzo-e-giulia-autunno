-- Create shuttle_preferences table
CREATE TABLE public.shuttle_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID NOT NULL REFERENCES public.invited_guests(id) ON DELETE CASCADE,
  interested BOOLEAN NOT NULL,
  outbound_wanted BOOLEAN DEFAULT false,
  outbound_location TEXT,
  outbound_alternative_location TEXT,
  outbound_time TIME,
  return_wanted BOOLEAN DEFAULT false,
  return_time TIME,
  number_of_people INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(guest_id)
);

-- Enable RLS
ALTER TABLE public.shuttle_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for guests to manage their own preferences
CREATE POLICY "Guests can view their own shuttle preferences"
ON public.shuttle_preferences
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invited_guests
    WHERE invited_guests.id = shuttle_preferences.guest_id
    AND invited_guests.email = auth.email()
  )
);

CREATE POLICY "Guests can insert their own shuttle preferences"
ON public.shuttle_preferences
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invited_guests
    WHERE invited_guests.id = shuttle_preferences.guest_id
    AND invited_guests.email = auth.email()
  )
);

CREATE POLICY "Guests can update their own shuttle preferences"
ON public.shuttle_preferences
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.invited_guests
    WHERE invited_guests.id = shuttle_preferences.guest_id
    AND invited_guests.email = auth.email()
  )
);

-- Admin policies
CREATE POLICY "Admins can view all shuttle preferences"
ON public.shuttle_preferences
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all shuttle preferences"
ON public.shuttle_preferences
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));