-- Enum para tipos de licencia/inactividad
CREATE TYPE public.leave_type AS ENUM (
  'enfermedad',
  'maternidad',
  'estudios',
  'trabajo',
  'vacaciones',
  'disciplina',
  'suspension',
  'baja_definitiva',
  'otra'
);

-- Enum para estado de la solicitud
CREATE TYPE public.leave_status AS ENUM (
  'pendiente',
  'aprobada',
  'rechazada',
  'cancelada',
  'finalizada'
);

-- Tabla de licencias/inactividades de miembros
CREATE TABLE public.member_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  status leave_status NOT NULL DEFAULT 'pendiente',
  reason TEXT, -- Razón detallada (obligatoria si leave_type = 'otra')
  reason_visible BOOLEAN NOT NULL DEFAULT false, -- Si la razón es visible para todos
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- NULL = indefinida
  is_indefinite BOOLEAN NOT NULL DEFAULT false,
  requested_by UUID REFERENCES public.profiles(id), -- Quien solicitó (miembro o admin)
  approved_by UUID REFERENCES public.profiles(id), -- Admin que aprobó
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notes TEXT, -- Notas internas solo para admins
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_member_leaves_profile ON public.member_leaves(profile_id);
CREATE INDEX idx_member_leaves_status ON public.member_leaves(status);
CREATE INDEX idx_member_leaves_dates ON public.member_leaves(start_date, end_date);

-- Trigger para updated_at
CREATE TRIGGER update_member_leaves_updated_at
  BEFORE UPDATE ON public.member_leaves
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Habilitar RLS
ALTER TABLE public.member_leaves ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Todos los usuarios autenticados pueden ver licencias (sin razón si no es visible)
CREATE POLICY "Users can view leaves"
  ON public.member_leaves
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Solo admins pueden insertar licencias administrativas
CREATE POLICY "Admins can insert leaves"
  ON public.member_leaves
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    (requested_by = auth.uid() AND leave_type IN ('enfermedad', 'maternidad', 'estudios', 'trabajo', 'vacaciones', 'otra'))
  );

-- Solo admins pueden actualizar licencias
CREATE POLICY "Admins can update leaves"
  ON public.member_leaves
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR requested_by = auth.uid());

-- Solo admins pueden eliminar
CREATE POLICY "Admins can delete leaves"
  ON public.member_leaves
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Función para verificar si un miembro está activo (sin licencia vigente)
CREATE OR REPLACE FUNCTION public.is_member_available(member_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.member_leaves
    WHERE profile_id = member_profile_id
      AND status = 'aprobada'
      AND start_date <= CURRENT_DATE
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
      AND leave_type != 'baja_definitiva'
  ) AND NOT EXISTS (
    SELECT 1 FROM public.member_leaves
    WHERE profile_id = member_profile_id
      AND status = 'aprobada'
      AND leave_type = 'baja_definitiva'
  );
$$;

-- Función para verificar si un miembro fue dado de baja definitiva
CREATE OR REPLACE FUNCTION public.is_member_discharged(member_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.member_leaves
    WHERE profile_id = member_profile_id
      AND status = 'aprobada'
      AND leave_type = 'baja_definitiva'
  );
$$;