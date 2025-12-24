-- Ensure RLS is enabled
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies (if they exist)
DROP POLICY IF EXISTS "Users can view their notifications" ON public.system_notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.system_notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.system_notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.system_notifications;

-- SELECT: users can read only notifications addressed to them
CREATE POLICY "Users can view their notifications"
ON public.system_notifications
FOR SELECT
USING (recipient_id = auth.uid());

-- INSERT: users can create notifications only for themselves (prevents public/broadcast abuse)
CREATE POLICY "Users can insert their own notifications"
ON public.system_notifications
FOR INSERT
WITH CHECK (
  recipient_id = auth.uid()
  AND (sender_id = auth.uid() OR sender_id IS NULL)
);

-- UPDATE: users can only mark/read/update their own notifications
CREATE POLICY "Users can update their notifications"
ON public.system_notifications
FOR UPDATE
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- DELETE/ALL for admins (optional, for cleanup/moderation)
CREATE POLICY "Admins can manage all notifications"
ON public.system_notifications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'administrator'::public.user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'administrator'::public.user_role
  )
);