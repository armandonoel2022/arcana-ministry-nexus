
CREATE TYPE public.poll_kind AS ENUM ('encuesta', 'votacion');
CREATE TYPE public.poll_status AS ENUM ('open', 'closed');

CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.poll_kind NOT NULL DEFAULT 'encuesta',
  title text NOT NULL,
  description text,
  category text,
  position_title text,
  multiple_choice boolean NOT NULL DEFAULT false,
  closes_at timestamptz,
  status public.poll_status NOT NULL DEFAULT 'open',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.polls TO authenticated;
GRANT ALL ON public.polls TO service_role;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "polls_select" ON public.polls FOR SELECT TO authenticated USING (true);
CREATE POLICY "polls_insert_admin" ON public.polls FOR INSERT TO authenticated WITH CHECK (public.is_administrator(auth.uid()));
CREATE POLICY "polls_update_admin" ON public.polls FOR UPDATE TO authenticated USING (public.is_administrator(auth.uid())) WITH CHECK (public.is_administrator(auth.uid()));
CREATE POLICY "polls_delete_admin" ON public.polls FOR DELETE TO authenticated USING (public.is_administrator(auth.uid()));

CREATE TABLE public.poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label text NOT NULL,
  style text,
  color text,
  photo_url text,
  member_id uuid,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_poll_options_poll ON public.poll_options(poll_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_options TO authenticated;
GRANT ALL ON public.poll_options TO service_role;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "poll_options_select" ON public.poll_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "poll_options_insert_admin" ON public.poll_options FOR INSERT TO authenticated WITH CHECK (public.is_administrator(auth.uid()));
CREATE POLICY "poll_options_update_admin" ON public.poll_options FOR UPDATE TO authenticated USING (public.is_administrator(auth.uid())) WITH CHECK (public.is_administrator(auth.uid()));
CREATE POLICY "poll_options_delete_admin" ON public.poll_options FOR DELETE TO authenticated USING (public.is_administrator(auth.uid()));

-- Votos ANÓNIMOS: nunca se guarda el usuario.
CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_poll_votes_poll ON public.poll_votes(poll_id);
CREATE INDEX idx_poll_votes_option ON public.poll_votes(option_id);
GRANT SELECT, INSERT ON public.poll_votes TO authenticated;
GRANT ALL ON public.poll_votes TO service_role;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "poll_votes_select" ON public.poll_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "poll_votes_insert" ON public.poll_votes FOR INSERT TO authenticated WITH CHECK (true);

-- Solo marca que la persona ya participó (sin qué votó).
CREATE TABLE public.poll_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)
);
GRANT SELECT, INSERT ON public.poll_participants TO authenticated;
GRANT ALL ON public.poll_participants TO service_role;
ALTER TABLE public.poll_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "poll_participants_select_own" ON public.poll_participants FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "poll_participants_insert_own" ON public.poll_participants FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.validate_poll_open()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE p RECORD;
BEGIN
  SELECT status, closes_at INTO p FROM public.polls WHERE id = NEW.poll_id;
  IF p IS NULL THEN
    RAISE EXCEPTION 'Encuesta no encontrada';
  END IF;
  IF p.status <> 'open' OR (p.closes_at IS NOT NULL AND p.closes_at < now()) THEN
    RAISE EXCEPTION 'Esta encuesta ya está cerrada';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_poll_vote BEFORE INSERT ON public.poll_votes
FOR EACH ROW EXECUTE FUNCTION public.validate_poll_open();
CREATE TRIGGER trg_validate_poll_participant BEFORE INSERT ON public.poll_participants
FOR EACH ROW EXECUTE FUNCTION public.validate_poll_open();

CREATE TRIGGER trg_polls_updated_at BEFORE UPDATE ON public.polls
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_poll_options_updated_at BEFORE UPDATE ON public.poll_options
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.screen_permissions (role, screen_path, screen_name, screen_category, can_view, can_edit)
SELECT r, p.path, p.name, 'Ministerio',
       true,
       (r = 'admin')
FROM unnest(ARRAY['admin','lider','vocal','musico','miembro']::app_role[]) AS r,
     (VALUES ('/encuestas','Encuestas'), ('/votaciones','Votaciones')) AS p(path, name)
ON CONFLICT DO NOTHING;
