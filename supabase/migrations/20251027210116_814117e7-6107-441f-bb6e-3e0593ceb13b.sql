-- Add director replacement notification types to the enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'director_replacement_request';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'director_replacement_response';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'director_change';