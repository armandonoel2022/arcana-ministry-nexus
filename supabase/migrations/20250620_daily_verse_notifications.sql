
-- Habilitar las extensiones necesarias para cron y notificaciones
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Programar la ejecución diaria de notificaciones a las 9:00 AM (UTC-6 = 15:00 UTC)
SELECT cron.schedule(
  'daily-verse-notification',
  '0 15 * * *', -- 9:00 AM hora local (UTC-6)
  $$
  SELECT
    net.http_post(
        url := 'https://hfjtzmnphyizntcjzgar.supabase.co/functions/v1/send-daily-verse-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmanR6bW5waHlpem50Y2p6Z2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjUwNTEsImV4cCI6MjA2NTk0MTA1MX0.A85BzxnW8IyUPAHblGkmEr6SsJnx94OVBt-pB-9GmDg"}'::jsonb,
        body := '{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Verificar que el cron job se creó correctamente
SELECT * FROM cron.job WHERE jobname = 'daily-verse-notification';
