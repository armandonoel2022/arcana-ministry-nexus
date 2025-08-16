-- Habilitar extensiones necesarias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Crear cron job para notificaciones mensuales de cumpleaños (día 1 de cada mes a las 7:00 AM)
SELECT cron.schedule(
  'monthly-birthday-notifications',
  '0 7 1 * *', -- A las 7:00 AM del día 1 de cada mes
  $$
  SELECT
    net.http_post(
        url:='https://hfjtzmnphyizntcjzgar.supabase.co/functions/v1/send-monthly-birthday-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmanR6bW5waHlpem50Y2p6Z2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjUwNTEsImV4cCI6MjA2NTk0MTA1MX0.A85BzxnW8IyUPAHblGkmEr6SsJnx94OVBt-pB-9GmDg"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Crear cron job para notificaciones diarias de cumpleaños (todos los días a las 8:00 AM)
SELECT cron.schedule(
  'daily-birthday-notifications',
  '0 8 * * *', -- A las 8:00 AM todos los días
  $$
  SELECT
    net.http_post(
        url:='https://hfjtzmnphyizntcjzgar.supabase.co/functions/v1/send-daily-birthday-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmanR6bW5waHlpem50Y2p6Z2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjUwNTEsImV4cCI6MjA2NTk0MTA1MX0.A85BzxnW8IyUPAHblGkmEr6SsJnx94OVBt-pB-9GmDg"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);