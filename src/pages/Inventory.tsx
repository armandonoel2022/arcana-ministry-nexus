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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Package, Plus, Camera, Loader2, Mic, Guitar, Video, Music, Trash2, AlertTriangle, Wrench } from "lucide-react";
import { toast } from "sonner";

type Department = "voces_sonido" | "instrumentos" | "multimedia" | "danza";
type Status = "in_stock" | "assigned" | "loaned" | "damaged" | "retired";

interface Item {
  id: string;
  department: Department;
  subcategory: string | null;
  name: string;
  photo_url: string | null;
  status: Status;
  assigned_member_id: string | null;
  loaned_to: string | null;
  acquisition_date: string | null;
  acquisition_cost: number | null;
  useful_life_months: number | null;
  serial_number: string | null;
  notes: string | null;
  created_at: string;
}

const DEPARTMENTS: { key: Department; label: string; icon: any; color: string }[] = [
  { key: "voces_sonido", label: "Voces y Sonido", icon: Mic, color: "from-blue-500 to-indigo-600" },
  { key: "instrumentos", label: "Instrumentos", icon: Guitar, color: "from-amber-500 to-orange-600" },
  { key: "multimedia", label: "Multimedia", icon: Video, color: "from-purple-500 to-fuchsia-600" },
  { key: "danza", label: "Danza", icon: Music, color: "from-pink-500 to-rose-600" },
];

const STATUS_LABEL: Record<Status, string> = {
  in_stock: "En stock",
  assigned: "Asignado",
  loaned: "Prestado",
  damaged: "Dañado",
  retired: "Retirado",
};

const STATUS_COLOR: Record<Status, string> = {
  in_stock: "bg-emerald-100 text-emerald-800",
  assigned: "bg-blue-100 text-blue-800",
  loaned: "bg-amber-100 text-amber-800",
  damaged: "bg-red-100 text-red-800",
  retired: "bg-gray-200 text-gray-700",
};

function calcDepreciation(cost: number | null, months: number | null, acquired: string | null) {
  if (!cost || !months || !acquired) return null;
  const now = new Date();
  const start = new Date(acquired + "T12:00:00");
  const elapsed = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
  const usedPct = Math.min(1, elapsed / months);
  const currentValue = cost * (1 - usedPct);
  return { currentValue, usedPct: usedPct * 100, elapsed };
}

