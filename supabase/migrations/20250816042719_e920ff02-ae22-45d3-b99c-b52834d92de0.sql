-- Actualizar la política RLS para permitir ver notificaciones globales (recipient_id null) 
DROP POLICY IF EXISTS "Users can view their own notifications" ON system_notifications;

-- Nueva política que permite ver notificaciones propias Y notificaciones globales
CREATE POLICY "Users can view notifications" 
ON system_notifications 
FOR SELECT 
USING (recipient_id = auth.uid() OR recipient_id IS NULL);

-- Limpiar notificaciones de prueba antiguas
DELETE FROM system_notifications WHERE recipient_id IS NULL;