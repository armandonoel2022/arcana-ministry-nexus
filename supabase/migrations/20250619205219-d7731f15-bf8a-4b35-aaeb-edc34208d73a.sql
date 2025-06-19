
-- Actualizar la tabla profiles para incluir el campo role usando el enum existente
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'member';

-- Establecerte como administrador (asumiendo que eres el primer usuario registrado)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = (
  SELECT email FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Crear función de seguridad para verificar roles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Política para que los administradores puedan ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Política para que los administradores puedan actualizar cualquier perfil
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.get_current_user_role() = 'admin');

-- Política para que los usuarios puedan actualizar su propio perfil (además de la existente)
CREATE POLICY "Users can update own profile detailed" ON public.profiles
  FOR UPDATE USING (auth.uid() = id AND public.get_current_user_role() != 'admin');
