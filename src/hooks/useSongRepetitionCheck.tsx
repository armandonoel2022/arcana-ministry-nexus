import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type TrafficLightColor = 'green' | 'yellow' | 'red';

export interface SongRepetitionResult {
  color: TrafficLightColor;
  message: string;
  details: string;
  consecutiveCount: number;
  sameDayService: boolean;
  canProceed: boolean;
}

interface SongSelection {
  id: string;
  service_id: string;
  song_id: string;
  selected_by: string;
  created_at: string;
  service: {
    service_date: string;
    title: string;
    leader: string;
  };
}

export const useSongRepetitionCheck = () => {
  const [isChecking, setIsChecking] = useState(false);

  const checkSongRepetition = async (
    songId: string,
    directorId: string,
    targetServiceId: string,
    targetServiceDate: string
  ): Promise<SongRepetitionResult> => {
    setIsChecking(true);

    try {
      // 1. Obtener las últimas selecciones del director para esta canción
      const { data: directorSelections, error: selectionsError } = await supabase
        .from('song_selections')
        .select(`
          id,
          service_id,
          song_id,
          selected_by,
          created_at,
          services!inner (
            service_date,
            title,
            leader
          )
        `)
        .eq('selected_by', directorId)
        .eq('song_id', songId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (selectionsError) {
        console.error('Error checking song repetition:', selectionsError);
        return getGreenResult();
      }

      // 2. Verificar si la canción ya está seleccionada para un servicio del mismo día
      const targetDate = targetServiceDate.split('T')[0];
      const { data: sameDaySelections, error: sameDayError } = await supabase
        .from('song_selections')
        .select(`
          id,
          service_id,
          selected_by,
          services!inner (
            service_date,
            title,
            leader
          ),
          profiles!inner (
            full_name
          )
        `)
        .eq('song_id', songId)
        .neq('service_id', targetServiceId);

      if (sameDayError) {
        console.error('Error checking same day selections:', sameDayError);
      }

      // Filtrar selecciones del mismo día
      const sameDayOtherServiceSelections = (sameDaySelections || []).filter((sel: any) => {
        const selDate = sel.services?.service_date?.split('T')[0];
        return selDate === targetDate;
      });

      // 3. Obtener los servicios anteriores del director (para contar participaciones)
      const { data: directorServices, error: servicesError } = await supabase
        .from('services')
        .select('id, service_date, title, leader')
        .eq('leader', (await getDirectorName(directorId)))
        .lt('service_date', targetServiceDate)
        .order('service_date', { ascending: false })
        .limit(5);

      if (servicesError) {
        console.error('Error getting director services:', servicesError);
      }

      // Procesar la lógica del semáforo
      const typedSelections = directorSelections as unknown as SongSelection[];
      const recentServicesCount = directorServices?.length || 0;
      
      // Contar en cuántas de las últimas participaciones del director se usó esta canción
      let consecutiveCount = 0;
      const recentServiceIds = (directorServices || []).slice(0, 3).map(s => s.id);
      
      for (const serviceId of recentServiceIds) {
        const usedInService = typedSelections.some(sel => sel.service_id === serviceId);
        if (usedInService) {
          consecutiveCount++;
        } else {
          break; // Si no se usó en un servicio, rompemos la racha
        }
      }

      // Determinar el color del semáforo
      // AMARILLO: Si ya está seleccionada para otro servicio del mismo día
      if (sameDayOtherServiceSelections.length > 0) {
        const otherService = sameDayOtherServiceSelections[0] as any;
        const selectedByName = otherService.profiles?.full_name || 'Otro director';
        const serviceTitle = otherService.services?.title || 'otro servicio';
        
        return {
          color: 'yellow',
          message: '⚠️ Canción ya seleccionada hoy',
          details: `Esta canción ya fue seleccionada por ${selectedByName} para "${serviceTitle}" del mismo día. Considera si deseas tenerla en ambos servicios.`,
          consecutiveCount: 0,
          sameDayService: true,
          canProceed: true
        };
      }

      // AMARILLO: Si se usó en la participación anterior
      if (consecutiveCount === 1) {
        return {
          color: 'yellow',
          message: '⚠️ Usada recientemente',
          details: 'Esta canción fue seleccionada en tu participación anterior. Considera variar el repertorio.',
          consecutiveCount: 1,
          sameDayService: false,
          canProceed: true
        };
      }

      // ROJO: Si se ha usado 2 veces consecutivas (esta sería la tercera)
      if (consecutiveCount >= 2) {
        return {
          color: 'red',
          message: '🛑 Repetición excesiva',
          details: `Has seleccionado esta canción en tus últimas ${consecutiveCount} participaciones. Esta sería la ${consecutiveCount + 1}ª vez consecutiva. ¿Deseas continuar de todas formas?`,
          consecutiveCount,
          sameDayService: false,
          canProceed: false
        };
      }

      // VERDE: No se ha usado en las últimas 3 participaciones
      return getGreenResult();

    } catch (error) {
      console.error('Error in checkSongRepetition:', error);
      return getGreenResult();
    } finally {
      setIsChecking(false);
    }
  };

  const getDirectorName = async (directorId: string): Promise<string> => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', directorId)
      .single();
    return data?.full_name || '';
  };

  const getGreenResult = (): SongRepetitionResult => ({
    color: 'green',
    message: '✅ Canción disponible',
    details: 'Esta canción no ha sido seleccionada en tus últimas 3 participaciones. ¡Adelante!',
    consecutiveCount: 0,
    sameDayService: false,
    canProceed: true
  });

  return {
    checkSongRepetition,
    isChecking
  };
};

// Constantes para las reglas del sistema
export const SONG_REPETITION_RULES = {
  title: 'Sistema Semáforo de Repetición de Canciones',
  description: 'Este sistema ayuda a mantener variedad en el repertorio, evitando que los directores repitan las mismas canciones constantemente.',
  rules: [
    {
      color: 'green' as const,
      emoji: '🟢',
      title: 'Verde - Adelante',
      condition: 'La canción no ha sido seleccionada por ti en las últimas 3 participaciones.',
      action: 'Puedes seleccionar esta canción sin restricciones.'
    },
    {
      color: 'yellow' as const,
      emoji: '🟡',
      title: 'Amarillo - Precaución',
      condition: 'La canción fue seleccionada en tu participación anterior, O ya fue seleccionada para otro servicio del mismo día (8:00 AM o 10:45 AM).',
      action: 'Puedes continuar, pero considera variar el repertorio o coordinar con el otro director.'
    },
    {
      color: 'red' as const,
      emoji: '🔴',
      title: 'Rojo - Advertencia',
      condition: 'Has seleccionado esta canción en tus últimas 2 participaciones consecutivas. Esta sería la tercera vez.',
      action: 'Se te preguntará si deseas continuar de todas formas o elegir otra opción.'
    }
  ],
  criteria: [
    {
      title: 'Por Servicio',
      description: 'Se verifica si la canción ya está seleccionada para otro servicio del mismo día (evitar duplicados entre servicios de 8:00 AM y 10:45 AM).'
    },
    {
      title: 'Por Integrante',
      description: 'Se analiza el historial personal de cada director de alabanza, verificando en cuántas de sus últimas participaciones utilizó la canción.'
    },
    {
      title: 'Por Fecha',
      description: 'Se consideran las fechas de los servicios para determinar la "racha" de uso consecutivo de una canción.'
    }
  ]
};
