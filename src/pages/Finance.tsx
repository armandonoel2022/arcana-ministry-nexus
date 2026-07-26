import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSign, Plus, Loader2, Receipt, Target, TrendingUp, Camera, Trash2, Users,
} from "lucide-react";
import { toast } from "sonner";

type Method = "efectivo" | "transferencia" | "electronico" | "otro";
type Scope = "todos" | "sin_directiva" | "por_grupo" | "por_departamento";

const METHOD_LABEL: Record<Method, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  electronico: "Electrónico",
  otro: "Otro",
};

const DEPARTMENTS = [
  { key: "voces_sonido", label: "Voces y Sonido" },
  { key: "instrumentos", label: "Instrumentos" },
  { key: "multimedia", label: "Multimedia" },
  { key: "danza", label: "Danza" },
];

interface Income {
  id: string;
  income_date: string;
  amount: number;
  method: Method;
  category: string | null;
  description: string | null;
  donor: string | null;
  receipt_url: string | null;
}

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  goal_amount: number;
  deadline: string | null;
  scope: Scope;
  worship_group_id: string | null;
  department: string | null;
  is_active: boolean;
  created_by: string;
}

interface Contribution {
  id: string;
  campaign_id: string;
  member_id: string | null;
  contributor_name: string | null;
  amount: number;
  contribution_date: string;
  method: Method;
  note: string | null;
  receipt_url: string | null;
}

