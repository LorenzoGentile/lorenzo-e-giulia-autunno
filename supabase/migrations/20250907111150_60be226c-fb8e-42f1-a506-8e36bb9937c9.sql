-- Add unique constraint to prevent multiple RSVP responses per guest
ALTER TABLE rsvp_responses 
ADD CONSTRAINT unique_guest_rsvp UNIQUE (guest_id);

-- Create index for better performance on guest_id lookups
CREATE INDEX IF NOT EXISTS idx_rsvp_responses_guest_id ON rsvp_responses(guest_id);