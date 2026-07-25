CREATE TABLE IF NOT EXISTS public.notification_daily_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL,
  lock_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_type, lock_date)
);

GRANT ALL ON public.notification_daily_locks TO service_role;

ALTER TABLE public.notification_daily_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages daily locks"
  ON public.notification_daily_locks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);