const Inventory: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, roles } = usePermissions();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState<Department>("voces_sonido");
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<Item | null>(null);
  const [toDelete, setToDelete] = useState<Item | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [leaderDepts, setLeaderDepts] = useState<Department[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    subcategory: "",
    serial_number: "",
    acquisition_date: "",
    acquisition_cost: "",
    useful_life_months: "",
    notes: "",
    status: "in_stock" as Status,
    file: null as File | null,
  });

  const loadItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Error cargando inventario");
    else setItems((data || []) as Item[]);
    setLoading(false);
  };

  const loadLeaderships = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("department_leaders")
      .select("department")
      .eq("leader_user_id", user.id);
    setLeaderDepts((data || []).map((d: any) => d.department));
  };

  useEffect(() => {
    loadItems();
    loadLeaderships();
  }, [user?.id]);

  // Resolve signed URLs
  useEffect(() => {
    const missing = items.filter((i) => i.photo_url && !photoUrls[i.id]);
    if (missing.length === 0) return;
    (async () => {
      const updates: Record<string, string> = {};
      for (const it of missing) {
        const path = it.photo_url!;
        const { data } = await supabase.storage.from("inventory-photos").createSignedUrl(path, 3600);
        if (data?.signedUrl) updates[it.id] = data.signedUrl;
      }
      if (Object.keys(updates).length) setPhotoUrls((p) => ({ ...p, ...updates }));
    })();
  }, [items]);

  const canEditDept = (d: Department) => isAdmin || leaderDepts.includes(d);

  const filtered = useMemo(() => items.filter((i) => i.department === dept), [items, dept]);

  const totalValue = useMemo(
    () => filtered.reduce((s, i) => s + Number(i.acquisition_cost || 0), 0),
    [filtered]
  );

  const handleAdd = async () => {
    if (!user?.id) return;
    if (!form.name.trim()) return toast.error("El nombre es obligatorio");
    if (!canEditDept(dept)) return toast.error("No tienes permisos en este departamento");
    setSaving(true);
    try {
      let photoPath: string | null = null;
      if (form.file) {
        const ext = form.file.name.split(".").pop() || "jpg";
        const path = `${dept}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("inventory-photos")
          .upload(path, form.file, { upsert: false });
        if (upErr) throw upErr;
        photoPath = path;
      }
      const { error } = await supabase.from("inventory_items").insert({
        department: dept,
        name: form.name.trim(),
        subcategory: form.subcategory.trim() || null,
        serial_number: form.serial_number.trim() || null,
        acquisition_date: form.acquisition_date || null,
        acquisition_cost: form.acquisition_cost ? Number(form.acquisition_cost) : null,
        useful_life_months: form.useful_life_months ? Number(form.useful_life_months) : null,
        notes: form.notes.trim() || null,
        status: form.status,
        photo_url: photoPath,
        created_by: user.id,
      });
      if (error) throw error;
      toast.success("Equipo agregado");
      setShowAdd(false);
      setForm({
        name: "", subcategory: "", serial_number: "", acquisition_date: "",
        acquisition_cost: "", useful_life_months: "", notes: "",
        status: "in_stock", file: null,
      });
      loadItems();
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Item) => {
    const { error } = await supabase.from("inventory_items").delete().eq("id", item.id);
    if (error) return toast.error("No se pudo eliminar");
    if (item.photo_url) {
      await supabase.storage.from("inventory-photos").remove([item.photo_url]);
    }
    toast.success("Eliminado");
    setToDelete(null);
    setDetail(null);
    loadItems();
  };

  const requestReplacement = async (item: Item) => {
    if (!user?.id) return;
    const reason = window.prompt(`Solicitar reemplazo/reparación de "${item.name}". Motivo:`);
    if (!reason?.trim()) return;
    const { error } = await supabase.from("inventory_replacement_requests").insert({
      item_id: item.id,
      requested_by: user.id,
      reason: reason.trim(),
    });
    if (error) return toast.error("No se pudo enviar la solicitud");
    toast.success("Solicitud enviada al administrador");
  };

  const DeptIcon = DEPARTMENTS.find((d) => d.key === dept)?.icon || Package;
  const canEdit = canEditDept(dept);

  return (
    <div className="fixed inset-0 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 break-words">
              Inventario
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Equipos e instrumentos del ministerio por departamento
            </p>
          </div>
          {canEdit && (
            <Button onClick={() => setShowAdd(true)} className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white">
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Nuevo</span>
            </Button>
          )}
        </div>

        <Tabs value={dept} onValueChange={(v) => setDept(v as Department)}>
          <TabsList className="grid grid-cols-4 w-full h-auto p-1 bg-white/70 backdrop-blur border shadow-sm">
            {DEPARTMENTS.map((d) => {
              const Icon = d.icon;
              const count = items.filter((i) => i.department === d.key).length;
              return (
                <TabsTrigger key={d.key} value={d.key} className="flex flex-col gap-1 py-2 data-[state=active]:bg-white data-[state=active]:shadow">
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] sm:text-xs font-medium leading-tight break-words">
                    {d.label}
                  </span>
                  <span className="text-[10px] text-slate-500">{count}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {DEPARTMENTS.map((d) => (
            <TabsContent key={d.key} value={d.key} className="mt-4">
              <Card className="border-0 shadow-md mb-4">
                <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${d.color} flex items-center justify-center text-white shadow`}>
                      <DeptIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{d.label}</div>
                      <div className="text-xs text-slate-500">
                        {filtered.length} equipos · Valor total: ${totalValue.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  {!canEdit && (
                    <Badge variant="outline" className="text-xs">Solo lectura</Badge>
                  )}
                </CardContent>
              </Card>

              {loading ? (
                <div className="py-12 flex justify-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <Package className="w-14 h-14 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">Sin equipos registrados</p>
                  {canEdit && <p className="text-sm mt-1">Agrega el primero con el botón "Nuevo"</p>}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {filtered.map((item) => {
                    const dep = calcDepreciation(item.acquisition_cost, item.useful_life_months, item.acquisition_date);
                    return (
                      <button
                        key={item.id}
                        onClick={() => setDetail(item)}
                        className="text-left bg-white rounded-xl overflow-hidden shadow-sm border hover:shadow-lg transition-all"
                      >
                        <div className="aspect-square bg-slate-100 relative overflow-hidden">
                          {item.photo_url && photoUrls[item.id] ? (
                            <img src={photoUrls[item.id]} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <DeptIcon className="w-12 h-12" />
                            </div>
                          )}
                          <Badge className={`absolute top-2 left-2 text-[10px] ${STATUS_COLOR[item.status]}`}>
                            {STATUS_LABEL[item.status]}
                          </Badge>
                        </div>
                        <div className="p-3">
                          <div className="font-semibold text-sm text-slate-900 break-words line-clamp-2">{item.name}</div>
                          {item.subcategory && (
                            <div className="text-xs text-slate-500 break-words">{item.subcategory}</div>
                          )}
                          {dep && (
                            <div className="text-[11px] text-slate-500 mt-1">
                              Valor actual: <span className="font-medium text-slate-700">${dep.currentValue.toFixed(0)}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo equipo — {DEPARTMENTS.find((d) => d.key === dept)?.label}</DialogTitle>
            <DialogDescription>Registra un equipo con foto y datos de adquisición.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Micrófono Shure SM58" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Subcategoría</Label>
                <Input value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} placeholder="Micrófono, Cable..." />
              </div>
              <div>
                <Label>Serial / Modelo</Label>
                <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha adquisición</Label>
                <Input type="date" value={form.acquisition_date} onChange={(e) => setForm({ ...form, acquisition_date: e.target.value })} />
              </div>
              <div>
                <Label>Costo</Label>
                <Input type="number" step="0.01" value={form.acquisition_cost} onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vida útil (meses)</Label>
                <Input type="number" value={form.useful_life_months} onChange={(e) => setForm({ ...form, useful_life_months: e.target.value })} placeholder="Ej: 60" />
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Foto</Label>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} />
              <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                <Camera className="w-4 h-4 mr-2" />
                {form.file ? form.file.name.slice(0, 30) : "Tomar / elegir foto"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={saving} className="bg-indigo-600 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {detail && (
            <>
              {detail.photo_url && photoUrls[detail.id] && (
                <div className="bg-black max-h-[50vh] flex items-center justify-center">
                  <img src={photoUrls[detail.id]} alt={detail.name} className="max-h-[50vh] w-auto object-contain" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <DialogHeader>
                  <DialogTitle className="break-words">{detail.name}</DialogTitle>
                  <DialogDescription>
                    <Badge className={STATUS_COLOR[detail.status]}>{STATUS_LABEL[detail.status]}</Badge>
                    {detail.subcategory && <span className="ml-2 text-slate-600">{detail.subcategory}</span>}
                  </DialogDescription>
                </DialogHeader>
                {detail.serial_number && <div className="text-sm"><strong>Serial:</strong> {detail.serial_number}</div>}
                {detail.acquisition_date && <div className="text-sm"><strong>Adquirido:</strong> {detail.acquisition_date}</div>}
                {detail.acquisition_cost && <div className="text-sm"><strong>Costo:</strong> ${Number(detail.acquisition_cost).toLocaleString()}</div>}
                {(() => {
                  const d = calcDepreciation(detail.acquisition_cost, detail.useful_life_months, detail.acquisition_date);
                  if (!d) return null;
                  return (
                    <div className="text-sm bg-slate-50 rounded p-2">
                      <strong>Depreciación:</strong> {d.usedPct.toFixed(1)}% usada · Valor actual: ${d.currentValue.toFixed(2)}
                    </div>
                  );
                })()}
                {detail.notes && <div className="text-sm text-slate-600 whitespace-pre-wrap break-words">{detail.notes}</div>}
                <DialogFooter className="pt-2 flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => requestReplacement(detail)}>
                    <Wrench className="w-4 h-4 mr-2" /> Solicitar reemplazo
                  </Button>
                  {(isAdmin || leaderDepts.includes(detail.department)) && (
                    <Button variant="destructive" onClick={() => setToDelete(detail)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                    </Button>
                  )}
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar equipo?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => toDelete && handleDelete(toDelete)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Inventory;
