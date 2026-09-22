import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BarChart3, Plus, Trash2, Loader2, Lock, CheckCircle2, Clock, Trophy, Vote, X, Camera,
} from "lucide-react";
import { toast } from "sonner";

export const POLL_CATEGORIES = [
  "Lugares para viajes",
  "Vestimenta para los coristas",
  "Vestimenta para los músicos",
  "Vestimenta para las danzarinas",
  "Vestimenta para los encargados de piso",
  "Vestimenta para los camarógrafos",
];

type Kind = "encuesta" | "votacion";

interface Poll {
  id: string;
  kind: Kind;
  title: string;
  description: string | null;
  category: string | null;
  position_title: string | null;
  multiple_choice: boolean;
  closes_at: string | null;
  status: "open" | "closed";
  created_at: string;
}

interface Option {
  id: string;
  poll_id: string;
  label: string;
  style: string | null;
  color: string | null;
  photo_url: string | null;
  member_id: string | null;
  sort_order: number;
}

interface Member {
  id: string;
  nombres: string;
  apellidos: string;
}

interface DraftOption {
  label: string;
  style: string;
  color: string;
  member_id: string;
  file: File | null;
}

const emptyOption = (): DraftOption => ({ label: "", style: "", color: "", member_id: "", file: null });

function isExpired(p: Poll) {
  return p.status === "closed" || (!!p.closes_at && new Date(p.closes_at).getTime() < Date.now());
}

function formatDeadline(iso: string | null) {
  if (!iso) return "Sin fecha de cierre";
  return new Date(iso).toLocaleString("es-DO", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxSide = 1000;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b || file), "image/jpeg", 0.8)
  );
}

interface Props {
  kind: Kind;
}

