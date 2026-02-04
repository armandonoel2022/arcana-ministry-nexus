
-- Crear funciones actualizadas
CREATE FUNCTION public.is_member_available(p_member_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.member_leaves
    WHERE member_id = p_member_id
      AND status = 'aprobada'
      AND start_date <= CURRENT_DATE
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
      AND leave_type != 'baja_definitiva'
  ) AND NOT EXISTS (
    SELECT 1 FROM public.member_leaves
    WHERE member_id = p_member_id
      AND status = 'aprobada'
      AND leave_type = 'baja_definitiva'
  );
$$;

CREATE FUNCTION public.is_member_discharged(p_member_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.member_leaves
    WHERE member_id = p_member_id
      AND status = 'aprobada'
      AND leave_type = 'baja_definitiva'
  );
$$;

-- Actualizar políticas RLS de member_leaves
DROP POLICY IF EXISTS "Users can view leaves" ON public.member_leaves;
DROP POLICY IF EXISTS "Admins can insert leaves" ON public.member_leaves;
DROP POLICY IF EXISTS "Admins can update leaves" ON public.member_leaves;
DROP POLICY IF EXISTS "Admins can delete leaves" ON public.member_leaves;
DROP POLICY IF EXISTS "Authenticated users can view leaves" ON public.member_leaves;
DROP POLICY IF EXISTS "Admins can manage leaves" ON public.member_leaves;

CREATE POLICY "Authenticated users can view leaves" 
ON public.member_leaves 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage leaves" 
ON public.member_leaves 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin') OR is_administrator(auth.uid())
);
