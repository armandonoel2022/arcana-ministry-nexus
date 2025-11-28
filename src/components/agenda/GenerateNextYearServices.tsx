import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GenerateNextYearServicesProps {
  onDataUpdate?: () => void;
}

const GenerateNextYearServices: React.FC<GenerateNextYearServicesProps> = ({ onDataUpdate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [nextYear, setNextYear] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [existingYears, setExistingYears] = useState<number[]>([]);
  const [customYear, setCustomYear] = useState<string>("");

  useEffect(() => {
    detectNextYearAndAvailable();
  }, []);

  const detectNextYearAndAvailable = async () => {
    try {
      const { data: allServices, error: servicesError } = await supabase
        .from("services")
        .select("service_date")
        .order("service_date", { ascending: false });

      if (servicesError) throw servicesError;

      const yearsInDb = [...new Set((allServices || []).map((s) => new Date(s.service_date).getFullYear()))].sort(
        (a, b) => a - b,
      );

      setExistingYears(yearsInDb);

      if (allServices && allServices.length > 0) {
        const lastYear = new Date(allServices[0].service_date).getFullYear();
        const next = lastYear + 1;
        setNextYear(next);
        setSelectedYear(next);

        const futureYears = [];
        for (let i = 0; i <= 5; i++) {
          futureYears.push(next + i);
        }
        setAvailableYears(futureYears);
      } else {
        const currentYear = new Date().getFullYear();
        setNextYear(currentYear);
        setSelectedYear(currentYear);

        const futureYears = [];
        for (let i = 0; i <= 5; i++) {
          futureYears.push(currentYear + i);
        }
        setAvailableYears(futureYears);
      }
    } catch (error) {
      console.error("Error detecting next year:", error);
      const currentYear = new Date().getFullYear();
      setNextYear(currentYear);
      setSelectedYear(currentYear);
      setAvailableYears([currentYear, currentYear + 1, currentYear + 2]);
      setExistingYears([]);
    }
  };

  // IDs de los grupos
  const GROUPS = {
    ALEIDA: "8218442a-9406-4b97-9212-29b50279f2ce",
    KEYLA: "1275fdde-515c-4843-a7a3-08daec62e69e",
    MASSY: "e5297132-d86c-4978-9b71-a98d2581b977",
  };

  // Directores con sus restricciones
  const DIRECTORS = {
    ONLY_8AM: ["Guarionex García", "Maria del A. Pérez Santana"],
    GROUP_LEADERS: {
      "Damaris Castillo Jimenez": "MASSY",
      "Keyla Yanira Medrano Medrano": "KEYLA",
      "Eliabi Joana Sierra Castillo": "ALEIDA",
    },
    ALL_DIRECTORS: [
      "Armando Noel Charle",
      "Damaris Castillo Jimenez",
      "Maria del A. Pérez Santana",
      "Roosevelt Martinez",
      "Guarionex García",
      "Eliabi Joana Sierra Castillo",
      "Keyla Yanira Medrano Medrano",
      "Denny Alberto Santana",
      "Félix Nicolás Peralta Hernández",
    ],
  };

  const getAllSundaysOfYear = (year: number) => {
    const sundays = [];

    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        if (date.getDay() === 0) {
          sundays.push(date);
        }
      }
    }

    return sundays;
  };

  const getGroupRotation = async (sundayIndex: number, year: number) => {
    const rotation = [
      { service1: "ALEIDA", service2: "KEYLA", rest: "MASSY" },
      { service1: "MASSY", service2: "ALEIDA", rest: "KEYLA" },
      { service1: "KEYLA", service2: "MASSY", rest: "ALEIDA" },
    ];

    if (sundayIndex === 0) {
      const { data: lastYearServices } = await supabase
        .from("services")
        .select("assigned_group_id, service_date")
        .gte("service_date", `${year - 1}-12-01`)
        .lt("service_date", `${year}-01-01`)
        .order("service_date", { ascending: false })
        .limit(2);

      if (lastYearServices && lastYearServices.length === 2) {
        const lastGroups = lastYearServices
          .map((s) => {
            if (s.assigned_group_id === GROUPS.ALEIDA) return "ALEIDA";
            if (s.assigned_group_id === GROUPS.KEYLA) return "KEYLA";
            if (s.assigned_group_id === GROUPS.MASSY) return "MASSY";
            return null;
          })
          .filter(Boolean);

        const allGroups: ("ALEIDA" | "KEYLA" | "MASSY")[] = ["ALEIDA", "KEYLA", "MASSY"];
        const restedGroup = allGroups.find((g) => !lastGroups.includes(g));

        if (restedGroup === "ALEIDA") return rotation[0];
        if (restedGroup === "KEYLA") return rotation[2];
        if (restedGroup === "MASSY") return rotation[1];
      }
    }

    return rotation[sundayIndex % 3];
  };

  const getDirectorAssignmentForMonth = (sundaysInMonth: Date[], groupRotations: any[]) => {
    const assignments = [];
    const monthlyDirectorPool = [...DIRECTORS.ALL_DIRECTORS];
    const usedDirectorsThisMonth = new Set<string>();

    // Mezclar los directores para el mes
    for (let i = monthlyDirectorPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [monthlyDirectorPool[i], monthlyDirectorPool[j]] = [monthlyDirectorPool[j], monthlyDirectorPool[i]];
    }

    // Para cada domingo del mes
    for (let i = 0; i < sundaysInMonth.length; i++) {
      const rotation = groupRotations[i];
      const usedDirectorsToday = new Set<string>();

      // Asignar director para servicio 8:00 AM
      let director1 = getAvailableDirector(
        monthlyDirectorPool,
        usedDirectorsThisMonth,
        usedDirectorsToday,
        "08:00",
        rotation.service1,
        rotation,
      );

      usedDirectorsToday.add(director1);
      usedDirectorsThisMonth.add(director1);

      // Asignar director para servicio 10:45 AM
      let director2 = getAvailableDirector(
        monthlyDirectorPool,
        usedDirectorsThisMonth,
        usedDirectorsToday,
        "10:45",
        rotation.service2,
        rotation,
      );

      usedDirectorsToday.add(director2);
      usedDirectorsThisMonth.add(director2);

      assignments.push({
        service1: { director: director1, group: rotation.service1 },
        service2: { director: director2, group: rotation.service2 },
      });
    }

    return assignments;
  };

  const getAvailableDirector = (
    directorPool: string[],
    usedDirectorsThisMonth: Set<string>,
    usedDirectorsToday: Set<string>,
    serviceTime: "08:00" | "10:45",
    groupName: string,
    groupRotation: any,
  ) => {
    // Primero buscar directores que no se han usado este mes
    for (const director of directorPool) {
      if (
        !usedDirectorsThisMonth.has(director) &&
        !usedDirectorsToday.has(director) &&
        isDirectorAvailableForService(director, serviceTime, groupName, groupRotation)
      ) {
        return director;
      }
    }

    // Si no hay disponibles que no se hayan usado este mes, buscar cualquier disponible
    for (const director of directorPool) {
      if (
        !usedDirectorsToday.has(director) &&
        isDirectorAvailableForService(director, serviceTime, groupName, groupRotation)
      ) {
        return director;
      }
    }

    // Último recurso: cualquier director que no se haya usado hoy
    for (const director of directorPool) {
      if (!usedDirectorsToday.has(director)) {
        return director;
      }
    }

    // Si todo falla, devolver el primero de la lista
    return directorPool[0];
  };

  const isDirectorAvailableForService = (
    director: string,
    serviceTime: "08:00" | "10:45",
    groupName: string,
    groupRotation: any,
  ) => {
    // 1. Verificar restricción de horario
    if (serviceTime === "10:45" && DIRECTORS.ONLY_8AM.includes(director)) {
      return false;
    }

    // 2. Verificar optimización para líderes de grupo
    const isGroupLeader = Object.keys(DIRECTORS.GROUP_LEADERS).includes(director);

    if (isGroupLeader) {
      const leaderGroup = DIRECTORS.GROUP_LEADERS[director as keyof typeof DIRECTORS.GROUP_LEADERS];
      const isGroupResting = groupRotation.rest === leaderGroup;

      if (!isGroupResting) {
        const groupSingsAt8AM = groupRotation.service1 === leaderGroup;
        const groupSingsAt1045AM = groupRotation.service2 === leaderGroup;

        // Si hay conflicto (líder asignado a hora diferente de su grupo)
        if ((serviceTime === "08:00" && groupSingsAt1045AM) || (serviceTime === "10:45" && groupSingsAt8AM)) {
          return false; // Este director no es ideal para este servicio
        }
      }
    }

    return true;
  };

  const recalculateMonthOrders = async (year: number) => {
    try {
      setIsGenerating(true);

      const { data: servicesData, error: fetchError } = await supabase
        .from("services")
        .select("id, service_date")
        .gte("service_date", `${year}-01-01`)
        .lt("service_date", `${year + 1}-01-01`)
        .order("service_date", { ascending: true });

      if (fetchError) throw fetchError;

      const updates = [];
      const servicesByDay = new Map<string, any[]>();

      servicesData.forEach((service) => {
        const date = new Date(service.service_date);
        const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        if (!servicesByDay.has(dayKey)) {
          servicesByDay.set(dayKey, []);
        }
        servicesByDay.get(dayKey)!.push(service);
      });

      const daysByMonth = new Map<string, string[]>();
      servicesByDay.forEach((services, dayKey) => {
        const [yearStr, monthStr] = dayKey.split("-");
        const monthKey = `${yearStr}-${monthStr}`;

        if (!daysByMonth.has(monthKey)) {
          daysByMonth.set(monthKey, []);
        }
        daysByMonth.get(monthKey)!.push(dayKey);
      });

      daysByMonth.forEach((days, monthKey) => {
        days.sort();
        days.forEach((dayKey, index) => {
          const sundayNumber = index + 1;
          const servicesOfDay = servicesByDay.get(dayKey) || [];

          servicesOfDay.forEach((service) => {
            updates.push({
              id: service.id,
              month_order: sundayNumber,
            });
          });
        });
      });

      for (const update of updates) {
        const { error: updateError } = await supabase
          .from("services")
          .update({ month_order: update.month_order })
          .eq("id", update.id);

        if (updateError) throw updateError;
      }

      toast.success(`Se recalcularon ${updates.length} servicios para el año ${year}`);
    } catch (error: any) {
      console.error("Error recalculando month_order:", error);
      toast.error("Error al recalcular los números de orden", {
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addCustomYear = () => {
    const year = parseInt(customYear);
    if (!isNaN(year) && year > 2000 && year < 2100) {
      if (!availableYears.includes(year)) {
        setAvailableYears((prev) => [...prev, year].sort());
      }
      setSelectedYear(year);
      setCustomYear("");
      toast.success(`Año ${year} agregado a la lista`);
    } else {
      toast.error("Por favor ingrese un año válido (2000-2100)");
    }
  };

  const removeYear = (yearToRemove: number) => {
    setAvailableYears((prev) => prev.filter((year) => year !== yearToRemove));
    if (selectedYear === yearToRemove) {
      setSelectedYear(availableYears[0] || null);
    }
    toast.success(`Año ${yearToRemove} removido de la lista`);
  };

  const generateServices = async () => {
    if (!selectedYear) {
      toast.error("No se pudo determinar el año a generar");
      return;
    }

    setIsGenerating(true);

    try {
      const sundays = getAllSundaysOfYear(selectedYear);
      const services = [];

      // Obtener rotaciones de grupos para todos los domingos
      const groupRotations = [];
      for (let i = 0; i < sundays.length; i++) {
        const rotation = await getGroupRotation(i, selectedYear);
        groupRotations.push(rotation);
      }

      // Agrupar domingos por mes
      const sundaysByMonth = new Map<number, Date[]>();
      sundays.forEach((sunday) => {
        const month = sunday.getMonth();
        if (!sundaysByMonth.has(month)) {
          sundaysByMonth.set(month, []);
        }
        sundaysByMonth.get(month)!.push(sunday);
      });

      // Generar asignaciones por mes
      for (const [month, monthSundays] of sundaysByMonth) {
        const monthRotations = monthSundays.map((_, index) => {
          const globalIndex = sundays.findIndex((s) => s.getTime() === monthSundays[index].getTime());
          return groupRotations[globalIndex];
        });

        const monthAssignments = getDirectorAssignmentForMonth(monthSundays, monthRotations);

        // Crear servicios para este mes
        const monthNames = [
          "Enero",
          "Febrero",
          "Marzo",
          "Abril",
          "Mayo",
          "Junio",
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre",
        ];
        const monthName = monthNames[month];

        monthSundays.forEach((sunday, sundayIndex) => {
          const assignment = monthAssignments[sundayIndex];
          const monthOrder = sundayIndex + 1;

          // Servicio 8:00 AM
          services.push({
            title: "08:00 a.m.",
            service_date: new Date(sunday.getTime() + 8 * 60 * 60 * 1000).toISOString(),
            leader: assignment.service1.director,
            assigned_group_id: GROUPS[assignment.service1.group as keyof typeof GROUPS],
            service_type: "Servicio Dominical",
            location: "Templo Principal",
            is_confirmed: false,
            month_name: monthName,
            month_order: monthOrder,
          });

          // Servicio 10:45 AM
          services.push({
            title: "10:45 a.m.",
            service_date: new Date(sunday.getTime() + 10.75 * 60 * 60 * 1000).toISOString(),
            leader: assignment.service2.director,
            assigned_group_id: GROUPS[assignment.service2.group as keyof typeof GROUPS],
            service_type: "Servicio Dominical",
            location: "Templo Principal",
            is_confirmed: false,
            month_name: monthName,
            month_order: monthOrder,
          });
        });
      }

      const { error } = await supabase.from("services").insert(services);

      if (error) throw error;

      toast.success(`Se generaron ${services.length} servicios para el año ${selectedYear}`, {
        description: `${sundays.length} domingos con 2 servicios cada uno`,
      });

      await detectNextYearAndAvailable();

      if (onDataUpdate) {
        onDataUpdate();
      }
    } catch (error: any) {
      console.error("Error generando servicios:", error);
      toast.error("Error al generar servicios", {
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteYear = async () => {
    if (!selectedYear) {
      toast.error("No se pudo determinar el año a eliminar");
      return;
    }

    // Verificar que el año realmente existe en la base de datos
    if (!existingYears.includes(selectedYear)) {
      toast.error(`No existen servicios para el año ${selectedYear}`);
      return;
    }

    setIsGenerating(true);

    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .gte("service_date", `${selectedYear}-01-01`)
        .lt("service_date", `${selectedYear + 1}-01-01`);

      if (error) throw error;

      toast.success(`Se eliminaron todos los servicios del año ${selectedYear}`);

      await detectNextYearAndAvailable();

      if (onDataUpdate) {
        onDataUpdate();
      }
    } catch (error: any) {
      console.error("Error eliminando servicios:", error);
      toast.error("Error al eliminar servicios", {
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Calcular años disponibles para generar (años sin datos)
  const yearsToGenerate = availableYears.filter((year) => !existingYears.includes(year));

  return (
    <div className="space-y-4">
      {/* Lista de años con datos */}
      {existingYears.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Años con servicios generados:</label>
          <div className="flex flex-wrap gap-2">
            {existingYears.map((year) => (
              <div key={year} className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                <span>{year}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Años disponibles para generar */}
      {yearsToGenerate.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Años disponibles para generar:</label>
          <div className="flex flex-wrap gap-2">
            {yearsToGenerate.map((year) => (
              <div key={year} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                <span>{year}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-2 flex-wrap">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="default" className="gap-2" disabled={isGenerating || yearsToGenerate.length === 0}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
              Generar Año
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Generar Servicios</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Selecciona el año a generar:</label>
                  <select
                    value={selectedYear || ""}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {yearsToGenerate.length > 0 ? (
                      yearsToGenerate.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))
                    ) : (
                      <option value="">No hay años disponibles para generar</option>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <p>Esta acción generará automáticamente todos los domingos del {selectedYear} con:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>✅ Cada director solo aparece UNA VEZ por mes</li>
                    <li>✅ Distribución equitativa de los 9 directores</li>
                    <li>✅ Rotación de grupos: Aleida → Keyla → Massy</li>
                    <li>✅ Coordinación de líderes con sus grupos</li>
                    <li>✅ Respeto a restricciones de horario</li>
                  </ul>
                  <p className="text-amber-600 font-medium mt-4">
                    Se crearán aproximadamente {getAllSundaysOfYear(selectedYear!).length * 2} servicios. ¿Desea
                    continuar?
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={generateServices}>Generar Servicios</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="gap-2"
              disabled={isGenerating || existingYears.length === 0}
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Eliminar Año
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Servicios del Año</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Selecciona el año a eliminar:</label>
                  <select
                    value={selectedYear || ""}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {existingYears.length > 0 ? (
                      existingYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))
                    ) : (
                      <option value="">No hay años con servicios</option>
                    )}
                  </select>
                </div>

                {existingYears.includes(selectedYear!) ? (
                  <div className="space-y-2">
                    <p className="text-red-600 font-medium">
                      ⚠️ Esta acción eliminará permanentemente todos los servicios del año {selectedYear}.
                    </p>
                    <p>Esta operación no se puede deshacer. ¿Está seguro que desea continuar?</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-amber-600 font-medium">
                      No existen servicios para el año {selectedYear} en la base de datos.
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              {existingYears.includes(selectedYear!) && (
                <AlertDialogAction onClick={deleteYear} className="bg-red-600 hover:bg-red-700">
                  Eliminar
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="gap-2"
              disabled={isGenerating || existingYears.length === 0}
            >
              Recalcular Orden
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Recalcular Números de Orden</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Selecciona el año a recalcular:
                  </label>
                  <select
                    value={selectedYear || ""}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {existingYears.length > 0 ? (
                      existingYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))
                    ) : (
                      <option value="">No hay años con servicios</option>
                    )}
                  </select>
                </div>

                {existingYears.includes(selectedYear!) ? (
                  <div className="space-y-2">
                    <p>
                      Esta acción recalculará el número de orden (1º, 2º, 3º, 4º, 5º domingo) para todos los servicios
                      del {selectedYear}.
                    </p>
                    <p className="text-amber-600 font-medium mt-4">
                      Esto es útil si los servicios fueron generados con un algoritmo anterior. ¿Desea continuar?
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-amber-600 font-medium">
                      No existen servicios para el año {selectedYear} en la base de datos.
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              {existingYears.includes(selectedYear!) && (
                <AlertDialogAction onClick={() => selectedYear && recalculateMonthOrders(selectedYear)}>
                  Recalcular
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default GenerateNextYearServices;
