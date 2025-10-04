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

    // Obtener el mes actual en zona horaria de República Dominicana
    const nowTzStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' })
    const [yearStr, monthStr] = nowTzStr.split('-')
    const currentMonth = Number(monthStr)
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    const currentMonthName = monthNames[currentMonth - 1]

    // Obtener miembros con cumpleaños en el mes actual
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('nombres, apellidos, fecha_nacimiento, cargo, photo_url')
      .eq('is_active', true)
      .not('fecha_nacimiento', 'is', null)

    if (membersError) {
      console.error('Error fetching members:', membersError)
      throw membersError
    }

    // Filtrar miembros que cumplen años este mes usando zona horaria RD
    const birthdayMembers = members?.filter(member => {
      if (!member.fecha_nacimiento) return false
      const parts = member.fecha_nacimiento.split('-')
      if (parts.length !== 3) return false
      const month = Number(parts[1]) // 1-12
      return month === currentMonth
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
      .sort((a, b) => {
        const dayA = Number(a.fecha_nacimiento!.split('-')[2])
        const dayB = Number(b.fecha_nacimiento!.split('-')[2])
        return dayA - dayB
      })
      .map(member => {
        const day = Number(member.fecha_nacimiento!.split('-')[2])
        return `• ${day} - ${member.nombres} ${member.apellidos}`
      })
      .join('\n')

    const notificationMessage = `🎉 Cumpleaños de ${currentMonthName}:\n\n${birthdayList}\n\n¡No olvides felicitarlos en sus días especiales! 🎂`

    // Crear datos de la tarjeta para mostrar visualmente
    const birthdayCard = {
      month: currentMonthName,
      year: Number(yearStr),
        birthdays: birthdayMembers.map(member => ({
          name: `${member.nombres} ${member.apellidos}`,
          day: Number(member.fecha_nacimiento!.split('-')[2]),
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
        year: Number(yearStr),
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
      JSON.stringify({ error: (error as any)?.message || String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})