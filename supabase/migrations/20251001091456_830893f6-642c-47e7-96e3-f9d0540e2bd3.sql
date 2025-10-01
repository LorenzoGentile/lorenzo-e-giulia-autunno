-- Remove outbound_time column from shuttle_preferences
ALTER TABLE shuttle_preferences DROP COLUMN IF EXISTS outbound_time;

-- Change return_time from time to text to store predefined time slots
ALTER TABLE shuttle_preferences DROP COLUMN IF EXISTS return_time;
ALTER TABLE shuttle_preferences ADD COLUMN return_time text;