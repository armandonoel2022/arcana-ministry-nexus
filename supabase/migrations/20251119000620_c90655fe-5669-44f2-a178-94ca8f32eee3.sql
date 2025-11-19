-- Create scheduled_notifications table if missing (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scheduled_notifications'
  ) THEN
    CREATE TABLE public.scheduled_notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      notification_type text NOT NULL DEFAULT 'service_overlay',
      day_of_week integer NOT NULL,
      time time NOT NULL,
      is_active boolean NOT NULL DEFAULT true,
      target_audience text DEFAULT 'all',
      metadata jsonb DEFAULT '{}'::jsonb,
      created_by uuid,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

    -- Policies
    CREATE POLICY "Administrators can manage scheduled notifications"
      ON public.scheduled_notifications
      FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'administrator'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'administrator'));

    CREATE POLICY "Authenticated users can view scheduled notifications"
      ON public.scheduled_notifications
      FOR SELECT
      USING (auth.uid() IS NOT NULL);

    -- Trigger to maintain updated_at
    CREATE TRIGGER handle_scheduled_notifications_updated_at
      BEFORE UPDATE ON public.scheduled_notifications
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();

    -- Helpful index for the function
    CREATE INDEX idx_scheduled_notifications_day_time_active
      ON public.scheduled_notifications (day_of_week, time, is_active);
  END IF;
END $$;