const PollsScreen: React.FC<Props> = ({ kind }) => {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const isVoting = kind === "votacion";

  const [polls, setPolls] = useState<Poll[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Poll | null>(null);
  const [selection, setSelection] = useState<Record<string, string[]>>({});
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: POLL_CATEGORIES[0],
    position_title: "",
    multiple_choice: false,
    closes_at: "",
    options: [emptyOption(), emptyOption()] as DraftOption[],
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      // Cerrar automáticamente las vencidas
      await supabase
        .from("polls")
        .update({ status: "closed" })
        .eq("kind", kind)
        .eq("status", "open")
        .lt("closes_at", new Date().toISOString());

      const { data: pollsData, error } = await supabase
        .from("polls")
        .select("*")
        .eq("kind", kind)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const list = (pollsData || []) as Poll[];
      setPolls(list);

      const ids = list.map((p) => p.id);
      if (ids.length) {
        const [{ data: opts }, { data: votes }, { data: parts }] = await Promise.all([
          supabase.from("poll_options").select("*").in("poll_id", ids).order("sort_order"),
          supabase.from("poll_votes").select("option_id").in("poll_id", ids),
          user?.id
            ? supabase.from("poll_participants").select("poll_id").in("poll_id", ids).eq("user_id", user.id)
            : Promise.resolve({ data: [] as any[] }),
        ]);
        setOptions((opts || []) as Option[]);
        const c: Record<string, number> = {};
        (votes || []).forEach((v: any) => { c[v.option_id] = (c[v.option_id] || 0) + 1; });
        setCounts(c);
        setVoted(new Set((parts || []).map((p: any) => p.poll_id)));
      } else {
        setOptions([]);
        setCounts({});
        setVoted(new Set());
      }
    } catch (e: any) {
      toast.error(e?.message || "Error cargando la información");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    if (isVoting) {
      supabase
        .from("members")
        .select("id, nombres, apellidos")
        .eq("is_active", true)
        .order("nombres")
        .then(({ data }) => setMembers((data || []) as Member[]));
      supabase
        .from("polls")
        .select("position_title")
        .eq("kind", "votacion")
        .not("position_title", "is", null)
        .then(({ data }) => {
          const uniq = Array.from(new Set((data || []).map((d: any) => d.position_title).filter(Boolean)));
          setPositions(uniq as string[]);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, kind]);

  // URLs firmadas de las fotos
  useEffect(() => {
    const missing = options.filter((o) => o.photo_url && !photoUrls[o.id]);
    if (!missing.length) return;
    (async () => {
      const updates: Record<string, string> = {};
      for (const o of missing) {
        const { data } = await supabase.storage.from("poll-photos").createSignedUrl(o.photo_url!, 3600);
        if (data?.signedUrl) updates[o.id] = data.signedUrl;
      }
      if (Object.keys(updates).length) setPhotoUrls((p) => ({ ...p, ...updates }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  const memberName = (id: string | null) => {
    const m = members.find((x) => x.id === id);
    return m ? `${m.nombres} ${m.apellidos}` : null;
  };

  const visiblePolls = useMemo(() => {
    if (isVoting || categoryFilter === "all") return polls;
    return polls.filter((p) => p.category === categoryFilter);
  }, [polls, categoryFilter, isVoting]);

  const resetForm = () =>
    setForm({
      title: "", description: "", category: POLL_CATEGORIES[0], position_title: "",
      multiple_choice: false, closes_at: "", options: [emptyOption(), emptyOption()],
    });

  const handleCreate = async () => {
    if (!user?.id) return;
    const title = isVoting ? form.position_title.trim() : form.title.trim();
    if (!title) return toast.error(isVoting ? "Escribe el cargo a elegir" : "Escribe el título de la encuesta");
    const validOptions = form.options.filter((o) =>
      isVoting ? o.member_id : o.label.trim() || o.style.trim() || o.color.trim()
    );
    if (validOptions.length < 2) return toast.error("Agrega al menos dos opciones");

    setSaving(true);
    try {
      const { data: poll, error } = await supabase
        .from("polls")
        .insert({
          kind,
          title,
          description: form.description.trim() || null,
          category: isVoting ? null : form.category,
          position_title: isVoting ? form.position_title.trim() : null,
          multiple_choice: isVoting ? false : form.multiple_choice,
          closes_at: form.closes_at ? new Date(form.closes_at).toISOString() : null,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      const rows = [];
      for (let i = 0; i < validOptions.length; i++) {
        const o = validOptions[i];
        let photoPath: string | null = null;
        if (o.file) {
          const blob = await compressImage(o.file);
          const path = `${poll.id}/${crypto.randomUUID()}.jpg`;
          const { error: upErr } = await supabase.storage
            .from("poll-photos")
            .upload(path, blob, { contentType: "image/jpeg" });
          if (upErr) throw upErr;
          photoPath = path;
        }
        rows.push({
          poll_id: poll.id,
          label: isVoting ? (memberName(o.member_id) || "Candidato") : o.label.trim() || o.style.trim() || o.color.trim(),
          style: o.style.trim() || null,
          color: o.color.trim() || null,
          member_id: isVoting ? o.member_id : null,
          photo_url: photoPath,
          sort_order: i,
        });
      }
      const { error: optErr } = await supabase.from("poll_options").insert(rows);
      if (optErr) throw optErr;

      toast.success(isVoting ? "Votación creada" : "Encuesta creada");
      setShowForm(false);
      resetForm();
      loadAll();
    } catch (e: any) {
      toast.error(e?.message || "No se pudo crear");
    } finally {
      setSaving(false);
    }
  };

  const handleVote = async (poll: Poll) => {
    if (!user?.id) return;
    const chosen = selection[poll.id] || [];
    if (!chosen.length) return toast.error("Selecciona una opción");
    setSending(poll.id);
    try {
      // 1) Registrar participación (impide votar dos veces, sin guardar la elección)
      const { error: partErr } = await supabase
        .from("poll_participants")
        .insert({ poll_id: poll.id, user_id: user.id });
      if (partErr) {
        if ((partErr as any).code === "23505") throw new Error("Ya participaste en esta votación");
        throw partErr;
      }
      // 2) Registrar voto anónimo
      const { error: voteErr } = await supabase
        .from("poll_votes")
        .insert(chosen.map((option_id) => ({ poll_id: poll.id, option_id })));
      if (voteErr) throw voteErr;

      toast.success("Tu voto fue registrado de forma anónima");
      setSelection((s) => ({ ...s, [poll.id]: [] }));
      loadAll();
    } catch (e: any) {
      toast.error(e?.message || "No se pudo registrar tu voto");
    } finally {
      setSending(null);
    }
  };

  const toggleChoice = (poll: Poll, optionId: string) => {
    setSelection((s) => {
      const cur = s[poll.id] || [];
      if (poll.multiple_choice) {
        return { ...s, [poll.id]: cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId] };
      }
      return { ...s, [poll.id]: [optionId] };
    });
  };

  const closePoll = async (poll: Poll) => {
    const { error } = await supabase.from("polls").update({ status: "closed" }).eq("id", poll.id);
    if (error) return toast.error("No se pudo cerrar");
    toast.success("Cerrada");
    loadAll();
  };

  const reopenPoll = async (poll: Poll) => {
    const { error } = await supabase
      .from("polls")
      .update({ status: "open", closes_at: null })
      .eq("id", poll.id);
    if (error) return toast.error("No se pudo reabrir");
    toast.success("Reabierta");
    loadAll();
  };

  const deletePoll = async (poll: Poll) => {
    const { error } = await supabase.from("polls").delete().eq("id", poll.id);
    if (error) return toast.error("No se pudo eliminar");
    toast.success("Eliminada");
    setToDelete(null);
    loadAll();
  };

  const Icon = isVoting ? Vote : BarChart3;

  return (
    <div className="fixed inset-0 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg">
            <Icon className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 break-words">
              {isVoting ? "Votaciones" : "Encuestas"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {isVoting
                ? "Elección de integrantes por cargo — voto anónimo"
                : "Opinión del ministerio por categoría — voto anónimo"}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Nueva</span>
            </Button>
          )}
        </div>

        {!isVoting && (
          <div className="mb-5">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {POLL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : visiblePolls.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-14 text-center text-slate-500">
              <Icon className="w-10 h-10 mx-auto mb-3 opacity-40" />
              Todavía no hay {isVoting ? "votaciones" : "encuestas"}.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {visiblePolls.map((poll) => {
              const opts = options.filter((o) => o.poll_id === poll.id);
              const total = opts.reduce((s, o) => s + (counts[o.id] || 0), 0);
              const closed = isExpired(poll);
              const alreadyVoted = voted.has(poll.id);
              const showResults = closed || alreadyVoted;
              const top = Math.max(0, ...opts.map((o) => counts[o.id] || 0));

              return (
                <Card key={poll.id} className="overflow-hidden border-slate-200 shadow-sm">
                  <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-blue-50/60">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg break-words">{poll.title}</CardTitle>
                        {poll.description && (
                          <p className="text-xs text-slate-600 mt-1 break-words">{poll.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {poll.category && <Badge variant="secondary" className="text-[10px]">{poll.category}</Badge>}
                          <Badge className={closed ? "bg-slate-200 text-slate-700 text-[10px]" : "bg-emerald-100 text-emerald-800 text-[10px]"}>
                            {closed ? "Cerrada" : "Abierta"}
                          </Badge>
                          {poll.multiple_choice && <Badge variant="outline" className="text-[10px]">Selección múltiple</Badge>}
                        </div>
                        <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
                          <Clock className="w-3 h-3" /> {formatDeadline(poll.closes_at)}
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="flex flex-col gap-1">
                          <Button size="sm" variant="ghost" onClick={() => (closed ? reopenPoll(poll) : closePoll(poll))}>
                            {closed ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setToDelete(poll)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-3">
                    {opts.map((o) => {
                      const votes = counts[o.id] || 0;
                      const pct = total ? Math.round((votes / total) * 100) : 0;
                      const chosen = (selection[poll.id] || []).includes(o.id);
                      const isWinner = closed && total > 0 && votes === top;

                      return (
                        <div
                          key={o.id}
                          onClick={() => !showResults && toggleChoice(poll, o.id)}
                          className={`rounded-xl border p-3 transition ${
                            showResults ? "border-slate-200" : "cursor-pointer hover:border-primary/60"
                          } ${chosen ? "border-primary bg-primary/5" : "bg-white"}`}
                        >
                          <div className="flex items-center gap-3">
                            {photoUrls[o.id] && (
                              <img src={photoUrls[o.id]} alt={o.label} className="w-12 h-12 rounded-lg object-cover" />
                            )}
                            {o.color && (
                              <span
                                className="w-6 h-6 rounded-full border border-slate-300 shrink-0"
                                style={{ backgroundColor: o.color }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 break-words">{o.label}</p>
                              {o.style && <p className="text-[11px] text-slate-500 break-words">Estilo: {o.style}</p>}
                            </div>
                            {isWinner && <Trophy className="w-4 h-4 text-amber-500 shrink-0" />}
                            {showResults && (
                              <span className="text-xs font-semibold text-slate-700 shrink-0">{pct}%</span>
                            )}
                          </div>
                          {showResults && (
                            <div className="mt-2">
                              <Progress value={pct} className="h-2" />
                              <p className="text-[11px] text-slate-500 mt-1">
                                {votes} {votes === 1 ? "voto" : "votos"}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500">
                        {total} {total === 1 ? "voto en total" : "votos en total"}
                      </span>
                      {!closed && !alreadyVoted && (
                        <Button
                          size="sm"
                          disabled={sending === poll.id}
                          onClick={() => handleVote(poll)}
                          className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground"
                        >
                          {sending === poll.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Votar"}
                        </Button>
                      )}
                      {alreadyVoted && !closed && (
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ya votaste
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Crear */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isVoting ? "Nueva votación" : "Nueva encuesta"}</DialogTitle>
            <DialogDescription>
              Los votos se guardan de forma anónima; nadie puede saber quién eligió qué.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isVoting ? (
              <div className="space-y-2">
                <Label>Cargo a elegir</Label>
                <Input
                  list="cargos-previos"
                  placeholder="Ej. Director de alabanza, Encargado de piso…"
                  value={form.position_title}
                  onChange={(e) => setForm({ ...form, position_title: e.target.value })}
                />
                <datalist id="cargos-previos">
                  {positions.map((p) => <option key={p} value={p} />)}
                </datalist>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    placeholder="Ej. Color de vestimenta para diciembre"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {POLL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha y hora de cierre (opcional)</Label>
              <Input
                type="datetime-local"
                value={form.closes_at}
                onChange={(e) => setForm({ ...form, closes_at: e.target.value })}
              />
            </div>

            {!isVoting && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="multi"
                  checked={form.multiple_choice}
                  onCheckedChange={(v) => setForm({ ...form, multiple_choice: !!v })}
                />
                <Label htmlFor="multi" className="text-sm font-normal">
                  Permitir elegir varias opciones
                </Label>
              </div>
            )}

            <div className="space-y-3">
              <Label>{isVoting ? "Candidatos" : "Opciones"}</Label>
              {form.options.map((o, idx) => (
                <div key={idx} className="rounded-xl border p-3 space-y-2 bg-slate-50/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">#{idx + 1}</span>
                    {form.options.length > 2 && (
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => setForm({ ...form, options: form.options.filter((_, i) => i !== idx) })}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {isVoting ? (
                    <Select
                      value={o.member_id}
                      onValueChange={(v) => {
                        const next = [...form.options];
                        next[idx] = { ...o, member_id: v };
                        setForm({ ...form, options: next });
                      }}
                    >
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Selecciona un integrante" /></SelectTrigger>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.nombres} {m.apellidos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <>
                      <Input
                        className="bg-white"
                        placeholder="Opción (ej. Punta Cana / Traje azul marino)"
                        value={o.label}
                        onChange={(e) => {
                          const next = [...form.options];
                          next[idx] = { ...o, label: e.target.value };
                          setForm({ ...form, options: next });
                        }}
                      />
                      <div className="flex gap-2">
                        <Input
                          className="bg-white flex-1"
                          placeholder="Estilo (formal, casual…)"
                          value={o.style}
                          onChange={(e) => {
                            const next = [...form.options];
                            next[idx] = { ...o, style: e.target.value };
                            setForm({ ...form, options: next });
                          }}
                        />
                        <Input
                          type="color"
                          className="w-14 p-1 bg-white"
                          value={o.color || "#1e3a8a"}
                          onChange={(e) => {
                            const next = [...form.options];
                            next[idx] = { ...o, color: e.target.value };
                            setForm({ ...form, options: next });
                          }}
                        />
                      </div>
                    </>
                  )}

                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <Camera className="w-4 h-4" />
                    {o.file ? o.file.name : "Agregar foto (opcional)"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const next = [...form.options];
                        next[idx] = { ...o, file: e.target.files?.[0] || null };
                        setForm({ ...form, options: next });
                      }}
                    />
                  </label>
                </div>
              ))}
              <Button
                variant="outline" size="sm"
                onClick={() => setForm({ ...form, options: [...form.options, emptyOption()] })}
              >
                <Plus className="w-4 h-4 mr-1" /> Agregar opción
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar "{toDelete?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán también todas las opciones y los votos registrados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && deletePoll(toDelete)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PollsScreen;
