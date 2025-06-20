
-- Step 2: Create the remaining database structure

-- Agregar columna de rol a la tabla profiles (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role user_role DEFAULT 'member';
    END IF;
END $$;

-- Crear tabla para solicitudes de membresía a salas
CREATE TABLE IF NOT EXISTS public.chat_room_join_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(room_id, user_id)
);

-- Actualizar tabla chat_rooms para agregar moderador (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_rooms' AND column_name = 'moderator_id') THEN
        ALTER TABLE public.chat_rooms ADD COLUMN moderator_id UUID;
    END IF;
END $$;

-- Actualizar tabla chat_room_members para agregar can_leave (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_room_members' AND column_name = 'can_leave') THEN
        ALTER TABLE public.chat_room_members ADD COLUMN can_leave BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Marcar que los usuarios no pueden dejar la Sala General
UPDATE public.chat_room_members 
SET can_leave = false 
WHERE room_id = (SELECT id FROM public.chat_rooms WHERE name = 'Sala General');

-- Crear función para verificar si el usuario es administrador
CREATE OR REPLACE FUNCTION public.is_administrator(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id AND role = 'administrator'
  );
$$;

-- Crear función para verificar si el usuario es moderador de una sala
CREATE OR REPLACE FUNCTION public.is_room_moderator(_user_id UUID, _room_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_rooms 
    WHERE id = _room_id AND moderator_id = _user_id
  );
$$;

-- Habilitar RLS en la nueva tabla
ALTER TABLE public.chat_room_join_requests ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view their own join requests" ON public.chat_room_join_requests;
DROP POLICY IF EXISTS "Users can create join requests" ON public.chat_room_join_requests;
DROP POLICY IF EXISTS "Moderators can view requests for their rooms" ON public.chat_room_join_requests;
DROP POLICY IF EXISTS "Moderators can update requests for their rooms" ON public.chat_room_join_requests;
DROP POLICY IF EXISTS "Administrators can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Administrators can update user roles" ON public.profiles;

-- Políticas para solicitudes de membresía
CREATE POLICY "Users can view their own join requests" ON public.chat_room_join_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create join requests" ON public.chat_room_join_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Moderators can view requests for their rooms" ON public.chat_room_join_requests
  FOR SELECT USING (
    public.is_room_moderator(auth.uid(), room_id) OR 
    public.is_administrator(auth.uid())
  );

CREATE POLICY "Moderators can update requests for their rooms" ON public.chat_room_join_requests
  FOR UPDATE USING (
    public.is_room_moderator(auth.uid(), room_id) OR 
    public.is_administrator(auth.uid())
  );

-- Política para que solo administradores puedan ver todos los perfiles
CREATE POLICY "Administrators can view all profiles" ON public.profiles
  FOR SELECT USING (
    public.is_administrator(auth.uid()) OR id = auth.uid()
  );

-- Política para que administradores puedan actualizar roles
CREATE POLICY "Administrators can update user roles" ON public.profiles
  FOR UPDATE USING (public.is_administrator(auth.uid()));
