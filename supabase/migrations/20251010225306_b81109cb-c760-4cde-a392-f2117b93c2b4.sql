-- 1) Crear función no-recursiva para comprobar si el usuario participa en una sesión
create or replace function public.is_participant_in_session(_session_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.rehearsal_participants rp
    where rp.session_id = _session_id
      and rp.user_id = _user_id
      and coalesce(rp.invitation_status, 'accepted') = 'accepted'
  );
$$;

-- 2) Reemplazar la política que causaba recursión
drop policy if exists "Users can view participants in their sessions" on public.rehearsal_participants;

create policy "Users can view participants in their sessions"
  on public.rehearsal_participants
  for select
  using (
    -- Puede ver si participa en esa misma sesión
    public.is_participant_in_session(session_id, auth.uid())
    -- o si es el creador de la sesión
    or exists (
      select 1 from public.rehearsal_sessions rs
      where rs.id = rehearsal_participants.session_id
        and rs.created_by = auth.uid()
    )
  );