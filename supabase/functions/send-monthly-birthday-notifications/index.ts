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

    console.log('Iniciando envío de notificaciones mensuales de cumpleaños...')

    // Obtener el mes actual
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    const currentMonthName = monthNames[now.getMonth()]

    // Obtener miembros con cumpleaños en el mes actual
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('nombres, apellidos, fecha_nacimiento, cargo')
      .eq('is_active', true)
      .not('fecha_nacimiento', 'is', null)

    if (membersError) {
      console.error('Error fetching members:', membersError)
      throw membersError
    }

    // Filtrar miembros que cumplen años este mes
    const birthdayMembers = members?.filter(member => {
      if (!member.fecha_nacimiento) return false
      const birthDate = new Date(member.fecha_nacimiento)
      return birthDate.getMonth() === now.getMonth()
    }) || []

    if (birthdayMembers.length === 0) {
      console.log(`No hay cumpleaños en ${currentMonthName}`)
      return new Response(
        JSON.stringify({ message: `No hay cumpleaños en ${currentMonthName}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crear mensaje con la lista de cumpleaños del mes
    const birthdayList = birthdayMembers
      .sort((a, b) => new Date(a.fecha_nacimiento!).getDate() - new Date(b.fecha_nacimiento!).getDate())
      .map(member => {
        const day = new Date(member.fecha_nacimiento!).getDate()
        return `• ${day} - ${member.nombres} ${member.apellidos}`
      })
      .join('\n')

    const notificationMessage = `🎉 Cumpleaños de ${currentMonthName}:\n\n${birthdayList}\n\n¡No olvides felicitarlos en sus días especiales! 🎂`

    // Crear datos de la tarjeta para mostrar visualmente
    const birthdayCard = {
      month: currentMonthName,
      year: now.getFullYear(),
      birthdays: birthdayMembers.map(member => ({
        name: `${member.nombres} ${member.apellidos}`,
        day: new Date(member.fecha_nacimiento!).getDate(),
        photo: member.photo_url,
        role: member.cargo
      }))
    }

    // Obtener todos los usuarios activos del sistema
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_active', true)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw profilesError
    }

    // Crear notificación para cada usuario
    const notifications = profiles?.map(profile => ({
      type: 'birthday_monthly',
      title: `🎂 Cumpleaños de ${currentMonthName}`,
      message: notificationMessage,
      recipient_id: profile.id,
      notification_category: 'birthday',
      priority: 2,
      metadata: {
        month: currentMonth,
        year: now.getFullYear(),
        birthday_count: birthdayMembers.length,
        birthday_card: birthdayCard,
        show_card: true
      }
    })) || []

    // Insertar notificaciones
    const { error: notificationError } = await supabase
      .from('system_notifications')
      .insert(notifications)

    if (notificationError) {
      console.error('Error inserting notifications:', notificationError)
      throw notificationError
    }

    console.log(`Enviadas ${notifications.length} notificaciones mensuales de cumpleaños para ${currentMonthName}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_sent: notifications.length,
        birthday_count: birthdayMembers.length,
        month: currentMonthName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in monthly birthday notifications:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})