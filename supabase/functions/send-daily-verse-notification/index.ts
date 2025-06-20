
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  test?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { test = false }: NotificationRequest = await req.json().catch(() => ({}));

    // Obtener el versículo del día
    const today = new Date().toISOString().split('T')[0];
    
    const { data: dailyVerse, error: verseError } = await supabase
      .from('daily_verses')
      .select(`
        *,
        bible_verses (
          book,
          chapter,
          verse,
          text,
          version
        )
      `)
      .eq('date', today)
      .single();

    if (verseError || !dailyVerse) {
      console.log('No daily verse found for today, creating one...');
      
      // Crear un versículo aleatorio para hoy
      const { data: verses } = await supabase
        .from('bible_verses')
        .select('*');

      if (verses && verses.length > 0) {
        const randomVerse = verses[Math.floor(Math.random() * verses.length)];
        
        const { data: newDailyVerse, error: createError } = await supabase
          .from('daily_verses')
          .insert({
            verse_id: randomVerse.id,
            date: today,
            reflection: "Que este versículo te inspire y fortalezca tu fe hoy."
          })
          .select(`
            *,
            bible_verses (
              book,
              chapter,
              verse,
              text,
              version
            )
          `)
          .single();

        if (createError) {
          throw createError;
        }
        
        // Usar el nuevo versículo creado
        const currentVerse = newDailyVerse;
      }
    }

    // Obtener todos los usuarios activos
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_active', true);

    if (profilesError) {
      throw profilesError;
    }

    const notificationTitle = "Versículo del Día - ARCANA";
    const notificationBody = `"${dailyVerse.bible_verses.text}" - ${dailyVerse.bible_verses.book} ${dailyVerse.bible_verses.chapter}:${dailyVerse.bible_verses.verse}`;

    if (test) {
      console.log(`Test notification would be sent to ${profiles?.length || 0} users`);
      console.log('Notification content:', { title: notificationTitle, body: notificationBody });
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Notificación de prueba procesada para ${profiles?.length || 0} usuarios`,
        verse: dailyVerse
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // En una implementación real, aquí enviarías las notificaciones push
    // Por ahora, solo simulamos el proceso
    let notificationsSent = 0;
    
    if (profiles) {
      for (const profile of profiles) {
        try {
          // Aquí iría la lógica para enviar notificación push real
          // Por ejemplo, usando Firebase Cloud Messaging o similar
          console.log(`Sending notification to ${profile.email}`);
          notificationsSent++;
        } catch (error) {
          console.error(`Failed to send notification to ${profile.email}:`, error);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      notificationsSent,
      verse: dailyVerse,
      message: `Notificaciones enviadas a ${notificationsSent} usuarios`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in send-daily-verse-notification:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
