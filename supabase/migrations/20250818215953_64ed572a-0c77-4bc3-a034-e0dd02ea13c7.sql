-- Habilitar las extensiones necesarias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Crear cron job para notificaciones de cumpleaños diarias a las 07:30 AM
SELECT cron.schedule(
  'daily-birthday-notifications',
  '30 7 * * *', -- 07:30 AM todos los días
  $$
  SELECT
    net.http_post(
        url:='https://hfjtzmnphyizntcjzgar.supabase.co/functions/v1/send-daily-birthday-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmanR6bW5waHlpem50Y2p6Z2FyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM2NTA1MSwiZXhwIjoyMDY1OTQxMDUxfQ.mRnPiM4lJZdSN4PJBw8Y66n_XGm7_UB7PQAL-CRZfS4"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Función para procesar notificaciones programadas
CREATE OR REPLACE FUNCTION process_scheduled_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta función será llamada por el cron job para procesar notificaciones programadas
  -- Las notificaciones se crean con scheduled_for y se muestran cuando llega el momento
  UPDATE system_notifications 
  SET scheduled_for = NULL
  WHERE scheduled_for IS NOT NULL 
    AND scheduled_for <= NOW()
    AND recipient_id IS NOT NULL;
END;
$$;

-- Cron job para procesar notificaciones programadas cada minuto
SELECT cron.schedule(
  'process-scheduled-notifications',
  '* * * * *', -- Cada minuto
  $$
  SELECT process_scheduled_notifications();
  $$
);