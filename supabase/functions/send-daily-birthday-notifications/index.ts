import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Iniciando envío de notificaciones diarias de cumpleaños...')

    const today = new Date()
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()

    // Obtener miembros que cumplen años hoy
    const { data: birthdayMembers, error: membersError } = await supabase
      .from('members')
      .select('id, nombres, apellidos, fecha_nacimiento, cargo, photo_url')
      .eq('is_active', true)
      .not('fecha_nacimiento', 'is', null)

    if (membersError) {
      console.error('Error fetching members:', membersError)
      throw membersError
    }

    // Filtrar miembros que cumplen años hoy
    const todayBirthdays = birthdayMembers?.filter(member => {
      if (!member.fecha_nacimiento) return false
      const birthDate = new Date(member.fecha_nacimiento)
      return birthDate.getMonth() === today.getMonth() && birthDate.getDate() === today.getDate()
    }) || []

    if (todayBirthdays.length === 0) {
      console.log('No hay cumpleaños hoy')
      return new Response(
        JSON.stringify({ message: 'No hay cumpleaños hoy' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Encontrados ${todayBirthdays.length} cumpleaños hoy`)

    // Obtener todos los usuarios activos del sistema
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_active', true)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw profilesError
    }

    let notificationsSent = 0

    // Para cada persona que cumple años, enviar notificaciones con delay
    for (let i = 0; i < todayBirthdays.length; i++) {
      const member = todayBirthdays[i]
      
      // Esperar 1 minuto entre notificaciones si hay múltiples cumpleaños
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 60000)) // 60 seconds
      }

      const notificationMessage = `🎉 ¡Hoy está de cumpleaños ${member.nombres} ${member.apellidos}! 🎂\n\nRecuerda ir a la sala de chat general y dedicarle un mensaje de felicitación. ¡Hagamos que se sienta especial en su día! ✨`

      // Crear notificaciones para todos los usuarios
      const notifications = profiles?.map(profile => ({
        type: 'birthday_daily',
        title: `🎂 ¡Feliz Cumpleaños ${member.nombres}!`,
        message: notificationMessage,
        recipient_id: profile.id,
        notification_category: 'birthday',
        priority: 3,
        metadata: {
          birthday_member_id: member.id,
          birthday_member_name: `${member.nombres} ${member.apellidos}`,
          birthday_member_photo: member.photo_url,
          birthday_date: today.toISOString().split('T')[0]
        }
      })) || []

      // Insertar notificaciones
      const { error: notificationError } = await supabase
        .from('system_notifications')
        .insert(notifications)

      if (notificationError) {
        console.error(`Error inserting notifications for ${member.nombres}:`, notificationError)
        continue
      }

      notificationsSent += notifications.length
      console.log(`Enviadas ${notifications.length} notificaciones para el cumpleaños de ${member.nombres} ${member.apellidos}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_sent: notificationsSent,
        birthday_members: todayBirthdays.length,
        birthdays: todayBirthdays.map(m => `${m.nombres} ${m.apellidos}`)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in daily birthday notifications:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})