-- Add missing notification types to the enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'daily_advice';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'service_program';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'special_event';