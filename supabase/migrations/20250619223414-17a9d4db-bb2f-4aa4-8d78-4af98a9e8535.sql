
-- Eliminar las políticas restrictivas existentes
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
DROP POLICY IF EXISTS "Admins can create services" ON public.services;
DROP POLICY IF EXISTS "Admins can update services" ON public.services;
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;

-- Crear nuevas políticas más permisivas para que todos puedan ver los servicios
CREATE POLICY "Anyone can view services" ON public.services
  FOR SELECT USING (true);

-- Permitir que cualquier usuario pueda crear servicios (para el formulario y CSV)
CREATE POLICY "Anyone can create services" ON public.services
  FOR INSERT WITH CHECK (true);

-- Permitir que cualquier usuario pueda actualizar servicios (para confirmar/desconfirmar)
CREATE POLICY "Anyone can update services" ON public.services
  FOR UPDATE USING (true);

-- Permitir que cualquier usuario pueda eliminar servicios
CREATE POLICY "Anyone can delete services" ON public.services
  FOR DELETE USING (true);
