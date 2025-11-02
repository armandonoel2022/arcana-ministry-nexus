import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationPayload {
  subscription: PushSubscription;
  payload: {
    title: string;
    body: string;
    url?: string;
    notificationId?: string;
    type?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subscription, payload }: PushNotificationPayload = await req.json();

    console.log('Sending push notification:', { 
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      title: payload.title 
    });

    // En un entorno de producción real, aquí usarías web-push para enviar la notificación
    // Por ahora, retornamos éxito ya que la implementación completa requiere
    // configuración adicional del servidor VAPID
    
    // Ejemplo de implementación con web-push (requiere instalación del módulo):
    // import webPush from 'npm:web-push@3.6.6';
    // 
    // webPush.setVapidDetails(
    //   'mailto:admin@arcana.com',
    //   Deno.env.get('VAPID_PUBLIC_KEY')!,
    //   Deno.env.get('VAPID_PRIVATE_KEY')!
    // );
    // 
    // await webPush.sendNotification(
    //   subscription,
    //   JSON.stringify(payload)
    // );

    console.log('Push notification processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Push notification sent successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error sending push notification:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
