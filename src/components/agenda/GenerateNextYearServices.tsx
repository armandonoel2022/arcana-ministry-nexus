import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
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

  useEffect(() => {
    detectNextYearAndAvailable();
  }, []);

  const detectNextYearAndAvailable = async () => {
    try {
      // Obtener todos los servicios para determinar años existentes
      const { data: allServices, error: servicesError } = await supabase
        .from('services')
        .select('service_date')
        .order('service_date', { ascending: false });

      if (servicesError) throw servicesError;

      // Extraer años únicos que realmente existen
      const yearsInDb = [...new Set(
        (allServices || []).map(s => new Date(s.service_date).getFullYear())
      )].sort((a, b) => a - b);
      
      setExistingYears(yearsInDb);

      // Determinar el próximo año a generar
      if (allServices && allServices.length > 0) {
        const lastYear = new Date(allServices[0].service_date).getFullYear();
        const next = lastYear + 1;
        setNextYear(next);
        setSelectedYear(next);
        
        // Lista de años para generar: próximos 5 años desde el último
        const futureYears = [];
        for (let i = 0; i <= 5; i++) {
          futureYears.push(next + i);
        }
        setAvailableYears(futureYears);
      } else {
        const currentYear = new Date().getFullYear();
        setNextYear(currentYear);
        setSelectedYear(currentYear);
        
        // Si no hay datos, empezar desde el año actual
        const futureYears = [];
        for (let i = 0; i <= 5; i++) {
          futureYears.push(currentYear + i);
        }
        setAvailableYears(futureYears);
      }
    } catch (error) {
      console.error('Error detecting next year:', error);
      const currentYear = new Date().getFullYear();
      setNextYear(currentYear);
      setSelectedYear(currentYear);
      setAvailableYears([currentYear, currentYear + 1, currentYear + 2]);
      setExistingYears([]);
    }
  };

  // IDs de los grupos
  const GROUPS = {
    ALEIDA: '8218442a-9406-4b97-9212-29b50279f2ce',
    KEYLA: '1275fdde-515c-4843-a7a3-08daec62e69e',
    MASSY: 'e5297132-d86c-4978-9b71-a98d2581b977'
  };

  // Directores con sus restricciones
  const DIRECTORS = {
    ONLY_8AM: ['Guarionex García', 'Maria del A. Pérez Santana'],
    GROUP_LEADERS: {
      'Damaris Castillo Jimenez': 'MASSY',
      'Keyla Yanira Medrano Medrano': 'KEYLA',
      'Eliabi Joana Sierra Castillo': 'ALEIDA'
    },
    // Orden de rotación según la imagen
    ROTATION: [
      'Armando Noel Charle',
      'Damaris Castillo Jimenez',
      'Maria del A. Pérez Santana',
      'Roosevelt Martinez',
      'Guarionex García',
      'Eliabi Joana Sierra Castillo',
      'Keyla Yanira Medrano Medrano',
      'Denny Alberto Santana',
      'Félix Nicolás Peralta Hernández'
    ]
  };

  const getAllSundaysOfYear = (year: number) => {
    const sundays = [];
    
    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        if (date.getDay() === 0) { // Domingo
          sundays.push(date);
        }
      }
    }
    
    return sundays;
  };

  const getGroupRotation = async (sundayIndex: number, year: number) => {
    // Rotación: Aleida → Keyla → Massy
    // Cada domingo, un grupo descansa
    const rotation = [
      { service1: 'ALEIDA', service2: 'KEYLA', rest: 'MASSY' },
      { service1: 'MASSY', service2: 'ALEIDA', rest: 'KEYLA' },
      { service1: 'KEYLA', service2: 'MASSY', rest: 'ALEIDA' }
    ];
    
    // Si es el primer domingo del año, verificar último domingo del año anterior
    if (sundayIndex === 0) {
      const { data: lastYearServices } = await supabase
        .from('services')
        .select('assigned_group_id, service_date')
        .gte('service_date', `${year - 1}-12-01`)
        .lt('service_date', `${year}-01-01`)
        .order('service_date', { ascending: false })
        .limit(2);

      if (lastYearServices && lastYearServices.length === 2) {
        // Identificar qué grupos cantaron en el último domingo del año anterior
        const lastGroups = lastYearServices.map(s => {
          if (s.assigned_group_id === GROUPS.ALEIDA) return 'ALEIDA';
          if (s.assigned_group_id === GROUPS.KEYLA) return 'KEYLA';
          if (s.assigned_group_id === GROUPS.MASSY) return 'MASSY';
          return null;
        }).filter(Boolean);

        // Determinar cuál grupo descansó
        const allGroups: ('ALEIDA' | 'KEYLA' | 'MASSY')[] = ['ALEIDA', 'KEYLA', 'MASSY'];
        const restedGroup = allGroups.find(g => !lastGroups.includes(g));

        // El que descansó ahora va al servicio 1, continuar rotación
        if (restedGroup === 'ALEIDA') return rotation[0]; // Aleida + Keyla
        if (restedGroup === 'KEYLA') return rotation[2]; // Keyla + Massy
        if (restedGroup === 'MASSY') return rotation[1]; // Massy + Aleida
      }
    }
    
    return rotation[sundayIndex % 3];
  };

  const getDirectorForService = (
    serviceIndex: number, 
    serviceTime: '08:00' | '10:45',
    groupName: string,
    usedDirectorsToday: Set<string>,
    groupRotation: { service1: string; service2: string; rest: string }
  ) => {
    // Usar la rotación de los 9 directores basada en el índice de SERVICIO (no domingo)
    // Esto distribuye mejor los directores a lo largo del mes
    let selectedDirector = DIRECTORS.ROTATION[serviceIndex % DIRECTORS.ROTATION.length];
    
    // Verificar restricciones de horario para el director seleccionado
    if (serviceTime === '10:45' && DIRECTORS.ONLY_8AM.includes(selectedDirector)) {
      // Este director solo puede a las 8 AM, buscar el siguiente disponible
      for (let i = 1; i < DIRECTORS.ROTATION.length; i++) {
        const nextIndex = (serviceIndex + i) % DIRECTORS.ROTATION.length;
        const nextDirector = DIRECTORS.ROTATION[nextIndex];
        
        if (!DIRECTORS.ONLY_8AM.includes(nextDirector) && !usedDirectorsToday.has(nextDirector)) {
          selectedDirector = nextDirector;
          break;
        }
      }
    }
    
    // Verificar si el director ya fue usado hoy (evitar duplicados en el mismo día)
    if (usedDirectorsToday.has(selectedDirector)) {
      // Buscar siguiente director disponible
      for (let i = 1; i < DIRECTORS.ROTATION.length; i++) {
        const nextIndex = (serviceIndex + i) % DIRECTORS.ROTATION.length;
        const nextDirector = DIRECTORS.ROTATION[nextIndex];
        
        const isAvailableForTime = serviceTime === '08:00' || !DIRECTORS.ONLY_8AM.includes(nextDirector);
        if (!usedDirectorsToday.has(nextDirector) && isAvailableForTime) {
          selectedDirector = nextDirector;
          break;
        }
      }
    }
    
    // OPTIMIZACIÓN: Si el director seleccionado es líder de un grupo
    // Y su grupo está cantando HOY (no descansa)
    // Intentar asignarlo al mismo servicio que su grupo para evitar doble turno
    const isGroupLeader = Object.keys(DIRECTORS.GROUP_LEADERS).includes(selectedDirector);
    
    if (isGroupLeader) {
      const leaderGroupName = DIRECTORS.GROUP_LEADERS[selectedDirector as keyof typeof DIRECTORS.GROUP_LEADERS] as 'ALEIDA' | 'KEYLA' | 'MASSY';
      const isGroupResting = groupRotation.rest === leaderGroupName;
      
      // Si el grupo NO está descansando, verificar en qué servicio canta
      if (!isGroupResting) {
        // Si el grupo canta en service1 (08:00) y estamos asignando 10:45, o viceversa
        // Intentar cambiar al director por otro para que coincida con su grupo
        const groupSingsAt8AM = groupRotation.service1 === leaderGroupName;
        const groupSingsAt1045AM = groupRotation.service2 === leaderGroupName;
        
        // Si hay conflicto de horario (líder asignado a hora diferente de su grupo)
        if ((serviceTime === '08:00' && groupSingsAt1045AM) || 
            (serviceTime === '10:45' && groupSingsAt8AM)) {
          // Intentar encontrar otro director para este servicio
          // Pero solo si hay alguien disponible
          for (let i = 1; i < DIRECTORS.ROTATION.length; i++) {
            const nextIndex = (serviceIndex + i) % DIRECTORS.ROTATION.length;
            const alternateDirector = DIRECTORS.ROTATION[nextIndex];
            
            const isAvailableForTime = serviceTime === '08:00' || !DIRECTORS.ONLY_8AM.includes(alternateDirector);
            if (!usedDirectorsToday.has(alternateDirector) && isAvailableForTime) {
              selectedDirector = alternateDirector;
              break;
            }
          }
        }
      }
    }
    
    return selectedDirector;
  };

  const recalculateMonthOrders = async (year: number) => {
    try {
      setIsGenerating(true);
      
      // Obtener todos los servicios del año especificado
      const { data: servicesData, error: fetchError } = await supabase
        .from('services')
        .select('id, service_date')
        .gte('service_date', `${year}-01-01`)
        .lt('service_date', `${year + 1}-01-01`)
        .order('service_date', { ascending: true });

      if (fetchError) throw fetchError;

      // Agrupar por día (fecha sin hora) y calcular el número de domingo del mes
      const updates = [];
      const servicesByDay = new Map<string, any[]>();

      servicesData.forEach(service => {
        const date = new Date(service.service_date);
        const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        if (!servicesByDay.has(dayKey)) {
          servicesByDay.set(dayKey, []);
        }
        servicesByDay.get(dayKey)!.push(service);
      });

      // Calcular el número de domingo para cada grupo de servicios del mismo día
      const daysByMonth = new Map<string, string[]>();
      servicesByDay.forEach((services, dayKey) => {
        const [yearStr, monthStr] = dayKey.split('-');
        const monthKey = `${yearStr}-${monthStr}`;
        
        if (!daysByMonth.has(monthKey)) {
          daysByMonth.set(monthKey, []);
        }
        daysByMonth.get(monthKey)!.push(dayKey);
      });

      // Ordenar los días de cada mes y asignar el número de domingo
      daysByMonth.forEach((days, monthKey) => {
        days.sort();
        days.forEach((dayKey, index) => {
          const sundayNumber = index + 1;
          const servicesOfDay = servicesByDay.get(dayKey) || [];
          
          servicesOfDay.forEach(service => {
            updates.push({
              id: service.id,
              month_order: sundayNumber
            });
          });
        });
      });

      // Actualizar todos los servicios
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('services')
          .update({ month_order: update.month_order })
          .eq('id', update.id);

        if (updateError) throw updateError;
      }

      toast.success(`Se recalcularon ${updates.length} servicios para el año ${year}`);
      
    } catch (error: any) {
      console.error('Error recalculando month_order:', error);
      toast.error('Error al recalcular los números de orden', {
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateServices = async () => {
    if (!selectedYear) {
      toast.error('No se pudo determinar el año a generar');
      return;
    }

    setIsGenerating(true);
    
    try {
      const sundays = getAllSundaysOfYear(selectedYear);
      const services = [];
      let currentServiceIndex = 0; // Índice de servicio que se resetea cada mes
      let lastMonth = -1;

      for (let i = 0; i < sundays.length; i++) {
        const sunday = sundays[i];
        const currentMonth = sunday.getMonth();
        
        // Resetear el índice de servicio al inicio de cada mes
        if (currentMonth !== lastMonth) {
          currentServiceIndex = 0;
          lastMonth = currentMonth;
        }
        
        const rotation = await getGroupRotation(i, selectedYear);
        
        // Conjunto de directores ya usados en este domingo
        const usedDirectorsToday = new Set<string>();
        
        // Servicio 8:00 AM - Usar currentServiceIndex para la rotación
        const service1Group = rotation.service1;
        const director1 = getDirectorForService(currentServiceIndex, '08:00', service1Group, usedDirectorsToday, rotation);
        usedDirectorsToday.add(director1);
        
        // Obtener el mes en español
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const monthName = monthNames[sunday.getMonth()];
        
        // Calcular el número de domingo del mes (1º, 2º, 3º, 4º, 5º)
        const sundaysInMonth = sundays.filter(s => s.getMonth() === sunday.getMonth());
        const monthOrder = sundaysInMonth.findIndex(s => s.getTime() === sunday.getTime()) + 1;
        
        services.push({
          title: '08:00 a.m.',
          service_date: new Date(sunday.getTime() + 8 * 60 * 60 * 1000).toISOString(),
          leader: director1,
          assigned_group_id: GROUPS[service1Group as keyof typeof GROUPS],
          service_type: 'Servicio Dominical',
          location: 'Templo Principal',
          is_confirmed: false,
          month_name: monthName,
          month_order: monthOrder
        });
        
        // Incrementar índice para el siguiente servicio
        currentServiceIndex++;

        // Servicio 10:45 AM - Usar el nuevo índice
        const service2Group = rotation.service2;
        const director2 = getDirectorForService(currentServiceIndex, '10:45', service2Group, usedDirectorsToday, rotation);
        
        services.push({
          title: '10:45 a.m.',
          service_date: new Date(sunday.getTime() + 10.75 * 60 * 60 * 1000).toISOString(),
          leader: director2,
          assigned_group_id: GROUPS[service2Group as keyof typeof GROUPS],
          service_type: 'Servicio Dominical',
          location: 'Templo Principal',
          is_confirmed: false,
          month_name: monthName,
          month_order: monthOrder
        });
        
        // Incrementar índice para el próximo domingo
        currentServiceIndex++;
      }

      const { error } = await supabase
        .from('services')
        .insert(services);

      if (error) throw error;

      toast.success(`Se generaron ${services.length} servicios para el año ${selectedYear}`, {
        description: `${sundays.length} domingos con 2 servicios cada uno`
      });

      // Actualizar los años disponibles
      await detectNextYearAndAvailable();
      
      // Notificar al componente padre para refrescar la tabla
      if (onDataUpdate) {
        onDataUpdate();
      }

    } catch (error: any) {
      console.error('Error generando servicios:', error);
      toast.error('Error al generar servicios', {
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteYear = async () => {
    if (!selectedYear) {
      toast.error('No se pudo determinar el año a eliminar');
      return;
    }

    setIsGenerating(true);
    
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .gte('service_date', `${selectedYear}-01-01`)
        .lt('service_date', `${selectedYear + 1}-01-01`);

      if (error) throw error;

      toast.success(`Se eliminaron todos los servicios del año ${selectedYear}`);

      // Actualizar los años disponibles
      await detectNextYearAndAvailable();
      
      // Notificar al componente padre para refrescar la tabla
      if (onDataUpdate) {
        onDataUpdate();
      }

    } catch (error: any) {
      console.error('Error eliminando servicios:', error);
      toast.error('Error al eliminar servicios', {
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="default" 
            className="gap-2"
            disabled={isGenerating || !selectedYear}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            Generar Año
          </Button>
        </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Generar Servicios</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Selecciona el año a generar:
              </label>
              <select
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {availableYears.length > 0 ? (
                  availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))
                ) : (
                  <option value="">No hay años con servicios</option>
                )}
              </select>
            </div>
            
            <div className="space-y-2">
              <p>Esta acción generará automáticamente todos los domingos del {selectedYear} con:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Dos servicios por domingo (8:00 AM y 10:45 AM)</li>
                <li>Rotación de grupos: Aleida → Keyla → Massy</li>
                <li>Rotación de directores con restricciones de horario</li>
                <li>Coordinación de directores con sus grupos</li>
              </ul>
              <p className="text-amber-600 font-medium mt-4">
                Se crearán aproximadamente 104 servicios. ¿Desea continuar?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={generateServices}>
            Generar Servicios
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          className="gap-2"
          disabled={isGenerating || !selectedYear}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
          Eliminar Año
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Servicios del Año</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Selecciona el año a eliminar:
              </label>
              <select
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {existingYears.length > 0 ? (
                  existingYears.map(year => (
                    <option key={year} value={year}>{year}</option>
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
        <Button 
          variant="outline" 
          className="gap-2"
          disabled={isGenerating}
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
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {existingYears.length > 0 ? (
                  existingYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))
                ) : (
                  <option value="">No hay años con servicios</option>
                )}
              </select>
            </div>
            
            <div className="space-y-2">
              <p>Esta acción recalculará el número de orden (1º, 2º, 3º, 4º, 5º domingo) para todos los servicios del {selectedYear}.</p>
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
  );
};

export default GenerateNextYearServices;
