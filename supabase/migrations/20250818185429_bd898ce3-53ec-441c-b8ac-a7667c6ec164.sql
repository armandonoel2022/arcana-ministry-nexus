-- Auto-approve admin accounts and set up first admin user
-- Find existing users and set the first one as approved administrator
DO $$
DECLARE
    first_user_id uuid;
    admin_email text;
BEGIN
    -- Get the first user (assuming this is the admin - Armando)
    SELECT id INTO first_user_id 
    FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- If there's a user, make them admin and approve them
    IF first_user_id IS NOT NULL THEN
        -- Update their profile to be an approved administrator
        UPDATE public.profiles 
        SET 
            role = 'administrator',
            is_approved = true,
            needs_password_change = false,
            approved_by = first_user_id,
            approved_at = now()
        WHERE id = first_user_id;
        
        RAISE NOTICE 'First user set as approved administrator: %', first_user_id;
    END IF;
    
    -- For any future admin emails, auto-approve them
    -- You can add specific admin emails here
    UPDATE public.profiles 
    SET 
        role = 'administrator',
        is_approved = true,
        needs_password_change = false,
        approved_by = first_user_id,
        approved_at = now()
    WHERE email ILIKE '%armando%' OR email ILIKE '%admin%'
    AND is_approved = false;
    
END $$;

-- Create a function to auto-approve certain admin emails
CREATE OR REPLACE FUNCTION public.auto_approve_admin_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_emails text[] := ARRAY['armando@%', '%admin%', '%administrator%'];
    is_admin_email boolean := false;
    admin_email text;
BEGIN
    -- Check if the email matches any admin pattern
    FOREACH admin_email IN ARRAY admin_emails
    LOOP
        IF NEW.email ILIKE admin_email THEN
            is_admin_email := true;
            EXIT;
        END IF;
    END LOOP;
    
    -- If it's an admin email, auto-approve
    IF is_admin_email THEN
        NEW.role := 'administrator';
        NEW.is_approved := true;
        NEW.needs_password_change := false;
        NEW.approved_at := now();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to auto-approve admin users
DROP TRIGGER IF EXISTS auto_approve_admin_trigger ON public.profiles;
CREATE TRIGGER auto_approve_admin_trigger
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_approve_admin_users();