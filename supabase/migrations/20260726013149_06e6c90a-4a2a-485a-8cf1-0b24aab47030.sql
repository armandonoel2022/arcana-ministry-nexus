-- 1) Consolidate duplicate policies on public.profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can approve users" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile detailed" ON public.profiles;

-- Ensure the canonical admin update policy has a WITH CHECK clause
DROP POLICY IF EXISTS "Administrators can update user roles" ON public.profiles;
CREATE POLICY "Administrators can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_administrator(auth.uid()))
WITH CHECK (public.is_administrator(auth.uid()));

-- 2) Assign base 'miembro' role and promote to 'admin' for backup administrators
INSERT INTO public.user_roles (user_id, role)
VALUES
  ('6684ec79-9875-4b47-8b70-f7714d750cb0', 'miembro'),
  ('6684ec79-9875-4b47-8b70-f7714d750cb0', 'admin'),
  ('99efcf93-c302-4e42-b63f-6b697f8baa38', 'miembro'),
  ('99efcf93-c302-4e42-b63f-6b697f8baa38', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Reflect admin role in profiles for legacy checks/UI
UPDATE public.profiles
SET role = 'administrator'
WHERE id IN (
  '6684ec79-9875-4b47-8b70-f7714d750cb0',
  '99efcf93-c302-4e42-b63f-6b697f8baa38'
);