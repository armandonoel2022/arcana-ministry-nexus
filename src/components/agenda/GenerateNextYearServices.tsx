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
      const { data: allServices, error: servicesError } = await supabase
        .from('services')
        .select('service_date')
        .order('service_date', { ascending: false });

      if (servicesError) throw servicesError;

      const yearsInDb = [...new Set(
        (allServices || []).map(s => new Date(s.service_date).getFullYear())
      )].sort((a, b) => a - b);
      
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

  // Obtener todos los miércoles del año (para cuarentena después del 21 de febrero)
  const getQuarantineWednesdays = (year: number) => {
    const wednesdays = [];
    const cutoffDate = new Date(year, 1, 21); // 21 de febrero
    
    for (let month = 0; month < 12; month++) {
      const lastDay = new Date(year, month + 1, 0);
      
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        if (date.getDay() === 3 && date > cutoffDate) { // Miércoles después del 21 feb
          wednesdays.push(date);
        }
      }
    }
    
    return wednesdays;
  };

  // Obtener todos los sábados hasta el 21 de febrero (para cuarentena)
  const getQuarantineSaturdays = (year: number) => {
    const saturdays = [];
    const cutoffDate = new Date(year, 1, 21); // 21 de febrero
    const startOfYear = new Date(year, 0, 1);
    
    for (let day = 1; day <= 60; day++) { // Primeros ~60 días del año
      const date = new Date(year, 0, day);
      if (date > cutoffDate) break;
      if (date.getDay() === 6) { // Sábado
        saturdays.push(date);
      }
    }
    
    return saturdays;
  };

  const getGroupRotation = async (sundayIndex: number, year: number) => {
    const rotation = [
      { service1: 'ALEIDA', service2: 'KEYLA', rest: 'MASSY' },
      { service1: 'MASSY', service2: 'ALEIDA', rest: 'KEYLA' },
      { service1: 'KEYLA', service2: 'MASSY', rest: 'ALEIDA' }
    ];
    
    if (sundayIndex === 0) {
      const { data: lastYearServices } = await supabase
        .from('services')
        .select('assigned_group_id, service_date')
        .gte('service_date', `${year - 1}-12-01`)
        .lt('service_date', `${year}-01-01`)
        .eq('service_type', 'Servicio Dominical')
        .order('service_date', { ascending: false })
        .limit(2);

      if (lastYearServices && lastYearServices.length === 2) {
        const lastGroups = lastYearServices.map(s => {
          if (s.assigned_group_id === GROUPS.ALEIDA) return 'ALEIDA';
          if (s.assigned_group_id === GROUPS.KEYLA) return 'KEYLA';
          if (s.assigned_group_id === GROUPS.MASSY) return 'MASSY';
          return null;
        }).filter(Boolean);

        const allGroups: ('ALEIDA' | 'KEYLA' | 'MASSY')[] = ['ALEIDA', 'KEYLA', 'MASSY'];
        const restedGroup = allGroups.find(g => !lastGroups.includes(g));

        if (restedGroup === 'ALEIDA') return rotation[0];
        if (restedGroup === 'KEYLA') return rotation[2];
        if (restedGroup === 'MASSY') return rotation[1];
      }
    }
    
    return rotation[sundayIndex % 3];
  };

  const getDirectorForService = (
    serviceIndex: number, 
    serviceTime: '08:00' | '10:45' | '19:00',
    groupName: string,
    usedDirectorsToday: Set<string>,
    groupRotation: { service1: string; service2: string; rest: string }
  ) => {
    let selectedDirector = DIRECTORS.ROTATION[serviceIndex % DIRECTORS.ROTATION.length];
    
    // Para servicios de cuarentena (19:00), no aplicar restricción de solo 8AM
    const isQuarantineService = serviceTime === '19:00';
    
    if (serviceTime === '10:45' && DIRECTORS.ONLY_8AM.includes(selectedDirector)) {
      for (let i = 1; i < DIRECTORS.ROTATION.length; i++) {
        const nextIndex = (serviceIndex + i) % DIRECTORS.ROTATION.length;
        const nextDirector = DIRECTORS.ROTATION[nextIndex];
        
        if (!DIRECTORS.ONLY_8AM.includes(nextDirector) && !usedDirectorsToday.has(nextDirector)) {
          selectedDirector = nextDirector;
          break;
        }
      }
    }
    
    if (usedDirectorsToday.has(selectedDirector)) {
      for (let i = 1; i < DIRECTORS.ROTATION.length; i++) {
        const nextIndex = (serviceIndex + i) % DIRECTORS.ROTATION.length;
        const nextDirector = DIRECTORS.ROTATION[nextIndex];
        
        const isAvailableForTime = serviceTime === '08:00' || isQuarantineService || !DIRECTORS.ONLY_8AM.includes(nextDirector);
        if (!usedDirectorsToday.has(nextDirector) && isAvailableForTime) {
          selectedDirector = nextDirector;
          break;
        }
      }
    }
    
    const isGroupLeader = Object.keys(DIRECTORS.GROUP_LEADERS).includes(selectedDirector);
    
    if (isGroupLeader && !isQuarantineService) {
      const leaderGroupName = DIRECTORS.GROUP_LEADERS[selectedDirector as keyof typeof DIRECTORS.GROUP_LEADERS] as 'ALEIDA' | 'KEYLA' | 'MASSY';
      const isGroupResting = groupRotation.rest === leaderGroupName;
      
      if (!isGroupResting) {
        const groupSingsAt8AM = groupRotation.service1 === leaderGroupName;
        const groupSingsAt1045AM = groupRotation.service2 === leaderGroupName;
        
        if ((serviceTime === '08:00' && groupSingsAt1045AM) || 
            (serviceTime === '10:45' && groupSingsAt8AM)) {
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

  const generateServices = async () => {
    if (!selectedYear) {
      toast.error('No se pudo determinar el año a generar');
      return;
    }

    setIsGenerating(true);
    
    try {
      const sundays = getAllSundaysOfYear(selectedYear);
      const quarantineSaturdays = getQuarantineSaturdays(selectedYear);
      const quarantineWednesdays = getQuarantineWednesdays(selectedYear);
      
      const services = [];
      let currentServiceIndex = 0;
      let quarantineServiceIndex = 0;
      let lastMonth = -1;

      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

      // Generar servicios dominicales
      for (let i = 0; i < sundays.length; i++) {
        const sunday = sundays[i];
        const currentMonth = sunday.getMonth();
        
        if (currentMonth !== lastMonth) {
          currentServiceIndex = 0;
          lastMonth = currentMonth;
        }
        
        const rotation = await getGroupRotation(i, selectedYear);
        const usedDirectorsToday = new Set<string>();
        
        // Servicio 8:00 AM
        const service1Group = rotation.service1;
        const director1 = getDirectorForService(currentServiceIndex, '08:00', service1Group, usedDirectorsToday, rotation);
        usedDirectorsToday.add(director1);
        
        const monthName = monthNames[sunday.getMonth()];
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
        
        currentServiceIndex++;

        // Servicio 10:45 AM
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
        
        currentServiceIndex++;
      }

      // Generar servicios de cuarentena (sábados hasta 21 de febrero)
      for (const saturday of quarantineSaturdays) {
        // Encontrar qué grupo descansa el fin de semana más cercano
        const nearestSunday = new Date(saturday);
        nearestSunday.setDate(nearestSunday.getDate() + 1); // Domingo siguiente
        
        const sundayIndex = sundays.findIndex(s => 
          s.getFullYear() === nearestSunday.getFullYear() &&
          s.getMonth() === nearestSunday.getMonth() &&
          s.getDate() === nearestSunday.getDate()
        );
        
        const rotation = sundayIndex >= 0 ? await getGroupRotation(sundayIndex, selectedYear) : { service1: 'ALEIDA', service2: 'KEYLA', rest: 'MASSY' };
        const restingGroup = rotation.rest as 'ALEIDA' | 'KEYLA' | 'MASSY';
        
        const usedDirectorsToday = new Set<string>();
        const director = getDirectorForService(quarantineServiceIndex, '19:00', restingGroup, usedDirectorsToday, rotation);
        
        const monthName = monthNames[saturday.getMonth()];
        
        services.push({
          title: '07:00 p.m.',
          service_date: new Date(saturday.getTime() + 19 * 60 * 60 * 1000).toISOString(),
          leader: director,
          assigned_group_id: GROUPS[restingGroup],
          service_type: 'cuarentena',
          location: 'Templo Principal',
          is_confirmed: false,
          month_name: monthName,
          month_order: null
        });
        
        quarantineServiceIndex++;
      }

      // Generar servicios de cuarentena (miércoles después del 21 de febrero)
      for (const wednesday of quarantineWednesdays) {
        // Encontrar qué grupo descansa el fin de semana anterior
        const previousSunday = new Date(wednesday);
        previousSunday.setDate(previousSunday.getDate() - (wednesday.getDay() + 4) % 7); // Domingo anterior
        
        const sundayIndex = sundays.findIndex(s => 
          s.getFullYear() === previousSunday.getFullYear() &&
          s.getMonth() === previousSunday.getMonth() &&
          s.getDate() === previousSunday.getDate()
        );
        
        const rotation = sundayIndex >= 0 ? await getGroupRotation(sundayIndex, selectedYear) : { service1: 'ALEIDA', service2: 'KEYLA', rest: 'MASSY' };
        const restingGroup = rotation.rest as 'ALEIDA' | 'KEYLA' | 'MASSY';
        
        const usedDirectorsToday = new Set<string>();
        const director = getDirectorForService(quarantineServiceIndex, '19:00', restingGroup, usedDirectorsToday, rotation);
        
        const monthName = monthNames[wednesday.getMonth()];
        
        services.push({
          title: '07:00 p.m.',
          service_date: new Date(wednesday.getTime() + 19 * 60 * 60 * 1000).toISOString(),
          leader: director,
          assigned_group_id: GROUPS[restingGroup],
          service_type: 'cuarentena',
          location: 'Templo Principal',
          is_confirmed: false,
          month_name: monthName,
          month_order: null
        });
        
        quarantineServiceIndex++;
      }

      const { error } = await supabase
        .from('services')
        .insert(services);

      if (error) throw error;

      const sundayCount = sundays.length * 2;
      const quarantineCount = quarantineSaturdays.length + quarantineWednesdays.length;
      
      toast.success(`Se generaron ${services.length} servicios para ${selectedYear}`, {
        description: `${sundayCount} dominicales + ${quarantineCount} cuarentena (${quarantineSaturdays.length} sábados + ${quarantineWednesdays.length} miércoles)`
      });

      await detectNextYearAndAvailable();
      
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

      await detectNextYearAndAvailable();
      
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
                <p>Esta acción generará automáticamente todos los servicios del {selectedYear} con:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Dos servicios dominicales (8:00 AM y 10:45 AM)</li>
                  <li><strong>Cuarentena sábados</strong> (hasta 21 de febrero) a las 7:00 PM</li>
                  <li><strong>Cuarentena miércoles</strong> (después del 21 de febrero) a las 7:00 PM</li>
                  <li>El grupo que descansa el fin de semana hace coros en cuarentena</li>
                  <li>Rotación de grupos: Aleida → Keyla → Massy</li>
                  <li>Rotación de directores con restricciones de horario</li>
                </ul>
                <p className="text-amber-600 font-medium mt-4">
                  Se crearán aproximadamente 150+ servicios. ¿Desea continuar?
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
            <AlertDialogTitle className="text-destructive">Eliminar Servicios del Año</AlertDialogTitle>
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
              
              <p className="text-red-600 font-medium">
                ⚠️ Esta acción eliminará TODOS los servicios del año {selectedYear}. 
                Esta acción no se puede deshacer.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteYear}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar Año
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GenerateNextYearServices;
