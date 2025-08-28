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
  day_of_week: number;
  time: string;
  is_active: boolean;
  target_audience: string;
  metadata?: any;
}

interface WeekendService {
  id: string;
  service_date: string;
  title: string;
  leader: string;
  service_type: string;
  location: string;
  special_activity: string | null;
  worship_groups?: {
    id: string;
    name: string;
    color_theme: string;
  };
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

    // Get current day and time
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    console.log(`Current day: ${currentDay}, current time: ${currentTime}`);

    // Find scheduled notifications for current day and time
    const { data: scheduledNotifications, error: scheduledError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('day_of_week', currentDay)
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
      console.log(`Processing notification: ${notification.name}`);
      
      if (notification.notification_type === 'service_overlay') {
        await processServiceOverlayNotification(supabase, notification);
      } else {
        await processGeneralNotification(supabase, notification);
      }
      
      processedNotifications++;
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully processed ${processedNotifications} scheduled notifications`,
        notifications: scheduledNotifications.map(n => ({ id: n.id, name: n.name }))
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scheduled notifications function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
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
      services: weekendServices.map(service => ({
        id: service.id,
        date: service.service_date,
        title: service.title,
        leader: service.leader,
        group: service.worship_groups?.name,
        time: getServiceTime(service.title),
        director: {
          name: service.leader,
          photo: null // Will be populated from group members if available
        },
        voices: [], // Will be populated from group members if available
        songs: [] // Will be populated from service songs if available
      }))
    };

    // Send notification to all users (global notification)
    const { error: notificationError } = await supabase
      .from('system_notifications')
      .insert({
        recipient_id: null, // Global notification
        type: 'service_program',
        title: 'Programa de Servicios - Fin de Semana',
        message: `Servicios programados para el próximo fin de semana`,
        notification_category: 'agenda',
        metadata: servicesMetadata,
        priority: 2
      });

    if (notificationError) {
      console.error('Error creating service overlay notification:', notificationError);
      throw notificationError;
    }

    console.log('Service overlay notification sent successfully');
    
  } catch (error) {
    console.error('Error processing service overlay notification:', error);
    throw error;
  }
}

async function processGeneralNotification(supabase: any, notification: ScheduledNotification) {
  console.log(`Processing general notification: ${notification.name}`);
  
  // For now, just log general notifications
  // You can extend this to handle different types of general notifications
  console.log('General notification processed');
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