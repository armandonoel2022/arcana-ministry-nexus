import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { deviceToken, title, body, data, badge = 1 } = await req.json();

    console.log('📱 Enviando push iOS a dispositivo:', deviceToken?.substring(0, 20) + '...');

    // Configuración desde variables de entorno
    const TEAM_ID = Deno.env.get('APNS_TEAM_ID') || '';
    const KEY_ID = Deno.env.get('APNS_KEY_ID') || '';
    const PRIVATE_KEY = Deno.env.get('APNS_PRIVATE_KEY') || '';
    const TOPIC = Deno.env.get('APNS_TOPIC') || 'do.com.arcana.app';
    const IS_PRODUCTION = Deno.env.get('APNS_PRODUCTION') === 'true';
    
    const APNS_HOST = IS_PRODUCTION 
      ? 'api.push.apple.com' 
      : 'api.sandbox.push.apple.com';

    console.log('🔧 Configuración APNs:', {
      teamId: TEAM_ID ? '✓' : '✗',
      keyId: KEY_ID ? '✓' : '✗',
      privateKey: PRIVATE_KEY ? '✓' : '✗',
      topic: TOPIC,
      isProduction: IS_PRODUCTION,
      host: APNS_HOST
    });

    if (!TEAM_ID || !KEY_ID || !PRIVATE_KEY) {
      throw new Error('Faltan credenciales APNs. Verifica APNS_TEAM_ID, APNS_KEY_ID y APNS_PRIVATE_KEY');
    }

    if (!deviceToken) {
      throw new Error('deviceToken es requerido');
    }

    // Formatear la private key correctamente (reemplazar \n literales por saltos de línea reales)
    const formattedPrivateKey = PRIVATE_KEY.replace(/\\n/g, '\n');

    // 1. Generar JWT Token para autenticación
    const privateKey = await jose.importPKCS8(formattedPrivateKey, 'ES256');
    
    const jwt = await new jose.SignJWT({})
      .setProtectedHeader({ 
        alg: 'ES256', 
        kid: KEY_ID 
      })
      .setIssuer(TEAM_ID)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);

    console.log('🔐 JWT generado correctamente');

    // 2. Crear payload de notificación
    const payload = {
      aps: {
        alert: {
          title,
          body,
        },
        sound: "default",
        badge,
        'content-available': 1,
        'mutable-content': 1,
      },
      ...(data || {}),
    };

    console.log('📦 Payload:', JSON.stringify(payload));

    // 3. Enviar a APNs
    const response = await fetch(`https://${APNS_HOST}/3/device/${deviceToken}`, {
      method: 'POST',
      headers: {
        'apns-topic': TOPIC,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'apns-expiration': '0',
        'Authorization': `bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const apnsId = response.headers.get('apns-id');
    
    if (response.status === 200) {
      console.log('✅ Push enviada exitosamente. APNs ID:', apnsId);
      return new Response(
        JSON.stringify({ success: true, apnsId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = { raw: errorText };
      }
      
      console.error('❌ Error APNs:', response.status, errorJson);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: response.status,
          error: errorJson,
          apnsId
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('❌ Error inesperado:', error.message, error.stack);
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
