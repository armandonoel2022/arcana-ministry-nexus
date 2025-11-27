import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScheduledNotification {
  id: string;
  name: string;
  notification_type: string;
  days_of_week: number[];
  time: string;
  is_active: boolean;
  target_audience: string;
  metadata?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting scheduled notifications check...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get current day and time in Dominican Republic timezone
    const rdNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santo_Domingo' }));
    const currentDay = rdNow.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentHour = rdNow.getHours();
    const currentMinute = rdNow.getMinutes();
    
    // Format time as HH:MM:00 for exact comparison
    // The database stores time in HH:MM:SS format, so we need to match exactly
    const currentTime = `${String(currentHour).padStart(2,'0')}:${String(currentMinute).padStart(2,'0')}:00`;
    
    console.log(`Current day: ${currentDay}, current time: ${currentTime}`);

    // Find scheduled notifications for current day and time
    // Match exact time (HH:MM:00) to ensure reliable triggering
    const { data: scheduledNotifications, error: scheduledError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .contains('days_of_week', [currentDay])
      .eq('time', currentTime)
      .eq('is_active', true);

    if (scheduledError) {
      console.error('Error fetching scheduled notifications:', scheduledError);
      throw scheduledError;
    }

    console.log(`Found ${scheduledNotifications?.length || 0} scheduled notifications`);

    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No scheduled notifications for current time',
          day: currentDay,
          time: currentTime
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedNotifications = 0;

    // Process each scheduled notification
    for (const notification of scheduledNotifications) {
      console.log(`Processing notification: ${notification.name} - Type: ${notification.notification_type}`);
      
      switch (notification.notification_type) {
        case 'service_overlay':
          await processServiceOverlayNotification(supabase, notification);
          break;
        case 'daily_verse':
          await processDailyVerseNotification(supabase, notification);
          break;
        case 'daily_advice':
          await processDailyAdviceNotification(supabase, notification);
          break;
        case 'special_event':
          await processSpecialEventNotification(supabase, notification);
          break;
        default:
          await processGeneralNotification(supabase, notification);
      }
      
      processedNotifications++;
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully processed ${processedNotifications} scheduled notifications`,
        notifications: scheduledNotifications.map(n => ({ id: n.id, name: n.name, type: n.notification_type }))
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scheduled notifications function:', error);
    return new Response(
      JSON.stringify({ error: (error as any)?.message || String(error) }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processServiceOverlayNotification(supabase: any, notification: ScheduledNotification) {
  console.log('Processing service overlay notification...');
  
  try {
    // Get weekend services (next weekend)
    const weekendServices = await getNextWeekendServices(supabase);
    
    if (weekendServices.length === 0) {
      console.log('No weekend services found');
      return;
    }

    // Get all active users to send notification to
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_active', true);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Sending service overlay notification to ${profiles?.length || 0} users`);

    // Create the service overlay notification metadata
    const servicesMetadata = {
      service_date: weekendServices[0].service_date,
      services: weekendServices.map((service: any) => ({
        id: service.id,
        date: service.service_date,
        title: service.title,
        leader: service.leader,
        group: service.worship_groups?.name,
        time: getServiceTime(service.title),
        director: {
          name: service.leader,
          photo: null
        },
        voices: [],
        songs: []
      }))
    };

    // Send notification to all active users
    for (const profile of profiles) {
      await supabase
        .from('system_notifications')
        .insert({
          recipient_id: profile.id,
          type: 'service_overlay',
          title: 'Programa de Servicios - Fin de Semana',
          message: `Servicios programados para el próximo fin de semana`,
          notification_category: 'agenda',
          metadata: servicesMetadata,
          priority: 2
        });
    }

    console.log('Service overlay notification sent successfully');
    
  } catch (error) {
    console.error('Error processing service overlay notification:', error);
    throw error;
  }
}

