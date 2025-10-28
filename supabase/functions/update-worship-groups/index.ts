import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MemberConfig {
  fullName: string;
  voice: string;
  role: string;
  micOrder: number;
}

interface GroupConfig {
  groupName: string;
  members: MemberConfig[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Configuración de los grupos
    const groupsConfig: GroupConfig[] = [
      {
        groupName: 'Grupo de Aleida',
        members: [
          { fullName: 'Aleida Geomar Batista Ventura', voice: 'Soprano', role: 'Corista', micOrder: 2 },
          { fullName: 'Eliabi Joana Sierra Castillo', voice: 'Soprano', role: 'Directora de Alabanza', micOrder: 1 },
          { fullName: 'Félix Nicolás Peralta Hernández', voice: 'Tenor', role: 'Corista', micOrder: 3 },
          { fullName: 'Fior Daliza Paniagua', voice: 'Contralto', role: 'Corista', micOrder: 4 },
          { fullName: 'Ruth Esmailin Ramirez', voice: 'Contralto', role: 'Corista', micOrder: 5 },
        ],
      },
      {
        groupName: 'Grupo de Keyla',
        members: [
          { fullName: 'Keyla Yanira Medrano Medrano', voice: 'Soprano', role: 'Directora de Alabanza', micOrder: 2 },
          { fullName: 'Yindhia Carolina Santana Castillo', voice: 'Soprano', role: 'Corista', micOrder: 1 },
          { fullName: 'Arizoni Liriano medina', voice: 'Bajo', role: 'Corista', micOrder: 3 },
          { fullName: 'Aida Lorena Pacheco De Santana', voice: 'Contralto', role: 'Corista', micOrder: 4 },
          { fullName: 'Sugey A. González Garó', voice: 'Contralto', role: 'Corista', micOrder: 5 },
        ],
      },
      {
        groupName: 'Grupo de Massy',
        members: [
          { fullName: 'Damaris Castillo Jimenez', voice: 'Soprano', role: 'Directora de Alabanza', micOrder: 2 },
          { fullName: 'Jisell Amada Mauricio Paniagua', voice: 'Soprano', role: 'Directora de Alabanza', micOrder: 1 },
          { fullName: 'Fredderid Abrahan Valera Montoya', voice: 'Tenor', role: 'Corista', micOrder: 3 },
          { fullName: 'Rosely Montero', voice: 'Contralto', role: 'Corista', micOrder: 4 },
          { fullName: 'Rodes Esther Santana Cuesta', voice: 'Contralto', role: 'Corista', micOrder: 5 },
        ],
      },
    ];

    const results = [];

    for (const groupConfig of groupsConfig) {
      // Obtener el ID del grupo
      const { data: group, error: groupError } = await supabase
        .from('worship_groups')
        .select('id')
        .eq('name', groupConfig.groupName)
        .single();

      if (groupError || !group) {
        results.push({
          group: groupConfig.groupName,
          success: false,
          error: `Grupo no encontrado: ${groupConfig.groupName}`,
        });
        continue;
      }

      // Desactivar todos los miembros actuales del grupo
      await supabase
        .from('group_members')
        .update({ is_active: false })
        .eq('group_id', group.id);

      // Procesar cada miembro
      for (const memberConfig of groupConfig.members) {
        // Buscar el miembro por nombre completo
        const { data: members, error: memberError } = await supabase
          .from('members')
          .select('id, nombres, apellidos')
          .eq('is_active', true);

        if (memberError || !members) {
          results.push({
            group: groupConfig.groupName,
            member: memberConfig.fullName,
            success: false,
            error: 'Error buscando miembros',
          });
          continue;
        }

        // Buscar el miembro que coincida con el nombre completo
        const member = members.find((m) => {
          const fullName = `${m.nombres} ${m.apellidos}`.trim();
          return fullName === memberConfig.fullName;
        });

        if (!member) {
          results.push({
            group: groupConfig.groupName,
            member: memberConfig.fullName,
            success: false,
            error: 'Miembro no encontrado',
          });
          continue;
        }

        // Verificar si ya existe un registro para este miembro en este grupo
        const { data: existingMember } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', group.id)
          .eq('user_id', member.id)
          .eq('instrument', 'vocals')
          .single();

        const isLeader = memberConfig.role === 'Directora de Alabanza';

        if (existingMember) {
          // Actualizar el registro existente
          const { error: updateError } = await supabase
            .from('group_members')
            .update({
              is_active: true,
              is_leader: isLeader,
              mic_order: memberConfig.micOrder,
            })
            .eq('id', existingMember.id);

          if (updateError) {
            results.push({
              group: groupConfig.groupName,
              member: memberConfig.fullName,
              success: false,
              error: updateError.message,
            });
          } else {
            results.push({
              group: groupConfig.groupName,
              member: memberConfig.fullName,
              success: true,
              action: 'updated',
            });
          }
        } else {
          // Insertar nuevo registro
          const { error: insertError } = await supabase
            .from('group_members')
            .insert({
              group_id: group.id,
              user_id: member.id,
              instrument: 'vocals',
              is_leader: isLeader,
              is_active: true,
              mic_order: memberConfig.micOrder,
              joined_date: new Date().toISOString().split('T')[0],
            });

          if (insertError) {
            results.push({
              group: groupConfig.groupName,
              member: memberConfig.fullName,
              success: false,
              error: insertError.message,
            });
          } else {
            results.push({
              group: groupConfig.groupName,
              member: memberConfig.fullName,
              success: true,
              action: 'inserted',
            });
          }
        }

        // Actualizar el campo voz_instrumento en la tabla members
        await supabase
          .from('members')
          .update({ voz_instrumento: memberConfig.voice })
          .eq('id', member.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Grupos actualizados exitosamente',
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
})
