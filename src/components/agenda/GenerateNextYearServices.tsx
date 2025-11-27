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

const GenerateNextYearServices = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [nextYear, setNextYear] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    detectNextYearAndAvailable();
  }, []);

  const detectNextYearAndAvailable = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('service_date')
        .order('service_date', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastYear = new Date(data[0].service_date).getFullYear();
        const next = lastYear + 1;
        setNextYear(next);
        setSelectedYear(next);
        
        // Generar lista de años disponibles (último año + próximos 5 años)
        const years = [];
        for (let i = 0; i <= 5; i++) {
          years.push(next + i);
        }
        setAvailableYears(years);
      } else {
        const currentYear = new Date().getFullYear();
        setNextYear(currentYear);
        setSelectedYear(currentYear);
        
        // Generar lista desde el año actual
        const years = [];
        for (let i = 0; i <= 5; i++) {
          years.push(currentYear + i);
        }
        setAvailableYears(years);
      }
    } catch (error) {
      console.error('Error detecting next year:', error);
      const currentYear = new Date().getFullYear();
      setNextYear(currentYear);
      setSelectedYear(currentYear);
      setAvailableYears([currentYear, currentYear + 1, currentYear + 2]);
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
    WITH_GROUP: {
      'Damaris Castillo Jimenez': 'MASSY',
      'Keyla Yanira Medrano Medrano': 'KEYLA',
      'Eliabi Joana Sierra Castillo': 'ALEIDA'
    },
    ALL: [
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

  const getGroupRotation = (sundayIndex: number) => {
    // Rotación: Aleida → Keyla → Massy
    // Cada domingo, un grupo descansa
    const rotation = [
      { service1: 'ALEIDA', service2: 'KEYLA', rest: 'MASSY' },
      { service1: 'MASSY', service2: 'ALEIDA', rest: 'KEYLA' },
      { service1: 'KEYLA', service2: 'MASSY', rest: 'ALEIDA' }
    ];
    
    return rotation[sundayIndex % 3];
  };

  const getDirectorForService = (
    sundayIndex: number, 
    serviceTime: '08:00' | '10:45',
    groupName: string,
    directorIndex: { value: number },
    usedDirectorsToday: Set<string>
  ) => {
    const groupKey = groupName.toUpperCase() as keyof typeof GROUPS;
    
    // Buscar directores que pertenecen al grupo actual
    const directorsInGroup = Object.entries(DIRECTORS.WITH_GROUP)
      .filter(([_, group]) => group === groupKey)
      .map(([name, _]) => name);

    // Si hay un director del grupo disponible, priorizarlo
    if (directorsInGroup.length > 0) {
      for (const director of directorsInGroup) {
        // Verificar si el director tiene restricción de horario
        if (serviceTime === '10:45' && DIRECTORS.ONLY_8AM.includes(director)) {
          continue; // Este director no puede a las 10:45
        }
        // Si pasa las restricciones, usar este director
        return director;
      }
    }

    // Si no hay director del grupo disponible, usar rotación general
    // excluyendo directores que tienen grupo O que ya fueron usados hoy
    let attempts = 0;
    const directorsWithGroup = Object.keys(DIRECTORS.WITH_GROUP);
    
    while (attempts < DIRECTORS.ALL.length * 2) {
      const director = DIRECTORS.ALL[directorIndex.value % DIRECTORS.ALL.length];
      directorIndex.value++;
      attempts++;
      
      // Saltar directores que tienen grupo asignado
      if (directorsWithGroup.includes(director)) {
        continue;
      }
      
      // Saltar directores ya usados hoy
      if (usedDirectorsToday.has(director)) {
        continue;
      }
      
      // Verificar restricciones de horario
      if (serviceTime === '10:45' && DIRECTORS.ONLY_8AM.includes(director)) {
        continue;
      }
      
      return director;
    }

    // Fallback - buscar cualquier director disponible que no haya sido usado hoy
    for (const director of DIRECTORS.ALL) {
      if (usedDirectorsToday.has(director)) {
        continue;
      }
      if (serviceTime === '10:45' && DIRECTORS.ONLY_8AM.includes(director)) {
        continue;
      }
      return director;
    }
    
    // Último recurso si todos fueron usados
    return DIRECTORS.ALL[0];
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
      const directorIndex = { value: 0 };

      for (let i = 0; i < sundays.length; i++) {
        const sunday = sundays[i];
        const rotation = getGroupRotation(i);
        
        // Conjunto de directores ya usados en este domingo
        const usedDirectorsToday = new Set<string>();
        
        // Servicio 8:00 AM
        const service1Group = rotation.service1;
        const director1 = getDirectorForService(i, '08:00', service1Group, directorIndex, usedDirectorsToday);
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

        // Servicio 10:45 AM
        const service2Group = rotation.service2;
        const director2 = getDirectorForService(i, '10:45', service2Group, directorIndex, usedDirectorsToday);
        
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

    } catch (error: any) {
      console.error('Error generando servicios:', error);
      toast.error('Error al generar servicios', {
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
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
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
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
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
