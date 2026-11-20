SET LOCAL lock_timeout = '20s';
CREATE INDEX IF NOT EXISTS idx_system_notifications_recipient_read_created
  ON public.system_notifications (recipient_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_notifications_recipient_type_read
  ON public.system_notifications (recipient_id, type, is_read);
CREATE INDEX IF NOT EXISTS idx_system_notifications_scheduled_for
  ON public.system_notifications (scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_active_time
  ON public.scheduled_notifications (time) WHERE is_active = true;