async function processDailyVerseNotification(supabase: any, notification: ScheduledNotification) {
  console.log('Processing daily verse notification...');
  
  try {
    // Get today's verse or create one
    const today = new Date().toISOString().split('T')[0];
    
    let { data: dailyVerse, error: verseError } = await supabase
      .from('daily_verses')
      .select('*, bible_verses (*)')
      .eq('date', today)
      .single();

    // If no verse for today, create one
    if (!dailyVerse) {
      // Get a random verse
      const { data: randomVerse, error: randomError } = await supabase
        .from('bible_verses')
        .select('*')
        .limit(1)
        .order('id', { ascending: false });

      if (randomError) throw randomError;
      if (!randomVerse || randomVerse.length === 0) {
        console.log('No verses available in database');
        return;
      }

      // Create daily verse entry
      const { data: newDailyVerse, error: insertError } = await supabase
        .from('daily_verses')
        .insert({
          date: today,
          verse_id: randomVerse[0].id
        })
        .select('*, bible_verses (*)')
        .single();

      if (insertError) throw insertError;
      dailyVerse = newDailyVerse;
    }

    // Get all active users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_active', true);

    if (profilesError) throw profilesError;

    console.log(`Sending daily verse notification to ${profiles?.length || 0} users`);

    // Send notification to all active users
    for (const profile of profiles) {
      await supabase
        .from('system_notifications')
        .insert({
          recipient_id: profile.id,
          type: 'daily_verse',
          title: 'Versículo del Día',
          message: dailyVerse.bible_verses.text,
          notification_category: 'spiritual',
          metadata: {
            verse_reference: `${dailyVerse.bible_verses.book} ${dailyVerse.bible_verses.chapter}:${dailyVerse.bible_verses.verse}`,
            verse_text: dailyVerse.bible_verses.text,
            verse_date: today
          },
          priority: 1
        });
    }

    console.log('Daily verse notification sent successfully');
    
  } catch (error) {
    console.error('Error processing daily verse notification:', error);
    throw error;
  }
}

async function processDailyAdviceNotification(supabase: any, notification: ScheduledNotification) {
  console.log('Processing daily advice notification...');
  
  try {
    const adviceMessages = [
      { title: 'Ensaya con Propósito', message: 'Dedica tiempo de calidad a cada ensayo. La excelencia viene de la práctica constante.' },
      { title: 'Unidad en el Ministerio', message: 'Recuerda que somos un solo cuerpo. Apoya a tus hermanos en el ministerio.' },
      { title: 'Preparación Espiritual', message: 'Antes de ministrar, prepara tu corazón. La adoración nace de una vida en comunión con Dios.' },
      { title: 'Puntualidad es Respeto', message: 'Llegar a tiempo a los ensayos y servicios demuestra compromiso y respeto a tus hermanos.' },
      { title: 'Cuida tu Voz', message: 'Tu voz es un instrumento. Mantente hidratado y descansa adecuadamente.' }
    ];

    const randomAdvice = adviceMessages[Math.floor(Math.random() * adviceMessages.length)];

    // Get all active users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_active', true);

    if (profilesError) throw profilesError;

    console.log(`Sending daily advice notification to ${profiles?.length || 0} users`);

    // Send notification to all active users
    for (const profile of profiles) {
      await supabase
        .from('system_notifications')
        .insert({
          recipient_id: profile.id,
          type: 'daily_advice',
          title: randomAdvice.title,
          message: randomAdvice.message,
          notification_category: 'general',
          metadata: {
            advice_title: randomAdvice.title,
            advice_message: randomAdvice.message,
            advice_type: 'daily',
            date: new Date().toISOString().split('T')[0]
          },
          priority: 1
        });
    }

    console.log('Daily advice notification sent successfully');
    
  } catch (error) {
    console.error('Error processing daily advice notification:', error);
    throw error;
  }
}

