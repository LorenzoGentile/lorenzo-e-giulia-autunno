
-- Create an enum for user roles (skip if exists)
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table to manage admin access
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Drop existing policies that might conflict and recreate them
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Add missing RLS policies for existing tables
-- RLS for additional_guests
ALTER TABLE public.additional_guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view additional guests for their RSVPs" ON public.additional_guests;
DROP POLICY IF EXISTS "Users can manage additional guests for their RSVPs" ON public.additional_guests;

CREATE POLICY "Users can view additional guests for their RSVPs"
  ON public.additional_guests
  FOR SELECT
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
  USING (
    EXISTS (
      SELECT 1 FROM public.rsvp_responses r
      JOIN public.invited_guests g ON r.guest_id = g.id
      WHERE r.id = rsvp_id AND g.email = auth.jwt() ->> 'email'
    )
  );

-- RLS for wedding_photos
ALTER TABLE public.wedding_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view all wedding photos" ON public.wedding_photos;
DROP POLICY IF EXISTS "Invited guests can upload wedding photos" ON public.wedding_photos;
DROP POLICY IF EXISTS "Users can manage their own uploaded photos" ON public.wedding_photos;

CREATE POLICY "Authenticated users can view all wedding photos"
  ON public.wedding_photos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Invited guests can upload wedding photos"
  ON public.wedding_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invited_guests
      WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can manage their own uploaded photos"
  ON public.wedding_photos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invited_guests
      WHERE id = guest_id AND email = auth.jwt() ->> 'email'
    )
  );

-- RLS for invited_guests (read-only for users)
ALTER TABLE public.invited_guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own guest info" ON public.invited_guests;
DROP POLICY IF EXISTS "Admins can manage invited guests" ON public.invited_guests;

CREATE POLICY "Users can view their own guest info"
  ON public.invited_guests
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Admins can manage invited guests"
  ON public.invited_guests
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS for rsvp_responses
ALTER TABLE public.rsvp_responses ENABLE ROW LEVEL SECURITY;

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

-- Create storage bucket for wedding photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('our-photos', 'our-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Add storage policies for wedding photos bucket
DROP POLICY IF EXISTS "Authenticated users can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Invited guests can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own uploaded photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all photos" ON storage.objects;

CREATE POLICY "Authenticated users can view photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'our-photos');

CREATE POLICY "Invited guests can upload photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'our-photos' AND
    EXISTS (
      SELECT 1 FROM public.invited_guests
      WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can manage their own uploaded photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'our-photos' AND
    owner = auth.uid()
  );

CREATE POLICY "Admins can manage all photos"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'our-photos' AND
    public.has_role(auth.uid(), 'admin')
  );
