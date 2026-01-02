-- Marcar como leídas las notificaciones de service_overlay duplicadas/viejas
UPDATE system_notifications 
SET is_read = true 
WHERE type = 'service_overlay' 
AND is_read = false 
AND created_at < NOW() - INTERVAL '30 minutes';