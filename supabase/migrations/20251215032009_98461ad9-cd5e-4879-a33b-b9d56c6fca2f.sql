-- Drop the foreign key constraint that references profiles
ALTER TABLE public.chat_room_members 
DROP CONSTRAINT IF EXISTS chat_room_members_user_id_fkey;

-- Now chat_room_members.user_id can store either profile IDs or member IDs
-- This allows flexibility in member management