const Finance: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const [tab, setTab] = useState<"income" | "campaigns">("income");

  // Income
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [showIncome, setShowIncome] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    income_date: new Date().toISOString().slice(0, 10),
    amount: "",
    method: "efectivo" as Method,
    category: "ofrenda",
    description: "",
    donor: "",
    file: null as File | null,
  });
  const incomeFileRef = useRef<HTMLInputElement>(null);

  // Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [showCampaign, setShowCampaign] = useState(false);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [showContribute, setShowContribute] = useState(false);
  const [saving, setSaving] = useState(false);

  const [campaignForm, setCampaignForm] = useState({
    title: "",
    description: "",
    goal_amount: "",
    deadline: "",
    scope: "todos" as Scope,
    worship_group_id: "",
    department: "",
  });

  const [contribForm, setContribForm] = useState({
    amount: "",
    method: "efectivo" as Method,
    contribution_date: new Date().toISOString().slice(0, 10),
    contributor_name: "",
    note: "",
    file: null as File | null,
  });
  const contribFileRef = useRef<HTMLInputElement>(null);

  const loadAll = async () => {
    const [inc, camps, contrib, wg] = await Promise.all([
      supabase.from("finance_income").select("*").order("income_date", { ascending: false }),
      supabase.from("finance_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("finance_contributions").select("*").order("contribution_date", { ascending: false }),
      supabase.from("worship_groups").select("id, name").eq("is_active", true),
    ]);
    setIncomes((inc.data || []) as Income[]);
    setCampaigns((camps.data || []) as Campaign[]);
    setContributions((contrib.data || []) as Contribution[]);
    setGroups(wg.data || []);
  };

  useEffect(() => { loadAll(); }, []);

  const totalIncome = useMemo(() => incomes.reduce((s, i) => s + Number(i.amount), 0), [incomes]);

  const monthIncome = useMemo(() => {
    const now = new Date();
    return incomes
      .filter((i) => {
        const d = new Date(i.income_date + "T12:00:00");
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((s, i) => s + Number(i.amount), 0);
  }, [incomes]);

  const campaignRaised = (cid: string) =>
    contributions.filter((c) => c.campaign_id === cid).reduce((s, c) => s + Number(c.amount), 0);

  const uploadReceipt = async (file: File, folder: string) => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("finance-receipts").upload(path, file);
    if (error) throw error;
    return path;
  };

  const submitIncome = async () => {
    if (!user?.id) return;
    if (!incomeForm.amount || Number(incomeForm.amount) <= 0) return toast.error("Monto inválido");
    setSaving(true);
    try {
      let receipt: string | null = null;
      if (incomeForm.file) receipt = await uploadReceipt(incomeForm.file, "income");
      const { error } = await supabase.from("finance_income").insert({
        income_date: incomeForm.income_date,
        amount: Number(incomeForm.amount),
        method: incomeForm.method,
        category: incomeForm.category || null,
        description: incomeForm.description || null,
        donor: incomeForm.donor || null,
        receipt_url: receipt,
        recorded_by: user.id,
      });
      if (error) throw error;
      toast.success("Ingreso registrado");
      setShowIncome(false);
      setIncomeForm({
        income_date: new Date().toISOString().slice(0, 10),
        amount: "", method: "efectivo", category: "ofrenda",
        description: "", donor: "", file: null,
      });
      loadAll();
    } catch (e: any) {
      toast.error(e?.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const submitCampaign = async () => {
    if (!user?.id) return;
    if (!campaignForm.title.trim()) return toast.error("Título requerido");
    if (!campaignForm.goal_amount || Number(campaignForm.goal_amount) <= 0) return toast.error("Meta inválida");
    setSaving(true);
    try {
      const { error } = await supabase.from("finance_campaigns").insert({
        title: campaignForm.title.trim(),
        description: campaignForm.description || null,
        goal_amount: Number(campaignForm.goal_amount),
        deadline: campaignForm.deadline || null,
        scope: campaignForm.scope,
        worship_group_id: campaignForm.scope === "por_grupo" ? campaignForm.worship_group_id || null : null,
        department: campaignForm.scope === "por_departamento" ? campaignForm.department || null : null,
        created_by: user.id,
      });
      if (error) throw error;
      toast.success("Campaña creada");
      setShowCampaign(false);
      setCampaignForm({ title: "", description: "", goal_amount: "", deadline: "", scope: "todos", worship_group_id: "", department: "" });
      loadAll();
    } catch (e: any) {
      toast.error(e?.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const submitContribution = async () => {
    if (!user?.id || !detailCampaign) return;
    if (!contribForm.amount || Number(contribForm.amount) <= 0) return toast.error("Monto inválido");
    setSaving(true);
    try {
      let receipt: string | null = null;
      if (contribForm.file) receipt = await uploadReceipt(contribForm.file, "contrib");
      const { error } = await supabase.from("finance_contributions").insert({
        campaign_id: detailCampaign.id,
        amount: Number(contribForm.amount),
        method: contribForm.method,
        contribution_date: contribForm.contribution_date,
        contributor_name: contribForm.contributor_name || null,
        note: contribForm.note || null,
        receipt_url: receipt,
        recorded_by: user.id,
      });
      if (error) throw error;
      toast.success("Aporte registrado");
      setShowContribute(false);
      setContribForm({
        amount: "", method: "efectivo",
        contribution_date: new Date().toISOString().slice(0, 10),
        contributor_name: "", note: "", file: null,
      });
      loadAll();
    } catch (e: any) {
      toast.error(e?.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const deleteIncome = async (id: string) => {
    if (!window.confirm("¿Eliminar este ingreso?")) return;
    const { error } = await supabase.from("finance_income").delete().eq("id", id);
    if (error) return toast.error("No se pudo eliminar");
    toast.success("Eliminado");
    loadAll();
  };

  const fmt = (n: number) => `$${n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 overflow-y-auto bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 break-words">Finanzas</h1>
            <p className="text-xs sm:text-sm text-slate-600">Ofrendas, donaciones y campañas de recaudación</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Total ingresos</div>
                <div className="text-lg font-bold text-slate-900">{fmt(totalIncome)}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Este mes</div>
                <div className="text-lg font-bold text-slate-900">{fmt(monthIncome)}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Campañas activas</div>
                <div className="text-lg font-bold text-slate-900">{campaigns.filter((c) => c.is_active).length}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="income"><Receipt className="w-4 h-4 mr-2" />Ingresos</TabsTrigger>
            <TabsTrigger value="campaigns"><Target className="w-4 h-4 mr-2" />Campañas</TabsTrigger>
          </TabsList>

          {/* INCOME TAB */}
          <TabsContent value="income" className="mt-4 space-y-3">
            {isAdmin && (
              <Button onClick={() => setShowIncome(true)} className="bg-emerald-600 text-white">
                <Plus className="w-4 h-4 mr-2" /> Registrar ingreso
              </Button>
            )}
            {incomes.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-slate-500">
                <Receipt className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                Sin ingresos registrados
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {incomes.map((i) => (
                  <Card key={i.id} className="border-0 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900">{fmt(Number(i.amount))}</span>
                          <Badge variant="outline" className="text-xs">{METHOD_LABEL[i.method]}</Badge>
                          {i.category && <Badge variant="secondary" className="text-xs">{i.category}</Badge>}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(i.income_date + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                          {i.donor && <> · {i.donor}</>}
                        </div>
                        {i.description && <div className="text-sm text-slate-600 mt-1 break-words">{i.description}</div>}
                      </div>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => deleteIncome(i.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* CAMPAIGNS TAB */}
          <TabsContent value="campaigns" className="mt-4 space-y-3">
            <Button onClick={() => setShowCampaign(true)} className="bg-emerald-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> Nueva campaña
            </Button>
            {campaigns.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-slate-500">
                <Target className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                Sin campañas creadas
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {campaigns.map((c) => {
                  const raised = campaignRaised(c.id);
                  const pct = Math.min(100, (raised / Number(c.goal_amount)) * 100);
                  return (
                    <Card key={c.id} className="border-0 shadow-md hover:shadow-lg transition cursor-pointer"
                      onClick={() => { setDetailCampaign(c); }}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base break-words">{c.title}</CardTitle>
                          {!c.is_active && <Badge variant="outline">Inactiva</Badge>}
                        </div>
                        {c.description && (
                          <CardDescription className="text-xs break-words line-clamp-2">{c.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold text-emerald-700">{fmt(raised)}</span>
                          <span className="text-slate-500">Meta: {fmt(Number(c.goal_amount))}</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                        <div className="mt-2 flex justify-between text-xs text-slate-500">
                          <span>{pct.toFixed(1)}%</span>
                          {c.deadline && <span>Cierra: {c.deadline}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* INCOME DIALOG */}
      <Dialog open={showIncome} onOpenChange={setShowIncome}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar ingreso</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={incomeForm.income_date} onChange={(e) => setIncomeForm({ ...incomeForm, income_date: e.target.value })} />
              </div>
              <div>
                <Label>Monto *</Label>
                <Input type="number" step="0.01" value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Método</Label>
                <Select value={incomeForm.method} onValueChange={(v) => setIncomeForm({ ...incomeForm, method: v as Method })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(METHOD_LABEL) as Method[]).map((m) => (
                      <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={incomeForm.category} onValueChange={(v) => setIncomeForm({ ...incomeForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ofrenda">Ofrenda</SelectItem>
                    <SelectItem value="diezmo">Diezmo</SelectItem>
                    <SelectItem value="donacion">Donación</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Donante / Fuente</Label>
              <Input value={incomeForm.donor} onChange={(e) => setIncomeForm({ ...incomeForm, donor: e.target.value })} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={incomeForm.description} onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Comprobante</Label>
              <input ref={incomeFileRef} type="file" accept="image/*,.pdf" className="hidden"
                onChange={(e) => setIncomeForm({ ...incomeForm, file: e.target.files?.[0] || null })} />
              <Button variant="outline" className="w-full" onClick={() => incomeFileRef.current?.click()}>
                <Camera className="w-4 h-4 mr-2" />
                {incomeForm.file ? incomeForm.file.name.slice(0, 30) : "Adjuntar comprobante"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIncome(false)}>Cancelar</Button>
            <Button onClick={submitIncome} disabled={saving} className="bg-emerald-600 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CAMPAIGN DIALOG */}
      <Dialog open={showCampaign} onOpenChange={setShowCampaign}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva campaña</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título *</Label>
              <Input value={campaignForm.title} onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })} placeholder="Campamento juvenil 2026" />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={campaignForm.description} onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Meta *</Label>
                <Input type="number" step="0.01" value={campaignForm.goal_amount} onChange={(e) => setCampaignForm({ ...campaignForm, goal_amount: e.target.value })} />
              </div>
              <div>
                <Label>Fecha límite</Label>
                <Input type="date" value={campaignForm.deadline} onChange={(e) => setCampaignForm({ ...campaignForm, deadline: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Alcance</Label>
              <Select value={campaignForm.scope} onValueChange={(v) => setCampaignForm({ ...campaignForm, scope: v as Scope })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los miembros</SelectItem>
                  <SelectItem value="sin_directiva">Miembros (sin directiva)</SelectItem>
                  <SelectItem value="por_grupo">Grupo específico</SelectItem>
                  <SelectItem value="por_departamento">Departamento específico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {campaignForm.scope === "por_grupo" && (
              <div>
                <Label>Grupo</Label>
                <Select value={campaignForm.worship_group_id} onValueChange={(v) => setCampaignForm({ ...campaignForm, worship_group_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un grupo" /></SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {campaignForm.scope === "por_departamento" && (
              <div>
                <Label>Departamento</Label>
                <Select value={campaignForm.department} onValueChange={(v) => setCampaignForm({ ...campaignForm, department: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona departamento" /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaign(false)}>Cancelar</Button>
            <Button onClick={submitCampaign} disabled={saving} className="bg-emerald-600 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CAMPAIGN DETAIL */}
      <Dialog open={!!detailCampaign} onOpenChange={(o) => !o && setDetailCampaign(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {detailCampaign && (() => {
            const raised = campaignRaised(detailCampaign.id);
            const pct = Math.min(100, (raised / Number(detailCampaign.goal_amount)) * 100);
            const list = contributions.filter((c) => c.campaign_id === detailCampaign.id);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="break-words">{detailCampaign.title}</DialogTitle>
                  {detailCampaign.description && (
                    <DialogDescription className="break-words">{detailCampaign.description}</DialogDescription>
                  )}
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-emerald-700">{fmt(raised)}</span>
                      <span className="text-slate-500">Meta: {fmt(Number(detailCampaign.goal_amount))}</span>
                    </div>
                    <Progress value={pct} className="h-3" />
                    <div className="mt-1 text-xs text-slate-500">{pct.toFixed(1)}% alcanzado · {list.length} aportes</div>
                  </div>
                  <Button className="w-full bg-emerald-600 text-white" onClick={() => setShowContribute(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Registrar aporte
                  </Button>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {list.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-sm border-b py-1.5">
                        <div className="min-w-0">
                          <div className="font-medium break-words">{c.contributor_name || "Anónimo"}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(c.contribution_date + "T12:00:00").toLocaleDateString("es-ES")} · {METHOD_LABEL[c.method]}
                          </div>
                        </div>
                        <div className="font-semibold text-emerald-700">{fmt(Number(c.amount))}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* CONTRIBUTION DIALOG */}
      <Dialog open={showContribute} onOpenChange={setShowContribute}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nuevo aporte</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Aportante</Label>
              <Input value={contribForm.contributor_name} onChange={(e) => setContribForm({ ...contribForm, contributor_name: e.target.value })} placeholder="Nombre" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Monto *</Label>
                <Input type="number" step="0.01" value={contribForm.amount} onChange={(e) => setContribForm({ ...contribForm, amount: e.target.value })} />
              </div>
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={contribForm.contribution_date} onChange={(e) => setContribForm({ ...contribForm, contribution_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Método</Label>
              <Select value={contribForm.method} onValueChange={(v) => setContribForm({ ...contribForm, method: v as Method })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(METHOD_LABEL) as Method[]).map((m) => (
                    <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nota</Label>
              <Textarea value={contribForm.note} onChange={(e) => setContribForm({ ...contribForm, note: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Comprobante</Label>
              <input ref={contribFileRef} type="file" accept="image/*,.pdf" className="hidden"
                onChange={(e) => setContribForm({ ...contribForm, file: e.target.files?.[0] || null })} />
              <Button variant="outline" className="w-full" onClick={() => contribFileRef.current?.click()}>
                <Camera className="w-4 h-4 mr-2" />
                {contribForm.file ? contribForm.file.name.slice(0, 30) : "Adjuntar comprobante"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContribute(false)}>Cancelar</Button>
            <Button onClick={submitContribution} disabled={saving} className="bg-emerald-600 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Finance;
