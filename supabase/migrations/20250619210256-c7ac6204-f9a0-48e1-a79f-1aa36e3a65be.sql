
-- Agregar las columnas faltantes a la tabla services
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS leader TEXT,
ADD COLUMN IF NOT EXISTS month_name TEXT,
ADD COLUMN IF NOT EXISTS month_order INTEGER,
ADD COLUMN IF NOT EXISTS special_activity TEXT,
ADD COLUMN IF NOT EXISTS choir_breaks TEXT;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_services_month ON public.services(month_name);
CREATE INDEX IF NOT EXISTS idx_services_date ON public.services(service_date);
CREATE INDEX IF NOT EXISTS idx_services_group ON public.services(assigned_group_id);

-- Crear función para obtener el nombre del mes en español
CREATE OR REPLACE FUNCTION get_spanish_month_name(date_input DATE)
RETURNS TEXT AS $$
BEGIN
  CASE EXTRACT(MONTH FROM date_input)
    WHEN 1 THEN RETURN 'Enero';
    WHEN 2 THEN RETURN 'Febrero';
    WHEN 3 THEN RETURN 'Marzo';
    WHEN 4 THEN RETURN 'Abril';
    WHEN 5 THEN RETURN 'Mayo';
    WHEN 6 THEN RETURN 'Junio';
    WHEN 7 THEN RETURN 'Julio';
    WHEN 8 THEN RETURN 'Agosto';
    WHEN 9 THEN RETURN 'Septiembre';
    WHEN 10 THEN RETURN 'Octubre';
    WHEN 11 THEN RETURN 'Noviembre';
    WHEN 12 THEN RETURN 'Diciembre';
    ELSE RETURN 'Desconocido';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Crear políticas RLS para la tabla services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Política para que todos los usuarios puedan ver los servicios
CREATE POLICY "Anyone can view services" ON public.services
  FOR SELECT USING (true);

-- Política para que solo los administradores puedan crear servicios
CREATE POLICY "Admins can create services" ON public.services
  FOR INSERT WITH CHECK (public.get_current_user_role() = 'admin');

-- Política para que solo los administradores puedan actualizar servicios
CREATE POLICY "Admins can update services" ON public.services
  FOR UPDATE USING (public.get_current_user_role() = 'admin');

-- Política para que solo los administradores puedan eliminar servicios
CREATE POLICY "Admins can delete services" ON public.services
  FOR DELETE USING (public.get_current_user_role() = 'admin');
