-- Drop the existing foreign key constraint
ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;

-- Add a new foreign key constraint pointing to members table
ALTER TABLE public.group_members ADD CONSTRAINT group_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.members(id) ON DELETE CASCADE;