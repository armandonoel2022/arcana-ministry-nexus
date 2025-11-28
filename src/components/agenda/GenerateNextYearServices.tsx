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

        const allGroups = ["ALEIDA", "KEYLA", "MASSY"];
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
    const directorUsage = new Map();
    const monthlyDirectorPool = [...DIRECTORS.ALL_DIRECTORS];

    // Mezclar los directores para evitar patrones fijos
    for (let i = monthlyDirectorPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [monthlyDirectorPool[i], monthlyDirectorPool[j]] = [monthlyDirectorPool[j], monthlyDirectorPool[i]];
    }

    let directorIndex = 0;

    for (let i = 0; i < sundaysInMonth.length; i++) {
      const rotation = groupRotations[i];
      const usedDirectorsToday = new Set();

      // Asignar director para servicio 8:00 AM
      let director1 = monthlyDirectorPool[directorIndex % monthlyDirectorPool.length];

      // Verificar restricciones y optimizar asignación
      director1 = optimizeDirectorAssignment(
        director1,
        "08:00",
        rotation.service1,
        usedDirectorsToday,
        rotation,
        directorUsage,
        i,
      );

      usedDirectorsToday.add(director1);
      updateDirectorUsage(directorUsage, director1, i);
      directorIndex++;

      // Asignar director para servicio 10:45 AM
      let director2 = monthlyDirectorPool[directorIndex % monthlyDirectorPool.length];

      // Si es el mismo director, tomar el siguiente
      if (director2 === director1) {
        directorIndex++;
        director2 = monthlyDirectorPool[directorIndex % monthlyDirectorPool.length];
      }

      director2 = optimizeDirectorAssignment(
        director2,
        "10:45",
        rotation.service2,
        usedDirectorsToday,
        rotation,
        directorUsage,
        i,
      );

      usedDirectorsToday.add(director2);
      updateDirectorUsage(directorUsage, director2, i);
      directorIndex++;

      assignments.push({
        service1: { director: director1, group: rotation.service1 },
        service2: { director: director2, group: rotation.service2 },
      });
    }

    return assignments;
  };

  const optimizeDirectorAssignment = (
    director: string,
    serviceTime: "08:00" | "10:45",
    groupName: string,
    usedDirectorsToday: Set<string>,
    groupRotation: any,
    directorUsage: Map<string, number[]>,
    sundayIndex: number,
  ) => {
    let optimizedDirector = director;

    // 1. Verificar restricción de horario (solo 8:00 AM)
    if (serviceTime === "10:45" && DIRECTORS.ONLY_8AM.includes(optimizedDirector)) {
      optimizedDirector = findAlternativeDirector(optimizedDirector, usedDirectorsToday, serviceTime);
    }

    // 2. Verificar si el director ya fue usado hoy
    if (usedDirectorsToday.has(optimizedDirector)) {
      optimizedDirector = findAlternativeDirector(optimizedDirector, usedDirectorsToday, serviceTime);
    }

    // 3. Optimizar líderes de grupo con sus grupos
    const isGroupLeader = Object.keys(DIRECTORS.GROUP_LEADERS).includes(optimizedDirector);

    if (isGroupLeader) {
      const leaderGroup = DIRECTORS.GROUP_LEADERS[optimizedDirector as keyof typeof DIRECTORS.GROUP_LEADERS];
      const isGroupResting = groupRotation.rest === leaderGroup;

      if (!isGroupResting) {
        const groupSingsAt8AM = groupRotation.service1 === leaderGroup;
        const groupSingsAt1045AM = groupRotation.service2 === leaderGroup;

        // Si hay conflicto (líder asignado a hora diferente de su grupo)
        if ((serviceTime === "08:00" && groupSingsAt1045AM) || (serviceTime === "10:45" && groupSingsAt8AM)) {
          // Buscar intercambio con otro director que no tenga conflicto
          const alternative = findAlternativeDirectorForGroupConflict(
            optimizedDirector,
            usedDirectorsToday,
            serviceTime,
            groupRotation,
            directorUsage,
            sundayIndex,
          );

          if (alternative) {
            optimizedDirector = alternative;
          }
        }
      }
    }

    // 4. Evitar que un director repita muy seguido
    const lastUsage = directorUsage.get(optimizedDirector) || [];
    if (lastUsage.length > 0) {
      const lastUsedSunday = Math.max(...lastUsage);
      if (sundayIndex - lastUsedSunday < 2) {
        // Mínimo 2 domingos de separación
        optimizedDirector = findAlternativeDirector(optimizedDirector, usedDirectorsToday, serviceTime);
      }
    }

    return optimizedDirector;
  };

  const findAlternativeDirector = (
    currentDirector: string,
    usedDirectorsToday: Set<string>,
    serviceTime: "08:00" | "10:45",
  ) => {
    const availableDirectors = DIRECTORS.ALL_DIRECTORS.filter(
      (dir) =>
        dir !== currentDirector &&
        !usedDirectorsToday.has(dir) &&
        (serviceTime === "08:00" || !DIRECTORS.ONLY_8AM.includes(dir)),
    );

    if (availableDirectors.length > 0) {
      // Preferir directores que no tengan restricciones
      const unrestricted = availableDirectors.filter((dir) => !DIRECTORS.ONLY_8AM.includes(dir));
      return unrestricted.length > 0 ? unrestricted[0] : availableDirectors[0];
    }

    return currentDirector; // Si no hay alternativa, mantener el actual
  };

  const findAlternativeDirectorForGroupConflict = (
    currentDirector: string,
    usedDirectorsToday: Set<string>,
    serviceTime: "08:00" | "10:45",
    groupRotation: any,
    directorUsage: Map<string, number[]>,
    sundayIndex: number,
  ) => {
    const availableDirectors = DIRECTORS.ALL_DIRECTORS.filter(
      (dir) =>
        dir !== currentDirector &&
        !usedDirectorsToday.has(dir) &&
        (serviceTime === "08:00" || !DIRECTORS.ONLY_8AM.includes(dir)),
    );

    for (const altDirector of availableDirectors) {
      const isAltGroupLeader = Object.keys(DIRECTORS.GROUP_LEADERS).includes(altDirector);

      if (!isAltGroupLeader) {
        return altDirector; // Preferir directores que no son líderes
      }

      // Verificar si el director alternativo también tendría conflicto
      const altLeaderGroup = DIRECTORS.GROUP_LEADERS[altDirector as keyof typeof DIRECTORS.GROUP_LEADERS];
      const isAltGroupResting = groupRotation.rest === altLeaderGroup;

      if (!isAltGroupResting) {
        const altGroupSingsAt8AM = groupRotation.service1 === altLeaderGroup;
        const altGroupSingsAt1045AM = groupRotation.service2 === altLeaderGroup;

        const wouldAltHaveConflict =
          (serviceTime === "08:00" && altGroupSingsAt1045AM) || (serviceTime === "10:45" && altGroupSingsAt8AM);

        if (!wouldAltHaveConflict) {
          return altDirector;
        }
      } else {
        return altDirector; // Si su grupo descansa, no hay conflicto
      }
    }

    return null;
  };

  const updateDirectorUsage = (directorUsage: Map<string, number[]>, director: string, sundayIndex: number) => {
    if (!directorUsage.has(director)) {
      directorUsage.set(director, []);
    }
    directorUsage.get(director)!.push(sundayIndex);
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

  return (
    <div className="space-y-4">
      {/* Años personalizados */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Agregar año personalizado:</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={customYear}
              onChange={(e) => setCustomYear(e.target.value)}
              placeholder="Ej: 2026"
              className="flex-1 p-2 border border-gray-300 rounded-md"
              min="2000"
              max="2100"
            />
            <Button onClick={addCustomYear} className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de años disponibles */}
      {availableYears.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Años disponibles para generar:</label>
          <div className="flex flex-wrap gap-2">
            {availableYears.map((year) => (
              <div key={year} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                <span>{year}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeYear(year)}
                  className="h-4 w-4 p-0 hover:bg-blue-200"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-2 flex-wrap">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="default" className="gap-2" disabled={isGenerating || !selectedYear}>
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
                    {availableYears.length > 0 ? (
                      availableYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))
                    ) : (
                      <option value="">No hay años disponibles</option>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <p>Esta acción generará automáticamente todos los domingos del {selectedYear} con:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Distribución equitativa de los 9 directores</li>
                    <li>Rotación de grupos: Aleida → Keyla → Massy</li>
                    <li>Coordinación de líderes con sus grupos</li>
                    <li>Respeto a restricciones de horario</li>
                    <li>Mínimo 2 domingos entre asignaciones</li>
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
            <Button variant="destructive" className="gap-2" disabled={isGenerating || !selectedYear}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
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

                <div className="space-y-2">
                  <p className="text-red-600 font-medium">
                    ⚠️ Esta acción eliminará permanentemente todos los servicios del año {selectedYear}.
                  </p>
                  <p>Esta operación no se puede deshacer. ¿Está seguro que desea continuar?</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={deleteYear} className="bg-red-600 hover:bg-red-700">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={isGenerating}>
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

                <div className="space-y-2">
                  <p>
                    Esta acción recalculará el número de orden (1º, 2º, 3º, 4º, 5º domingo) para todos los servicios del{" "}
                    {selectedYear}.
                  </p>
                  <p className="text-amber-600 font-medium mt-4">
                    Esto es útil si los servicios fueron generados con un algoritmo anterior. ¿Desea continuar?
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => selectedYear && recalculateMonthOrders(selectedYear)}>
                Recalcular
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default GenerateNextYearServices;
