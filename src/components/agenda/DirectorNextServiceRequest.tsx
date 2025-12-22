import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import DirectorChangeRequest from "@/components/agenda/DirectorChangeRequest";

type ServiceLite = {
  id: string;
  leader: string;
  service_date: string;
  title: string;
};

const normalizeString = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function todayYMDInSantoDomingo() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santo_Domingo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

export default function DirectorNextServiceRequest() {
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<ServiceLite[]>([]);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [openRequest, setOpenRequest] = useState(false);

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        if (!user) {
          setCurrentUserName("");
          return;
        }

        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        if (profileErr) throw profileErr;

        const fullName = (profile?.full_name ?? "").trim();
        setCurrentUserName(fullName);

        const todayYmd = todayYMDInSantoDomingo();
        const startOfTodaySD = new Date(`${todayYmd}T00:00:00-04:00`).getTime();

        // Traemos un conjunto razonable (500) y filtramos en cliente para evitar problemas
        // de comparación por formato en la columna service_date.
        const { data: all, error: servicesErr } = await supabase
          .from("services")
          .select("id, leader, service_date, title")
          .order("service_date", { ascending: true })
          .limit(500);
        if (servicesErr) throw servicesErr;

        const normalizedUser = normalizeString(fullName);
        const mine = (all ?? [])
          .filter((s) => {
            const t = new Date(s.service_date).getTime();
            return Number.isFinite(t) && t >= startOfTodaySD && normalizeString(s.leader ?? "").includes(normalizedUser);
          })
          .slice(0, 10);

        setServices(mine);
        setSelectedServiceId(mine[0]?.id ?? "");
      } catch (e) {
        console.error(e);
        toast.error("No se pudieron cargar tus próximos servicios");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">Solicitar Reemplazo (Director)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Cargando tus próximos servicios…</div>
        ) : services.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">No encontramos servicios futuros asignados a tu nombre.</p>
            <p className="text-xs text-muted-foreground">
              Nota: el sistema detecta tus servicios comparando tu nombre de perfil con el campo <strong>Dirige</strong>.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Próximo servicio</label>
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => {
                    const date = new Date(s.service_date);
                    const label = `${format(date, "EEE dd/MM · HH:mm", { locale: es })} — ${s.title}`;
                    return (
                      <SelectItem key={s.id} value={s.id}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={() => setOpenRequest(true)} disabled={!selectedService}>
              <UserCheck className="w-4 h-4 mr-2" />
              Solicitar Reemplazo
            </Button>
          </>
        )}

        <Dialog open={openRequest} onOpenChange={setOpenRequest}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Solicitar Reemplazo de Director
              </DialogTitle>
            </DialogHeader>
            {selectedService && (
              <DirectorChangeRequest
                serviceId={selectedService.id}
                currentDirector={selectedService.leader}
                serviceDate={selectedService.service_date}
                serviceTitle={selectedService.title}
                onRequestCreated={() => {
                  setOpenRequest(false);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
