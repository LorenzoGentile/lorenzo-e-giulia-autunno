-- Add reminder tracking to track when reminders are sent
ALTER TABLE rsvp_responses 
ADD COLUMN reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- Add reminder count to track how many reminders sent
ALTER TABLE rsvp_responses 
ADD COLUMN reminder_count INTEGER DEFAULT 0;