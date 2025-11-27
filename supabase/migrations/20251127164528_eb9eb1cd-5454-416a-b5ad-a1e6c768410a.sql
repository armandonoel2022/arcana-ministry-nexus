-- Add new notification types to the enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'death_announcement';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'meeting_announcement';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'special_service';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'prayer_request';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'blood_donation';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'extraordinary_rehearsal';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ministry_instructions';