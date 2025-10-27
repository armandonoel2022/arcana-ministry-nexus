import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Member {
  id: string;
  nombres: string;
  apellidos: string;
  photo_url?: string;
  cargo: string;
  fecha_nacimiento: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get current date in RD timezone
    const today = new Date();
    const rdDateStr = today.toLocaleDateString('en-CA', {
      timeZone: 'America/Santo_Domingo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [, monthStr, dayStr] = rdDateStr.split('-');
    const currentMonth = Number(monthStr);
    const currentDay = Number(dayStr);

    console.log(`Checking birthdays for ${currentMonth}/${currentDay} in RD timezone`);

    // Fetch all active members with birthdays
    const { data: members, error: membersError } = await supabaseClient
      .from('members')
      .select('id, nombres, apellidos, photo_url, cargo, fecha_nacimiento')
      .eq('is_active', true)
      .not('fecha_nacimiento', 'is', null);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      throw membersError;
    }

    // Filter members with today's birthday
    const todaysBirthdays = (members || []).filter((member: Member) => {
      if (!member.fecha_nacimiento) return false;
      const [, m, d] = member.fecha_nacimiento.split('-').map(Number);
      return m === currentMonth && d === currentDay;
    });

    console.log(`Found ${todaysBirthdays.length} birthdays today`);

    if (todaysBirthdays.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No birthdays today',
          date: rdDateStr 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Create system notifications for each birthday person
    const notifications = todaysBirthdays.map((member: Member) => ({
      type: 'birthday_daily',
      title: `🎉 ¡Cumpleaños de ${member.nombres}!`,
      message: `Hoy es el cumpleaños de ${member.nombres} ${member.apellidos}. ¡Felicitémosle en este día especial!`,
      notification_category: 'birthday',
      priority: 3,
      metadata: {
        member_id: member.id,
        birthday_member_name: `${member.nombres} ${member.apellidos}`,
        birthday_member_photo: member.photo_url,
        member_role: member.cargo,
        birthday_date: rdDateStr,
        birthday: true,
        show_confetti: true,
        play_birthday_sound: true
      }
    }));

    const { error: notificationError } = await supabaseClient
      .from('system_notifications')
      .insert(notifications);

    if (notificationError) {
      console.error('Error creating notifications:', notificationError);
      throw notificationError;
    }

    console.log(`Created ${notifications.length} birthday notifications`);

    return new Response(
      JSON.stringify({ 
        success: true,
        birthdaysProcessed: todaysBirthdays.length,
        members: todaysBirthdays.map((m: Member) => `${m.nombres} ${m.apellidos}`)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-birthday-overlay-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
