-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the edge function to run every minute to check for scheduled notifications
-- This will call the edge function that checks if any notifications need to be sent
SELECT cron.schedule(
  'send-scheduled-notifications',
  '* * * * *', -- Run every minute
  $$
  SELECT net.http_post(
    url := 'https://hfjtzmnphyizntcjzgar.supabase.co/functions/v1/send-scheduled-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmanR6bW5waHlpem50Y2p6Z2FyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM2NTA1MSwiZXhwIjoyMDY1OTQxMDUxfQ.HCPKiucvv2mmEqRYSjZL-fnh73Ur2gOSGsHqruDqcVo"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  ) AS request_id;
  $$
);