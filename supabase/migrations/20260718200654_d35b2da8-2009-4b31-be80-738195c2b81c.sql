
-- 1. chat_room_members
DROP POLICY IF EXISTS "Users can view all room members" ON public.chat_room_members;
CREATE POLICY "Authenticated users can view room members"
ON public.chat_room_members FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- 2. member_leaves
DROP POLICY IF EXISTS "Authenticated users can view leaves" ON public.member_leaves;
CREATE POLICY "Members and admins can view leaves"
ON public.member_leaves FOR SELECT TO authenticated
USING (
  member_id = auth.uid()
  OR public.is_administrator(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- 3. members
DROP POLICY IF EXISTS "Authenticated users can view active members" ON public.members;
CREATE POLICY "Admins and leaders can view all members"
ON public.members FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('administrator'::user_role, 'leader'::user_role))
);
CREATE OR REPLACE VIEW public.members_basic
WITH (security_invoker=on) AS
SELECT id, nombres, apellidos, photo_url, cargo, grupo, is_active
FROM public.members
WHERE is_active = true;
GRANT SELECT ON public.members_basic TO authenticated;

-- 4. musician / multimedia replacement requests
DROP POLICY IF EXISTS "Users can view musician replacement requests" ON public.musician_replacement_requests;
CREATE POLICY "Involved parties and staff can view musician requests"
ON public.musician_replacement_requests FOR SELECT TO authenticated
USING (
  original_member_id = auth.uid()
  OR replacement_member_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p
             WHERE p.id = auth.uid()
               AND p.role IN ('administrator'::user_role, 'leader'::user_role))
);

DROP POLICY IF EXISTS "Users can view multimedia replacement requests" ON public.multimedia_replacement_requests;
CREATE POLICY "Involved parties and staff can view multimedia requests"
ON public.multimedia_replacement_requests FOR SELECT TO authenticated
USING (
  original_member_id = auth.uid()
  OR replacement_member_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p
             WHERE p.id = auth.uid()
               AND p.role IN ('administrator'::user_role, 'leader'::user_role))
);

-- 5. password_reset_requests
DROP POLICY IF EXISTS "Users can create password reset requests" ON public.password_reset_requests;
CREATE POLICY "Authenticated users can create password reset requests"
ON public.password_reset_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 6. profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT id, full_name, photo_url, role, is_active
FROM public.profiles
WHERE is_active = true;
GRANT SELECT ON public.profiles_public TO authenticated;

-- 7. services
DROP POLICY IF EXISTS "Anyone can create services" ON public.services;
DROP POLICY IF EXISTS "Anyone can update services" ON public.services;
DROP POLICY IF EXISTS "Anyone can delete services" ON public.services;
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
CREATE POLICY "Authenticated users can create services"
ON public.services FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update services"
ON public.services FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can delete services"
ON public.services FOR DELETE TO authenticated
USING (public.is_administrator(auth.uid()));

-- 8. system_notifications
DROP POLICY IF EXISTS "Service role can send notifications" ON public.system_notifications;

-- 9. verse_themes
DROP POLICY IF EXISTS "Administrators can manage verse themes" ON public.verse_themes;
CREATE POLICY "Administrators can manage verse themes"
ON public.verse_themes FOR ALL TO authenticated
USING (public.is_administrator(auth.uid()))
WITH CHECK (public.is_administrator(auth.uid()));

-- 10. walkie_talkie_transmissions
DROP POLICY IF EXISTS "Users can view transmissions" ON public.walkie_talkie_transmissions;
CREATE POLICY "Authenticated users can view transmissions"
ON public.walkie_talkie_transmissions FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- 11. Views
ALTER VIEW public.dm_conversations SET (security_invoker=on);
ALTER VIEW public.service_selected_songs SET (security_invoker=on);

-- 12. Functions
ALTER FUNCTION public.process_scheduled_notifications() SET search_path = public;
ALTER FUNCTION public.send_push_on_notification_insert() SET search_path = public;
ALTER FUNCTION public.auto_join_chat_room() SET search_path = public;
ALTER FUNCTION public.get_available_directors(uuid) SET search_path = public;
ALTER FUNCTION public.expire_pending_replacements() SET search_path = public;
ALTER FUNCTION public.get_current_user_role() SET search_path = public;
ALTER FUNCTION public.send_push_notification_compat(uuid, text, text, text) SET search_path = public;
ALTER FUNCTION public.is_administrator(uuid) SET search_path = public;
ALTER FUNCTION public.is_room_moderator(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.send_push_notification(uuid, text, text, text) SET search_path = public;
ALTER FUNCTION public.process_service_notifications() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_roles(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_administrator(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_room_moderator(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_member_of_room(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_participant_in_session(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_member_available(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_member_discharged(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_available_directors(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_manage_rehearsal_file(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_access_rehearsal_file(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.send_push_notification(uuid, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.send_push_notification_compat(uuid, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.expire_pending_replacements() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.process_scheduled_notifications() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.process_service_notifications() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_administrator(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_room_moderator(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_member_of_room(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_participant_in_session(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_member_available(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_member_discharged(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_directors(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_rehearsal_file(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_rehearsal_file(text) TO authenticated;

-- 13. Storage
DROP POLICY IF EXISTS "Carátulas son públicamente accesibles" ON storage.objects;
DROP POLICY IF EXISTS "Outfit photos public read" ON storage.objects;
DROP POLICY IF EXISTS "Public can view member photos" ON storage.objects;
DROP POLICY IF EXISTS "Public overlay images are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Rehearsal tracks public select" ON storage.objects;

CREATE POLICY "Authenticated can read song covers"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'song-covers');
CREATE POLICY "Authenticated can read outfit photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'outfit-photos');
CREATE POLICY "Authenticated can read member photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'member-photos');
CREATE POLICY "Authenticated can read overlay images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'overlay-images');
CREATE POLICY "Authenticated can read rehearsal tracks"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'rehearsal-tracks');
