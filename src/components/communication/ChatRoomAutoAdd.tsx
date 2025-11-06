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
    const addAllMembersToGeneralRoom = async () => {
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

        console.log('Sala General encontrada:', generalRoom.id);

        // 2. Obtener todos los miembros activos
        const { data: activeMembers, error: membersError } = await supabase
          .from('members')
          .select('id, nombres, apellidos')
          .eq('is_active', true);

        if (membersError || !activeMembers) {
          console.error('Error obteniendo miembros:', membersError);
          return;
        }

        console.log(`Encontrados ${activeMembers.length} miembros activos`);

        // 3. Obtener todos los profiles para hacer match con members
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name');

        if (profilesError || !profiles) {
          console.error('Error obteniendo profiles:', profilesError);
          return;
        }

        // 4. Hacer match entre members y profiles
        const memberProfileMatches: { memberId: string; profileId: string }[] = [];
        
        activeMembers.forEach(member => {
          const fullName = `${member.nombres} ${member.apellidos}`.toLowerCase();
          const matchingProfile = profiles.find(profile => 
            profile.full_name.toLowerCase().includes(member.nombres.toLowerCase()) ||
            fullName.includes(profile.full_name.toLowerCase())
          );

          if (matchingProfile) {
            memberProfileMatches.push({
              memberId: member.id,
              profileId: matchingProfile.id
            });
          }
        });

        console.log(`Matches encontrados: ${memberProfileMatches.length}`);

        // 5. Obtener participantes actuales de la sala
        const { data: existingParticipants } = await supabase
          .from('chat_participants')
          .select('user_id')
          .eq('room_id', generalRoom.id);

        const existingUserIds = new Set(existingParticipants?.map(p => p.user_id) || []);

        // 6. Agregar solo los que no están ya en la sala
        const newParticipants = memberProfileMatches
          .filter(match => !existingUserIds.has(match.profileId))
          .map(match => ({
            room_id: generalRoom.id,
            user_id: match.profileId
          }));

        if (newParticipants.length > 0) {
          const { error: insertError } = await supabase
            .from('chat_participants')
            .insert(newParticipants);

          if (insertError) {
            console.error('Error agregando participantes:', insertError);
          } else {
            console.log(`✅ ${newParticipants.length} nuevos miembros agregados a la sala General`);
            toast({
              title: "Sala General actualizada",
              description: `${newParticipants.length} miembros agregados automáticamente`,
            });
          }
        } else {
          console.log('✅ Todos los miembros activos ya están en la sala General');
        }

      } catch (error) {
        console.error('Error en auto-add a sala General:', error);
      }
    };

    // Ejecutar al montar el componente
    addAllMembersToGeneralRoom();

    // También ejecutar cada 5 minutos para mantener actualizado
    const interval = setInterval(addAllMembersToGeneralRoom, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [toast]);

  return null; // Este componente no renderiza nada
};
