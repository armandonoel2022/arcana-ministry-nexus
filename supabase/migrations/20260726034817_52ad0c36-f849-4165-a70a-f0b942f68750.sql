
-- ============ ENUMS ============
CREATE TYPE public.inventory_department AS ENUM ('voces_sonido','instrumentos','multimedia','danza');
CREATE TYPE public.inventory_status AS ENUM ('in_stock','assigned','loaned','damaged','retired');
CREATE TYPE public.replacement_status AS ENUM ('pending','approved','rejected','completed');
CREATE TYPE public.finance_method AS ENUM ('efectivo','transferencia','electronico','otro');
CREATE TYPE public.campaign_scope AS ENUM ('todos','sin_directiva','por_grupo','por_departamento');

-- ============ DEPARTMENT LEADERS ============
CREATE TABLE public.department_leaders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department inventory_department NOT NULL UNIQUE,
  leader_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.department_leaders TO authenticated;
GRANT ALL ON public.department_leaders TO service_role;
ALTER TABLE public.department_leaders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dept_leaders_read_auth" ON public.department_leaders FOR SELECT TO authenticated USING (true);
CREATE POLICY "dept_leaders_admin_all" ON public.department_leaders FOR ALL TO authenticated
  USING (public.is_administrator(auth.uid())) WITH CHECK (public.is_administrator(auth.uid()));

CREATE OR REPLACE FUNCTION public.is_department_leader(_user_id uuid, _department inventory_department)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.department_leaders WHERE department = _department AND leader_user_id = _user_id);
$$;

-- ============ INVENTORY ITEMS ============
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department inventory_department NOT NULL,
  subcategory text,
  name text NOT NULL,
  photo_url text,
  status inventory_status NOT NULL DEFAULT 'in_stock',
  assigned_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  loaned_to text,
  acquisition_date date,
  acquisition_cost numeric(12,2),
  useful_life_months integer,
  notes text,
  serial_number text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_read_all_auth" ON public.inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "inv_admin_write" ON public.inventory_items FOR ALL TO authenticated
  USING (public.is_administrator(auth.uid())) WITH CHECK (public.is_administrator(auth.uid()));
CREATE POLICY "inv_leader_write" ON public.inventory_items FOR ALL TO authenticated
  USING (public.is_department_leader(auth.uid(), department))
  WITH CHECK (public.is_department_leader(auth.uid(), department));
CREATE TRIGGER inv_items_updated BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ REPLACEMENT REQUESTS ============
CREATE TABLE public.inventory_replacement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  reason text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  status replacement_status NOT NULL DEFAULT 'pending',
  admin_response text,
  responded_by uuid,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_replacement_requests TO authenticated;
GRANT ALL ON public.inventory_replacement_requests TO service_role;
ALTER TABLE public.inventory_replacement_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invreq_read_auth" ON public.inventory_replacement_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "invreq_insert_auth" ON public.inventory_replacement_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());
CREATE POLICY "invreq_admin_manage" ON public.inventory_replacement_requests FOR UPDATE TO authenticated
  USING (public.is_administrator(auth.uid())) WITH CHECK (public.is_administrator(auth.uid()));
CREATE POLICY "invreq_admin_delete" ON public.inventory_replacement_requests FOR DELETE TO authenticated
  USING (public.is_administrator(auth.uid()));
CREATE TRIGGER inv_req_updated BEFORE UPDATE ON public.inventory_replacement_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ FINANCE INCOME ============
CREATE TABLE public.finance_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  income_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  method finance_method NOT NULL DEFAULT 'efectivo',
  category text,
  description text,
  donor text,
  receipt_url text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_income TO authenticated;
GRANT ALL ON public.finance_income TO service_role;
ALTER TABLE public.finance_income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fin_income_admin_all" ON public.finance_income FOR ALL TO authenticated
  USING (public.is_administrator(auth.uid())) WITH CHECK (public.is_administrator(auth.uid()));
