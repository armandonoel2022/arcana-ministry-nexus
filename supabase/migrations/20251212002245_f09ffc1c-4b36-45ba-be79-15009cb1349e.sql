-- Eliminar trigger que causa el error
DROP TRIGGER IF EXISTS on_notification_created ON system_notifications;
DROP TRIGGER IF EXISTS send_push_on_notification ON system_notifications;
DROP TRIGGER IF EXISTS trigger_push_notification ON system_notifications;

-- La función trigger_send_push_notification ya no será usada por triggers
-- pero la dejamos para compatibilidad

-- Ahora las inserciones a system_notifications serán directas sin intentar push automático