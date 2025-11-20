-- Enable realtime for system_notifications table
ALTER TABLE system_notifications REPLICA IDENTITY FULL;

-- Add table to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'system_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE system_notifications;
  END IF;
END $$;