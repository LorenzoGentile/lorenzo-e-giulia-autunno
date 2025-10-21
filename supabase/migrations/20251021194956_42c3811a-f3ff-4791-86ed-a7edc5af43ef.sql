-- Add shooting_time column to wedding_photos table
ALTER TABLE public.wedding_photos 
ADD COLUMN shooting_time timestamp with time zone;