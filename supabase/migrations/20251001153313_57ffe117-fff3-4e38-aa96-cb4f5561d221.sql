-- Add shuttle notification tracking columns to invited_guests table
ALTER TABLE public.invited_guests 
ADD COLUMN shuttle_notification_count integer DEFAULT 0,
ADD COLUMN shuttle_notification_sent_at timestamp with time zone;