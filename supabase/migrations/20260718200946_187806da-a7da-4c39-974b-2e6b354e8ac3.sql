DO $$
DECLARE tbl record;
BEGIN
  FOR tbl IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname='public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.relname);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.relname);
  END LOOP;
END $$;

-- Restore anon SELECT only for tables intended to be publicly readable
GRANT SELECT ON public.songs TO anon;
GRANT SELECT ON public.bible_verses TO anon;
GRANT SELECT ON public.daily_verses TO anon;
GRANT SELECT ON public.daily_advice TO anon;
GRANT SELECT ON public.verse_themes TO anon;