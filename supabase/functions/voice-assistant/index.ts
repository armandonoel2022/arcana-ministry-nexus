import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { command, userId } = await req.json();
    
    if (!command) {
      throw new Error('Comando de voz requerido');
    }

    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key no configurada');
    }

    // Procesar comando con OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres ARCANA, un asistente personal para miembros de un ministerio de alabanza. 
            Puedes ayudar con:
            - Control de gastos personales
            - Información sobre agenda ministerial
            - Recordatorios de ensayos
            - Consultas sobre canciones y repertorio
            
            Responde de forma concisa y amigable. Si el comando es sobre agregar gastos, 
            responde con formato JSON: {"action": "add_expense", "description": "...", "amount": 0}
            
            Para otros comandos, responde con texto normal.`
          },
          {
            role: 'user',
            content: command
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error('Error al procesar comando con OpenAI');
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content;

    // Intentar parsear como JSON para acciones específicas
    let actionData = null;
    try {
      actionData = JSON.parse(assistantResponse);
    } catch {
      // Si no es JSON, es una respuesta de texto normal
    }

    return new Response(
      JSON.stringify({ 
        response: assistantResponse,
        action: actionData?.action,
        data: actionData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en voice-assistant:', error);
    return new Response(
      JSON.stringify({ error: (error as any)?.message || String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});