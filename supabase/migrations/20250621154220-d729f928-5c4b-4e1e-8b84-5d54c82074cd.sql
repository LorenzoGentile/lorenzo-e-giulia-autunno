
-- Create a table for photo reactions (hearts/likes)
CREATE TABLE public.photo_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES public.wedding_photos(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES public.invited_guests(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT 'heart',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(photo_id, guest_id, reaction_type)
);

-- Create a table for photo comments
CREATE TABLE public.photo_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES public.wedding_photos(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES public.invited_guests(id) ON DELETE CASCADE NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.photo_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for photo_reactions
CREATE POLICY "Anyone can view photo reactions"
  ON public.photo_reactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Invited guests can add reactions"
  ON public.photo_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invited_guests
      WHERE id = guest_id AND email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can remove their own reactions"
  ON public.photo_reactions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invited_guests
      WHERE id = guest_id AND email = auth.jwt() ->> 'email'
    )
  );

-- RLS policies for photo_comments
CREATE POLICY "Anyone can view photo comments"
  ON public.photo_comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Invited guests can add comments"
  ON public.photo_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invited_guests
      WHERE id = guest_id AND email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can manage their own comments"
  ON public.photo_comments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invited_guests
      WHERE id = guest_id AND email = auth.jwt() ->> 'email'
    )
  );

-- Add an index for better performance on photo reactions and comments
CREATE INDEX idx_photo_reactions_photo_id ON public.photo_reactions(photo_id);
CREATE INDEX idx_photo_comments_photo_id ON public.photo_comments(photo_id);
