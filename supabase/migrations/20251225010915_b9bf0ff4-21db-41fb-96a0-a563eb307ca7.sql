-- Fix: evitar error al insertar notificaciones (trigger llama a función inexistente)
DROP TRIGGER IF EXISTS send_push_on_notification_insert ON public.system_notifications;

-- Si existiera algún trigger antiguo con otros nombres, eliminarlos también por seguridad
DROP TRIGGER IF EXISTS on_notification_created ON public.system_notifications;
DROP TRIGGER IF EXISTS send_push_on_notification ON public.system_notifications;
DROP TRIGGER IF EXISTS trigger_push_notification ON public.system_notifications;

-- Nota: se mantiene handle_updated_at_system_notifications