async function processSpecialEventNotification(supabase: any, notification: ScheduledNotification) {
  console.log('Processing special event notification...');
  
  try {
    // Check if there are any events scheduled
    const { data: events, error: eventsError } = await supabase
      .from('special_events')
      .select('*')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(1);

    if (eventsError) throw eventsError;

    if (!events || events.length === 0) {
      console.log('No upcoming events found');
      return;
    }

    const event = events[0];

    // Get all active users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_active', true);

    if (profilesError) throw profilesError;

    console.log(`Sending special event notification to ${profiles?.length || 0} users`);

    // Send notification to all active users
    for (const profile of profiles) {
      await supabase
        .from('system_notifications')
        .insert({
          recipient_id: profile.id,
          type: 'special_event',
          title: `Evento Especial: ${event.title}`,
          message: event.description || 'Tenemos un evento especial próximamente',
          notification_category: 'agenda',
          metadata: {
            event_id: event.id,
            event_title: event.title,
            event_date: event.event_date,
            event_location: event.location
          },
          priority: 2
        });
    }

    console.log('Special event notification sent successfully');
    
  } catch (error) {
    console.error('Error processing special event notification:', error);
    throw error;
  }
}

async function processGeneralNotification(supabase: any, notification: ScheduledNotification) {
  console.log(`Processing general notification: ${notification.name}`);
  
  try {
    // Get all active users to send notification to
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_active', true);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Sending ${notification.notification_type} notification to ${profiles?.length || 0} users`);

    // Determine title and message based on notification type
    let title = notification.name;
    let message = 'Esta es una notificación programada.';
    let category = 'system';

    switch (notification.notification_type) {
      case 'death_announcement':
        category = 'general';
        break;
      case 'meeting_announcement':
        category = 'general';
        break;
      case 'special_service':
        category = 'agenda';
        break;
      case 'prayer_request':
        category = 'general';
        break;
      case 'blood_donation':
        category = 'general';
        break;
      case 'extraordinary_rehearsal':
        category = 'agenda';
        break;
      case 'ministry_instructions':
        category = 'general';
        break;
      default:
        category = 'system';
    }

    // Send notification to all active users
    for (const profile of profiles) {
      await supabase
        .from('system_notifications')
        .insert({
          recipient_id: profile.id,
          type: notification.notification_type,
          title: title,
          message: message,
          notification_category: category,
          metadata: notification.metadata || {},
          priority: 1
        });
    }

    console.log('General notification processed successfully');
    
  } catch (error) {
    console.error('Error processing general notification:', error);
    throw error;
  }
}

async function getNextWeekendServices(supabase: any) {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  
  let weekStart: Date, weekEnd: Date;
  
  // Logic to determine which weekend to show
  if ((currentDay > 3) || (currentDay === 3 && currentHour >= 14)) {
    // If it's Thursday after 2 PM or later, show next weekend
    const daysToAdd = currentDay === 0 ? 5 : (12 - currentDay) % 7;
    weekStart = new Date(now);
    weekStart.setDate(now.getDate() + daysToAdd);
    weekStart.setHours(0, 0, 0, 0);
    
    weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 2);
    weekEnd.setHours(23, 59, 59, 999);
  } else {
    // Show current/next weekend
    const daysUntilFriday = (5 - currentDay + 7) % 7;
    weekStart = new Date(now);
    weekStart.setDate(now.getDate() + daysUntilFriday);
    weekStart.setHours(0, 0, 0, 0);
    
    weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 2);
    weekEnd.setHours(23, 59, 59, 999);
  }
  
  const { data: services, error } = await supabase
    .from('services')
    .select(`
      *,
      worship_groups (
        id,
        name,
        color_theme
      )
    `)
    .gte('service_date', weekStart.toISOString())
    .lte('service_date', weekEnd.toISOString())
    .order('service_date', { ascending: true });

  if (error) {
    console.error('Error fetching weekend services:', error);
    throw error;
  }

  return services || [];
}

function getServiceTime(serviceTitle: string): string {
  if (serviceTitle.toLowerCase().includes('primera') || serviceTitle.toLowerCase().includes('8:00')) {
    return '8:00 AM';
  } else if (serviceTitle.toLowerCase().includes('segunda') || serviceTitle.toLowerCase().includes('10:45')) {
    return '10:45 AM';
  }
  return '';
}