CREATE TRIGGER fin_income_updated BEFORE UPDATE ON public.finance_income
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ FINANCE CAMPAIGNS ============
CREATE TABLE public.finance_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  goal_amount numeric(12,2) NOT NULL CHECK (goal_amount > 0),
  deadline date,
  scope campaign_scope NOT NULL DEFAULT 'todos',
  worship_group_id uuid REFERENCES public.worship_groups(id) ON DELETE SET NULL,
  department inventory_department,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_campaigns TO authenticated;
GRANT ALL ON public.finance_campaigns TO service_role;
ALTER TABLE public.finance_campaigns ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_manage_campaign(_campaign_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.finance_campaigns c
    WHERE c.id = _campaign_id AND (
      public.is_administrator(_user_id)
      OR c.created_by = _user_id
      OR (c.scope = 'por_departamento' AND c.department IS NOT NULL AND public.is_department_leader(_user_id, c.department))
      OR (c.scope = 'por_grupo' AND c.worship_group_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = c.worship_group_id AND gm.user_id = _user_id AND gm.is_leader = true
      ))
    )
  );
$$;

CREATE POLICY "fin_camp_read_auth" ON public.finance_campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "fin_camp_admin_all" ON public.finance_campaigns FOR ALL TO authenticated
  USING (public.is_administrator(auth.uid())) WITH CHECK (public.is_administrator(auth.uid()));
CREATE POLICY "fin_camp_leader_manage" ON public.finance_campaigns FOR ALL TO authenticated
  USING (public.can_manage_campaign(id, auth.uid()))
  WITH CHECK (public.can_manage_campaign(id, auth.uid()) OR created_by = auth.uid());
CREATE TRIGGER fin_camp_updated BEFORE UPDATE ON public.finance_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ FINANCE CONTRIBUTIONS ============
CREATE TABLE public.finance_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.finance_campaigns(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  contributor_name text,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  contribution_date date NOT NULL DEFAULT CURRENT_DATE,
  method finance_method NOT NULL DEFAULT 'efectivo',
  note text,
  receipt_url text,
  recorded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_contributions TO authenticated;
GRANT ALL ON public.finance_contributions TO service_role;
ALTER TABLE public.finance_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fin_contrib_read_auth" ON public.finance_contributions FOR SELECT TO authenticated USING (true);
CREATE POLICY "fin_contrib_manage" ON public.finance_contributions FOR ALL TO authenticated
  USING (public.can_manage_campaign(campaign_id, auth.uid()))
  WITH CHECK (public.can_manage_campaign(campaign_id, auth.uid()));
CREATE TRIGGER fin_contrib_updated BEFORE UPDATE ON public.finance_contributions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ STORAGE POLICIES ============
CREATE POLICY "inv_photos_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'inventory-photos');
CREATE POLICY "inv_photos_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'inventory-photos');
CREATE POLICY "inv_photos_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'inventory-photos');
CREATE POLICY "inv_photos_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'inventory-photos' AND public.is_administrator(auth.uid()));
CREATE POLICY "fin_receipts_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'finance-receipts');
CREATE POLICY "fin_receipts_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'finance-receipts');
CREATE POLICY "fin_receipts_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'finance-receipts');
CREATE POLICY "fin_receipts_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'finance-receipts' AND public.is_administrator(auth.uid()));

-- ============ SCREEN PERMISSIONS ============
INSERT INTO public.screen_permissions (role, screen_path, screen_name, screen_category, can_view, can_edit) VALUES
  ('admin', '/inventario', 'Inventario', 'Ministerio', true, true),
  ('lider', '/inventario', 'Inventario', 'Ministerio', true, true),
  ('vocal', '/inventario', 'Inventario', 'Ministerio', true, false),
  ('musico', '/inventario', 'Inventario', 'Ministerio', true, false),
  ('miembro', '/inventario', 'Inventario', 'Ministerio', true, false),
  ('admin', '/finanzas', 'Finanzas', 'Administración Avanzada', true, true),
  ('lider', '/finanzas', 'Finanzas', 'Administración Avanzada', true, true)
ON CONFLICT DO NOTHING;
