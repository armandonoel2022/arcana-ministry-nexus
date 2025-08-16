-- Arreglar la política RLS para system_notifications para permitir que las Edge Functions inserten notificaciones
DROP POLICY IF EXISTS "Authenticated users can send notifications" ON system_notifications;

-- Crear nueva política que permita a las Edge Functions insertar notificaciones usando service role
CREATE POLICY "Service role can send notifications" 
ON system_notifications 
FOR INSERT 
WITH CHECK (true);

-- Mantener la política existente para usuarios autenticados
CREATE POLICY "Authenticated users can send notifications" 
ON system_notifications 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);