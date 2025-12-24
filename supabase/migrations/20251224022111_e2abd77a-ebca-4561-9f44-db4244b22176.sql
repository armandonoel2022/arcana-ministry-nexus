-- Eliminar políticas actuales para recrear correctamente
DROP POLICY IF EXISTS "Users can view their notifications" ON public.system_notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.system_notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.system_notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.system_notifications;

-- SELECT: usuarios pueden ver notificaciones dirigidas a ellos O broadcasts (recipient_id IS NULL)
CREATE POLICY "Users can view their notifications"
ON public.system_notifications
FOR SELECT
USING (
  recipient_id = auth.uid() 
  OR recipient_id IS NULL
);

-- INSERT: usuarios autenticados pueden crear notificaciones (para sí mismos o broadcasts)
CREATE POLICY "Users can insert notifications"
ON public.system_notifications
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: usuarios pueden actualizar sus propias notificaciones o broadcasts
CREATE POLICY "Users can update their notifications"
ON public.system_notifications
FOR UPDATE
USING (
  recipient_id = auth.uid() 
  OR recipient_id IS NULL
);

-- DELETE: solo admins pueden eliminar
CREATE POLICY "Admins can delete notifications"
ON public.system_notifications
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'administrator'::public.user_role
  )
);