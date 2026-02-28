import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, conversationHistory } = await req.json();

    if (!message) {
      throw new Error('Mensaje requerido');
    }

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurada');
    }

    // Create Supabase client for database operations
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch context data from database
    const contextData = await fetchContextData(supabase, userId);

    // Build the system prompt with context
    const systemPrompt = buildSystemPrompt(contextData);

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    // Check if this is an action request
    const actionRequest = detectActionRequest(message);

    let tools = undefined;
    let tool_choice = undefined;

    if (actionRequest) {
      tools = getTools();
      tool_choice = 'auto';
    }

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        tools,
        tool_choice,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Límite de solicitudes excedido. Intenta de nuevo más tarde.',
          type: 'rate_limit'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Créditos de IA agotados.',
          type: 'payment_required'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Error al procesar con IA');
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    // Handle tool calls if present
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults = await handleToolCalls(supabase, assistantMessage.tool_calls, userId);
      
      return new Response(JSON.stringify({
        response: assistantMessage.content || 'Procesando tu solicitud...',
        toolResults,
        actions: toolResults.filter(r => r.success).map(r => ({
          type: r.toolName,
          data: r.result
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      response: assistantMessage.content,
      actions: null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en arcana-ai:', error);
    return new Response(JSON.stringify({ 
      error: (error as any)?.message || String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchContextData(supabase: any, userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch in parallel
  const [
    { data: userProfile },
    { data: nextServices },
    { data: songs },
    { data: members },
    { data: aliases },
    { data: replacements },
    { data: nextEvent }
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('services').select('*, worship_groups(name)').gte('service_date', today).order('service_date').limit(5),
    supabase.from('songs').select('id, title, artist, category').eq('is_active', true).limit(50),
    supabase.from('members').select('id, nombres, apellidos, cargo, voz_instrumento').eq('is_active', true),
    supabase.from('member_aliases').select('*').eq('is_active', true),
    supabase.from('director_replacement_requests').select('*').eq('status', 'pending').limit(10),
    supabase.from('special_events').select('*').gte('event_date', today).order('event_date').limit(1)
  ]);

  return {
    userProfile,
    nextServices: nextServices || [],
    songs: songs || [],
    members: members || [],
    aliases: aliases || [],
    pendingReplacements: replacements || [],
    nextEvent: nextEvent?.[0] || null
  };
}

function buildSystemPrompt(context: any) {
  const { userProfile, nextServices, songs, members, aliases, pendingReplacements, nextEvent } = context;

  // Build alias map
  const aliasMap = aliases.reduce((acc: any, a: any) => {
    acc[a.profile_id] = a.alias;
    return acc;
  }, {});

  // Get member names with aliases
  const membersList = members.map((m: any) => {
    const alias = aliasMap[m.id];
    return alias ? `${m.nombres} ${m.apellidos} (alias: ${alias})` : `${m.nombres} ${m.apellidos}`;
  }).join(', ');

  const servicesInfo = nextServices.map((s: any) => 
    `- ${s.title}: ${s.service_date} | Director: ${s.leader || 'Por asignar'} | Grupo: ${s.worship_groups?.name || 'Sin grupo'}`
  ).join('\n');

  const songsInfo = songs.slice(0, 20).map((s: any) => `${s.title} (${s.artist || 'Desconocido'})`).join(', ');

  const replacementsInfo = pendingReplacements.length > 0 
    ? `Hay ${pendingReplacements.length} solicitudes de reemplazo pendientes.`
    : 'No hay solicitudes de reemplazo pendientes.';

  const eventInfo = nextEvent 
    ? `Próximo evento especial: ${nextEvent.title} el ${nextEvent.event_date}`
    : 'No hay eventos especiales programados próximamente.';

  return `Eres ARCANA, la asistente virtual inteligente del Ministerio de Alabanza Arca de Noé.

INFORMACIÓN DEL USUARIO:
- Nombre: ${userProfile?.full_name || 'Usuario'}
- Rol: ${userProfile?.role || 'Miembro'}

CONTEXTO ACTUAL:

📅 PRÓXIMOS SERVICIOS:
${servicesInfo || 'No hay servicios programados'}

🎵 CANCIONES DISPONIBLES (muestra):
${songsInfo}

👥 MIEMBROS ACTIVOS:
${membersList}

🔄 REEMPLAZOS:
${replacementsInfo}

🎉 EVENTOS:
${eventInfo}

CAPACIDADES:
1. Consultar información de servicios, canciones, miembros
2. Agregar canciones a servicios (usa la herramienta add_song_to_service)
3. Crear alias para miembros (usa la herramienta create_alias)
4. Consultar y reportar sobre reemplazos
5. Responder preguntas sobre el ministerio

REGLAS IMPORTANTES:
- Responde siempre en español
- Sé amable, concisa y servicial
- Usa los aliases cuando existan para referirte a las personas
- Si alguien pide cambiar cómo se le llama, usa la herramienta create_alias
- Para agregar canciones a servicios, primero confirma el servicio y la canción
- Proporciona información precisa basada en los datos disponibles
- Si no tienes información, indica que puedes ayudar a buscarla`;
}

function detectActionRequest(message: string): boolean {
  const actionPatterns = [
    /agregar|añadir|incluir|poner/i,
    /cambiar.*nombre|llamar.*diferente|alias/i,
    /seleccionar.*canci[oó]n/i,
    /crear|generar|hacer/i,
    /quiero que me llam/i,
    /desde ahora/i
  ];
  return actionPatterns.some(p => p.test(message));
}

function getTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'add_song_to_service',
        description: 'Agrega una canción a un servicio específico',
        parameters: {
          type: 'object',
          properties: {
            service_id: { type: 'string', description: 'ID del servicio' },
            song_id: { type: 'string', description: 'ID de la canción' },
            song_order: { type: 'number', description: 'Orden de la canción en el servicio' }
          },
          required: ['service_id', 'song_id']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'create_alias',
        description: 'Crea un alias o apodo para un miembro del ministerio',
        parameters: {
          type: 'object',
          properties: {
            profile_id: { type: 'string', description: 'ID del perfil del usuario' },
            alias: { type: 'string', description: 'El nuevo alias o apodo' }
          },
          required: ['profile_id', 'alias']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_service_details',
        description: 'Obtiene detalles completos de un servicio incluyendo canciones seleccionadas',
        parameters: {
          type: 'object',
          properties: {
            service_id: { type: 'string', description: 'ID del servicio' }
          },
          required: ['service_id']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'search_songs',
        description: 'Busca canciones por título o artista',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Término de búsqueda' }
          },
          required: ['query']
        }
      }
    }
  ];
}

async function handleToolCalls(supabase: any, toolCalls: any[], userId: string) {
  const results = [];

  for (const toolCall of toolCalls) {
    const { name, arguments: args } = toolCall.function;
    const parsedArgs = JSON.parse(args);

    try {
      let result;

      switch (name) {
        case 'add_song_to_service':
          result = await addSongToService(supabase, parsedArgs, userId);
          break;
        case 'create_alias':
          result = await createAlias(supabase, parsedArgs, userId);
          break;
        case 'get_service_details':
          result = await getServiceDetails(supabase, parsedArgs.service_id);
          break;
        case 'search_songs':
          result = await searchSongs(supabase, parsedArgs.query);
          break;
        default:
          result = { error: 'Herramienta no reconocida' };
      }

      results.push({
        toolName: name,
        success: !result.error,
        result
      });
    } catch (error) {
      results.push({
        toolName: name,
        success: false,
        result: { error: (error as any)?.message }
      });
    }
  }

  return results;
}

async function addSongToService(supabase: any, args: any, userId: string) {
  const { service_id, song_id, song_order } = args;

  // Get max order if not provided
  let order = song_order;
  if (!order) {
    const { data: existing } = await supabase
      .from('song_selections')
      .select('*')
      .eq('service_id', service_id);
    order = (existing?.length || 0) + 1;
  }

  const { data, error } = await supabase
    .from('song_selections')
    .insert({
      service_id,
      song_id,
      selected_by: userId,
      selection_reason: 'Agregada por ARCANA'
    })
    .select()
    .single();

  if (error) throw error;

  return { 
    success: true, 
    message: 'Canción agregada exitosamente al servicio',
    data 
  };
}

async function createAlias(supabase: any, args: any, userId: string) {
  const { profile_id, alias } = args;

  // Deactivate previous aliases
  await supabase
    .from('member_aliases')
    .update({ is_active: false })
    .eq('profile_id', profile_id);

  // Create new alias
  const { data, error } = await supabase
    .from('member_aliases')
    .insert({
      profile_id,
      alias,
      created_by: userId,
      is_active: true
    })
    .select()
    .single();

  if (error) throw error;

  return {
    success: true,
    message: `Alias "${alias}" creado exitosamente. A partir de ahora usaré este nombre.`,
    data
  };
}

async function getServiceDetails(supabase: any, serviceId: string) {
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select(`
      *,
      worship_groups(name),
      song_selections(
        song_id,
        songs(title, artist)
      )
    `)
    .eq('id', serviceId)
    .single();

  if (serviceError) throw serviceError;

  return service;
}

async function searchSongs(supabase: any, query: string) {
  // First try direct ilike search
  const { data, error } = await supabase
    .from('songs')
    .select('id, title, artist, category, cover_image_url, key_signature')
    .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
    .eq('is_active', true)
    .limit(10);

  if (error) throw error;

  // If no results, try accent-insensitive search
  if (!data || data.length === 0) {
    const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const words = normalizedQuery.split(/\s+/).filter(w => w.length >= 2);
    
    const { data: allSongs, error: allError } = await supabase
      .from('songs')
      .select('id, title, artist, category, cover_image_url, key_signature')
      .eq('is_active', true)
      .limit(500);

    if (allError) throw allError;

    const filtered = (allSongs || []).filter((song: any) => {
      const normalizedTitle = (song.title || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const normalizedArtist = (song.artist || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return words.every(word => normalizedTitle.includes(word) || normalizedArtist.includes(word));
    }).slice(0, 10);

    return { songs: filtered };
  }

  return { songs: data };
}
