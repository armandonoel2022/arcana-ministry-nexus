import React, { useState } from 'react';
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
      'Damaris Castillo Jimenez': 'KEYLA',
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

  const getAllSundaysOf2026 = () => {
    const sundays = [];
    const year = 2026;
    
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
    directorIndex: { value: number }
  ) => {
    const groupKey = groupName.toUpperCase() as keyof typeof GROUPS;
    
    // Buscar directores que pertenecen al grupo actual
    const directorsInGroup = Object.entries(DIRECTORS.WITH_GROUP)
      .filter(([_, group]) => group === groupKey)
      .map(([name, _]) => name);

    // Si hay un director del grupo disponible, priorizarlo
    if (directorsInGroup.length > 0) {
      const director = directorsInGroup[sundayIndex % directorsInGroup.length];
      
      // Verificar si el director tiene restricción de horario
      if (serviceTime === '10:45' && DIRECTORS.ONLY_8AM.includes(director)) {
        // Si no puede a las 10:45, buscar otro director
      } else {
        return director;
      }
    }

    // Si no hay director del grupo o tiene restricción, usar rotación general
    let attempts = 0;
    while (attempts < DIRECTORS.ALL.length) {
      const director = DIRECTORS.ALL[directorIndex.value % DIRECTORS.ALL.length];
      directorIndex.value++;
      
      // Verificar restricciones
      if (serviceTime === '10:45' && DIRECTORS.ONLY_8AM.includes(director)) {
        attempts++;
        continue; // Este director solo puede a las 8:00
      }
      
      return director;
    }

    // Fallback
    return DIRECTORS.ALL[0];
  };

  const generateServices = async () => {
    setIsGenerating(true);
    
    try {
      const sundays = getAllSundaysOf2026();
      const services = [];
      const directorIndex = { value: 0 }; // Usar objeto para mantener referencia

      for (let i = 0; i < sundays.length; i++) {
        const sunday = sundays[i];
        const rotation = getGroupRotation(i);
        
        // Servicio 8:00 AM
        const service1Group = rotation.service1;
        const director1 = getDirectorForService(i, '08:00', service1Group, directorIndex);
        
        services.push({
          title: '08:00 a.m.',
          service_date: new Date(sunday.getTime() + 8 * 60 * 60 * 1000).toISOString(), // 8:00 AM
          leader: director1,
          assigned_group_id: GROUPS[service1Group as keyof typeof GROUPS],
          service_type: 'regular',
          location: 'Templo Principal',
          is_confirmed: false
        });

        // Servicio 10:45 AM
        const service2Group = rotation.service2;
        const director2 = getDirectorForService(i, '10:45', service2Group, directorIndex);
        
        services.push({
          title: '10:45 a.m.',
          service_date: new Date(sunday.getTime() + 10.75 * 60 * 60 * 1000).toISOString(), // 10:45 AM
          leader: director2,
          assigned_group_id: GROUPS[service2Group as keyof typeof GROUPS],
          service_type: 'regular',
          location: 'Templo Principal',
          is_confirmed: false
        });
      }

      // Insertar todos los servicios
      const { error } = await supabase
        .from('services')
        .insert(services);

      if (error) throw error;

      toast.success(`Se generaron ${services.length} servicios para el año 2026`, {
        description: `${sundays.length} domingos con 2 servicios cada uno`
      });

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
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="default" 
          className="gap-2"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
          Generar Año Siguiente
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Generar Servicios del 2026</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Esta acción generará automáticamente todos los domingos del 2026 con:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Dos servicios por domingo (8:00 AM y 10:45 AM)</li>
              <li>Rotación de grupos: Aleida → Keyla → Massy</li>
              <li>Rotación de directores con restricciones de horario</li>
              <li>Coordinación de directores con sus grupos</li>
            </ul>
            <p className="text-amber-600 font-medium mt-4">
              Se crearán aproximadamente 104 servicios. ¿Desea continuar?
            </p>
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
  );
};

export default GenerateNextYearServices;
