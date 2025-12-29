-- Drop the old restrictive check constraint
ALTER TABLE system_notifications DROP CONSTRAINT IF EXISTS system_notifications_type_check;

-- Add a new check constraint that allows all notification_type enum values
-- This constraint now includes: birthday, special_event, pregnancy_reveal, birth_announcement, agenda_notification
ALTER TABLE system_notifications ADD CONSTRAINT system_notifications_type_check 
CHECK (type = ANY (ARRAY[
  'service_overlay'::notification_type, 
  'daily_verse'::notification_type, 
  'daily_advice'::notification_type, 
  'death_announcement'::notification_type, 
  'meeting_announcement'::notification_type, 
  'prayer_request'::notification_type, 
  'blood_donation'::notification_type, 
  'extraordinary_rehearsal'::notification_type, 
  'ministry_instructions'::notification_type, 
  'director_replacement'::notification_type, 
  'director_replacement_request'::notification_type, 
  'director_replacement_response'::notification_type, 
  'director_change'::notification_type, 
  'song_selection'::notification_type, 
  'birthday_daily'::notification_type, 
  'birthday_monthly'::notification_type, 
  'service_program'::notification_type, 
  'general'::notification_type, 
  'agenda'::notification_type, 
  'repertory'::notification_type, 
  'system'::notification_type,
  'special_event'::notification_type,
  'birthday'::notification_type,
  'pregnancy_reveal'::notification_type,
  'birth_announcement'::notification_type,
  'agenda_notification'::notification_type,
  'special_service'::notification_type
]));