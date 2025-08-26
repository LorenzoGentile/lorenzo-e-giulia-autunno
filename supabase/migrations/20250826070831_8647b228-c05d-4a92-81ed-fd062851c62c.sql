-- Add reminder tracking columns to invited_guests table
ALTER TABLE public.invited_guests 
ADD COLUMN reminder_count integer DEFAULT 0,
ADD COLUMN reminder_sent_at timestamp with time zone;