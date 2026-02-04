
-- Paso 1: Eliminar foreign key existente y renombrar columna
ALTER TABLE public.member_leaves DROP CONSTRAINT IF EXISTS member_leaves_profile_id_fkey;
ALTER TABLE public.member_leaves RENAME COLUMN profile_id TO member_id;

-- Paso 2: Agregar nueva foreign key a members
ALTER TABLE public.member_leaves 
ADD CONSTRAINT member_leaves_member_id_fkey 
FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

-- Paso 3: Actualizar foreign keys de approved_by y requested_by (mantenerlas a profiles)
-- No se cambian porque son usuarios que aprueban/solicitan

-- Paso 4: Eliminar funciones existentes
DROP FUNCTION IF EXISTS public.is_member_available(uuid);
DROP FUNCTION IF EXISTS public.is_member_discharged(uuid);
