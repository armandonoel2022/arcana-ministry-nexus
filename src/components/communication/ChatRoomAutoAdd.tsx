import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Componente para agregar automáticamente a todos los miembros activos
 * a la sala de chat "General"
 */
export const ChatRoomAutoAdd = () => {
  const { toast } = useToast();

  useEffect(() => {
    const addAllApprovedUsersToGeneral = async () => {
      try {
        // 1. Buscar la sala "General"
        const { data: generalRoom, error: roomError } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('name', 'General')
          .single();

        if (roomError || !generalRoom) {
          console.error('No se encontró la sala General:', roomError);
          return;
        }

        // 2. Obtener todos los usuarios aprobados con email
        const { data: approvedProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('is_approved', true)
          .eq('is_active', true)
          .not('email', 'is', null);

        if (profilesError || !approvedProfiles) {
          console.error('Error obteniendo perfiles aprobados:', profilesError);
          return;
        }

        console.log(`Encontrados ${approvedProfiles.length} usuarios aprobados`);

        // 3. Obtener miembros actuales de la sala General
        const { data: existingMembers } = await supabase
          .from('chat_room_members')
          .select('user_id')
          .eq('room_id', generalRoom.id);

        const existingUserIds = new Set(existingMembers?.map(m => m.user_id) || []);

        // 4. Agregar solo los que no están ya en la sala
        const newMembers = approvedProfiles
          .filter(profile => !existingUserIds.has(profile.id))
          .map(profile => ({
            room_id: generalRoom.id,
            user_id: profile.id,
            role: 'member',
            can_leave: false // No pueden salir de General
          }));

        if (newMembers.length > 0) {
          const { error: insertError } = await supabase
            .from('chat_room_members')
            .insert(newMembers);

          if (insertError) {
            console.error('Error agregando miembros:', insertError);
          } else {
            console.log(`✅ ${newMembers.length} usuarios agregados a General`);
          }
        } else {
          console.log('✅ Todos los usuarios aprobados ya están en General');
        }

      } catch (error) {
        console.error('Error en auto-add a General:', error);
      }
    };

    // Ejecutar al montar
    addAllApprovedUsersToGeneral();

    // Ejecutar cada 5 minutos
    const interval = setInterval(addAllApprovedUsersToGeneral, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [toast]);

  return null; // Este componente no renderiza nada
};
