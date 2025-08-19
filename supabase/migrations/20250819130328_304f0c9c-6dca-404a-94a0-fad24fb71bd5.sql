-- Fix the foreign key relationship between group_members and members
-- First, let's add the foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    -- Check if the foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'group_members_user_id_fkey'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE group_members 
        ADD CONSTRAINT group_members_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES members(id) ON DELETE CASCADE;
    END IF;
END $$;