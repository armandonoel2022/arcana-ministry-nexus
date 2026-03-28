import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestNotificationRequest {
  birthdayMemberId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Iniciando prueba de notificaciones diarias de cumpleaños...')

    // Obtener el ID del miembro desde el request body para pruebas
    const { birthdayMemberId }: TestNotificationRequest = await req.json().catch(() => ({}))

    let birthdayMembers;

    if (birthdayMemberId) {
      // Modo prueba: usar el miembro seleccionado
      const { data: selectedMember, error: memberError } = await supabase
        .from('members')
        .select('id, nombres, apellidos, fecha_nacimiento, cargo, photo_url')
        .eq('id', birthdayMemberId)
        .eq('is_active', true)
        .single()

      if (memberError || !selectedMember) {
        throw new Error('Miembro no encontrado')
      }

      birthdayMembers = [selectedMember]
      console.log(`Modo prueba: usando miembro ${selectedMember.nombres} ${selectedMember.apellidos}`)
    } else {
      // Modo automático: usar cumpleaños de hoy
      const today = new Date()
      
      const { data: allMembers, error: membersError } = await supabase
        .from('members')
        .select('id, nombres, apellidos, fecha_nacimiento, cargo, photo_url')
        .eq('is_active', true)
        .not('fecha_nacimiento', 'is', null)

      if (membersError) {
        console.error('Error fetching members:', membersError)
        throw membersError
      }

      // Filtrar miembros que cumplen años hoy usando zona horaria de República Dominicana
      const tzDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' })
      const [, tzMonthStr, tzDayStr] = tzDateStr.split('-')
      const tzMonth = Number(tzMonthStr) - 1
      const tzDay = Number(tzDayStr)

      birthdayMembers = allMembers?.filter(member => {
        if (!member.fecha_nacimiento) return false
        const parts = member.fecha_nacimiento.split('-').map(Number)
        if (parts.length !== 3) return false
        const month = parts[1] - 1
        const day = parts[2]
        return month === tzMonth && day === tzDay
      }) || []
    }

    if (birthdayMembers.length === 0) {
      console.log('No hay cumpleaños para notificar')
      return new Response(
        JSON.stringify({ message: 'No hay cumpleaños para notificar' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Encontrados ${birthdayMembers.length} cumpleaños para notificar`)

    // Obtener todos los usuarios activos del sistema
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('is_active', true)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw profilesError
    }

    console.log(`Found ${profiles?.length || 0} active profiles to notify`)

    let notificationsSent = 0

    // Para cada persona que cumple años, enviar notificaciones con delay
    for (let i = 0; i < birthdayMembers.length; i++) {
      const member = birthdayMembers[i]
      
      // Solo esperar si hay múltiples cumpleaños y no es prueba
      if (i > 0 && !birthdayMemberId) {
        await new Promise(resolve => setTimeout(resolve, 60000)) // 60 seconds
      }

      // Buscar el perfil del miembro que cumple años
      const birthdayProfile = profiles?.find(profile => 
        profile.full_name?.toLowerCase().includes(member.nombres.toLowerCase()) &&
        profile.full_name?.toLowerCase().includes(member.apellidos.toLowerCase())
      )

      // Mensaje para otros integrantes
      const notificationMessageForOthers = `🎉 ¡Hoy está de cumpleaños ${member.nombres} ${member.apellidos}! 🎂\n\nRecuerda ir a la sala de chat general y dedicarle un mensaje de felicitación. ¡Hagamos que se sienta especial en su día! ✨`
      
      // Mensaje para el cumpleañero
      const notificationMessageForBirthday = `🎉 ¡Feliz cumpleaños ${member.nombres}! 🎂\n\n¡Hoy es tu día especial! Que Dios te bendiga grandemente en este nuevo año de vida. ✨`

      // Crear notificaciones programadas para las 07:30 AM
      const birthdayDate = new Date()
      const scheduledTime = new Date(birthdayDate)
      scheduledTime.setHours(7, 30, 0, 0)
      
      // Si ya pasaron las 07:30 AM de hoy, programar para mañana (solo en modo automático)
      if (!birthdayMemberId && birthdayDate.getHours() >= 7 && birthdayDate.getMinutes() >= 30) {
        scheduledTime.setDate(scheduledTime.getDate() + 1)
      }

      // Crear notificaciones para todos los usuarios EXCEPTO el que cumple años
      const notificationsForOthers = profiles?.filter(profile => 
        profile.id !== birthdayProfile?.id // Excluir al cumpleañero
      ).map(profile => ({
        type: 'birthday_daily',
        title: `🎂 ¡Feliz Cumpleaños ${member.nombres}!`,
        message: notificationMessageForOthers,
        recipient_id: profile.id,
        notification_category: 'birthday',
        priority: 3,
        scheduled_for: birthdayMemberId ? null : scheduledTime.toISOString(), // Solo programar en modo automático
        metadata: {
          birthday_member_id: member.id,
          birthday_member_name: `${member.nombres} ${member.apellidos}`,
          birthday_member_photo: member.photo_url,
          birthday_date: new Date().toISOString().split('T')[0],
          show_confetti: true,
          is_test: !!birthdayMemberId,
          play_birthday_sound: true
        }
      })) || []

      // Crear notificación especial para el cumpleañero (si tiene perfil)
      const notificationForBirthday = birthdayProfile ? [{
        type: 'birthday_daily',
        title: `🎂 ¡Feliz Cumpleaños!`,
        message: notificationMessageForBirthday,
        recipient_id: birthdayProfile.id,
        notification_category: 'birthday',
        priority: 3,
        scheduled_for: birthdayMemberId ? null : scheduledTime.toISOString(), // Solo programar en modo automático
        metadata: {
          birthday_member_id: member.id,
          birthday_member_name: `${member.nombres} ${member.apellidos}`,
          birthday_member_photo: member.photo_url,
          birthday_date: new Date().toISOString().split('T')[0],
          show_confetti: true,
          is_test: !!birthdayMemberId,
          is_birthday_person: true,
          play_birthday_sound: true
        }
      }] : []

      // Combinar todas las notificaciones
      const allNotifications = [...notificationsForOthers, ...notificationForBirthday]

      // Insertar notificaciones
      if (allNotifications.length === 0) {
        console.log(`No notifications to send for ${member.nombres} (no profiles found)`)
        continue
      }

      console.log(`Inserting ${allNotifications.length} notifications for ${member.nombres} ${member.apellidos}`)
      console.log(`- ${notificationsForOthers.length} for other members`)
      console.log(`- ${notificationForBirthday.length} for birthday person`)
      console.log('Sample notification for others:', JSON.stringify(notificationsForOthers[0], null, 2))
      if (notificationForBirthday.length > 0) {
        console.log('Sample notification for birthday person:', JSON.stringify(notificationForBirthday[0], null, 2))
      }

      const { error: notificationError } = await supabase
        .from('system_notifications')
        .insert(allNotifications)

      if (notificationError) {
        console.error(`Error inserting notifications for ${member.nombres}:`, notificationError)
        continue
      }

      notificationsSent += allNotifications.length
      console.log(`Enviadas ${allNotifications.length} notificaciones para el cumpleaños de ${member.nombres} ${member.apellidos}`)

      // Send native push notifications (web + iOS)
      for (const notif of allNotifications) {
        try {
          // Web push
          const { data: subs } = await supabase
            .from('user_push_subscriptions')
            .select('subscription')
            .eq('user_id', notif.recipient_id)

          if (subs && subs.length > 0) {
            for (const sub of subs) {
              await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                },
                body: JSON.stringify({
                  subscription: sub.subscription,
                  payload: {
                    title: notif.title,
                    body: notif.message,
                    icon: '/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png',
                    url: '/cumpleanos',
                    type: 'birthday'
                  }
                })
              }).catch(e => console.error('Web push error:', e))
            }
          }

          // iOS push
          const { data: devices } = await supabase
            .from('user_devices')
            .select('device_token, platform')
            .eq('user_id', notif.recipient_id)
            .eq('is_active', true)

          if (devices && devices.length > 0) {
            for (const device of devices) {
              if (device.platform === 'ios' && device.device_token) {
                await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-ios-push`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                  },
                  body: JSON.stringify({
                    deviceToken: device.device_token,
                    title: notif.title,
                    body: notif.message,
                    data: { url: '/cumpleanos', type: 'birthday' }
                  })
                }).catch(e => console.error('iOS push error:', e))
              }
            }
          }
        } catch (pushErr) {
          console.error(`Push error for ${notif.recipient_id}:`, pushErr)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_sent: notificationsSent,
        birthday_members: birthdayMembers.length,
        birthdays: birthdayMembers.map(m => `${m.nombres} ${m.apellidos}`),
        sent_to_everyone: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in daily birthday notifications:', error)
    return new Response(
      JSON.stringify({ error: (error as any)?.message || String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})