-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule send-scheduled-notifications to run every minute
SELECT cron.schedule(
  'invoke-send-scheduled-notifications',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
        url:='https://hfjtzmnphyizntcjzgar.supabase.co/functions/v1/send-scheduled-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmanR6bW5waHlpem50Y2p6Z2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjUwNTEsImV4cCI6MjA2NTk0MTA1MX0.A85BzxnW8IyUPAHblGkmEr6SsJnx94OVBt-pB-9GmDg"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);