// Service Worker para Push Notifications de ARCANA
// Versión 2.0 - Soporte mejorado para iOS/Android con overlays en background

const ARCANA_ICON = '/arcana-notification-icon.png';
const ARCANA_BADGE = '/arcana-notification-icon.png';

// Mapeo de tipos de notificación a URLs de navegación
const TYPE_TO_URL = {
  service_overlay: '/agenda-ministerial',
  daily_verse: '/modulo-espiritual',
  daily_advice: '/modulo-espiritual',
  birthday: '/cumpleanos',
  director_replacement_request: '/reemplazos-director',
  director_replacement_response: '/reemplazos-director',
  song_selection: '/repertorio-musical',
  blood_donation: '/notificaciones',
  extraordinary_rehearsal: '/agenda-ministerial',
  ministry_instructions: '/notificaciones',
  death_announcement: '/notificaciones',
  meeting_announcement: '/notificaciones',
  special_service: '/agenda-ministerial',
  prayer_request: '/notificaciones',
  pregnancy_reveal: '/notificaciones',
  birth_announcement: '/notificaciones',
  general: '/notificaciones',
  system: '/notificaciones',
  chat_message: '/comunicacion',
  chat_buzz: '/comunicacion'
};

// Tipos que requieren interacción persistente (no se cierran automáticamente)
const PERSISTENT_TYPES = [
  'birthday', 
  'blood_donation', 
  'extraordinary_rehearsal',
  'death_announcement',
  'director_replacement_request',
  'pregnancy_reveal',
  'birth_announcement'
];

// Tipos de overlay que deben mostrarse cuando la app se abre
const OVERLAY_TYPES = [
  'service_overlay',
  'daily_verse',
  'daily_advice',
  'birthday',
  'death_announcement',
  'meeting_announcement',
  'special_service',
  'prayer_request',
  'blood_donation',
  'extraordinary_rehearsal',
  'ministry_instructions',
  'pregnancy_reveal',
  'birth_announcement'
];

// Títulos amigables para cada tipo de notificación
const NOTIFICATION_TITLES = {
  service_overlay: '📅 Servicio Próximo',
  daily_verse: '📖 Versículo del Día',
  daily_advice: '💡 Consejo del Día',
  birthday: '🎂 ¡Feliz Cumpleaños!',
  director_replacement_request: '🔄 Solicitud de Reemplazo',
  director_replacement_response: '✅ Respuesta de Reemplazo',
  song_selection: '🎵 Selección de Canciones',
  blood_donation: '🩸 Donación de Sangre',
  extraordinary_rehearsal: '🎤 Ensayo Extraordinario',
  ministry_instructions: '📋 Instrucciones Ministeriales',
  death_announcement: '🕯️ Anuncio Importante',
  meeting_announcement: '📢 Reunión',
  special_service: '⭐ Servicio Especial',
  prayer_request: '🙏 Petición de Oración',
  pregnancy_reveal: '👶 ¡Bebé en Camino!',
  birth_announcement: '🍼 ¡Nuevo Bebé!',
  chat_message: '💬 Nuevo Mensaje',
  chat_buzz: '🔔 ¡Zumbido!',
  general: '📱 ARCANA',
  system: '⚙️ Sistema'
};

self.addEventListener('push', event => {
  console.log('📱 [SW] Push notification received:', event);
  
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (e) {
    console.log('📱 [SW] Could not parse push data as JSON');
    data = { body: event.data?.text() || 'Nueva notificación de ARCANA' };
  }
  
  const notificationType = data.type || 'general';
  const targetUrl = data.url || data.click_action || TYPE_TO_URL[notificationType] || '/notificaciones';
  const isOverlayType = OVERLAY_TYPES.includes(notificationType);
  
  // Título personalizado según el tipo
  const defaultTitle = NOTIFICATION_TITLES[notificationType] || 'ARCANA';
  
  const options = {
    body: data.body || data.message || 'Nueva notificación de ARCANA',
    icon: ARCANA_ICON,
    badge: ARCANA_BADGE,
    vibrate: [200, 100, 200], // Patrón de vibración más notable
    data: {
      url: targetUrl,
      notificationId: data.notificationId || data.id,
      type: notificationType,
      metadata: data.metadata || {},
      timestamp: Date.now(),
      showOverlay: isOverlayType // Indica si debe mostrar overlay al abrir
    },
    actions: [
      {
        action: 'open',
        title: '📱 Ver',
        icon: ARCANA_ICON
      },
      {
        action: 'dismiss',
        title: '✕ Cerrar'
      }
    ],
    // Solo requiere interacción para tipos importantes
    requireInteraction: PERSISTENT_TYPES.includes(notificationType),
    // Agrupar por tipo para evitar spam
    tag: `arcana-${notificationType}-${data.notificationId || Date.now()}`,
    // Renotificar para actualizaciones
    renotify: true,
    // Sonido silencioso para iOS (maneja el sonido nativo)
    silent: false,
    // Configuración de imagen grande si viene
    ...(data.image && { image: data.image })
  };

  event.waitUntil(
    self.registration.showNotification(data.title || defaultTitle, options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('📱 [SW] Notification clicked:', event);
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/notificaciones';
  const showOverlay = notificationData.showOverlay || false;
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Abrir o enfocar ventana
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Buscar ventana existente de ARCANA
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(focusedClient => {
            // Enviar mensaje a la app para que muestre el overlay o navegue
            focusedClient.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: targetUrl,
              notificationData: {
                ...notificationData,
                showOverlay: showOverlay
              }
            });
            return focusedClient;
          });
        }
      }
      // Abrir nueva ventana si no hay ninguna
      // Añadir parámetro para indicar que debe mostrar overlay
      if (clients.openWindow) {
        const urlWithOverlay = showOverlay 
          ? `${targetUrl}?showOverlay=${notificationData.type}&notificationId=${notificationData.notificationId || ''}`
          : targetUrl;
        return clients.openWindow(urlWithOverlay);
      }
    })
  );
});

// Cerrar notificación
self.addEventListener('notificationclose', event => {
  console.log('📱 [SW] Notification closed:', event.notification.tag);
});

// Manejo de mensajes desde la aplicación
self.addEventListener('message', event => {
  console.log('📱 [SW] Service Worker received message:', event.data);
  
  if (event.data) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      
      case 'SHOW_NOTIFICATION':
        // Permitir mostrar notificaciones desde la app (para notificaciones en background)
        const { title, body, data, tag, type } = event.data.payload || {};
        const notificationType = type || data?.type || 'general';
        const defaultTitle = NOTIFICATION_TITLES[notificationType] || 'ARCANA';
        
        self.registration.showNotification(title || defaultTitle, {
          body: body || '',
          icon: ARCANA_ICON,
          badge: ARCANA_BADGE,
          tag: tag || `arcana-${notificationType}-${Date.now()}`,
          data: {
            ...data,
            type: notificationType,
            showOverlay: OVERLAY_TYPES.includes(notificationType)
          },
          vibrate: [200, 100, 200],
          requireInteraction: PERSISTENT_TYPES.includes(notificationType)
        });
        break;
        
      case 'SHOW_OVERLAY_NOTIFICATION':
        // Notificación específica para overlays (más prominente)
        const overlayData = event.data.payload || {};
        const overlayType = overlayData.type || 'general';
        const overlayTitle = NOTIFICATION_TITLES[overlayType] || overlayData.title || 'ARCANA';
        
        self.registration.showNotification(overlayTitle, {
          body: overlayData.message || overlayData.body || '',
          icon: ARCANA_ICON,
          badge: ARCANA_BADGE,
          tag: `arcana-overlay-${overlayType}-${Date.now()}`,
          data: {
            ...overlayData,
            showOverlay: true,
            url: TYPE_TO_URL[overlayType] || '/notificaciones'
          },
          vibrate: [300, 150, 300],
          requireInteraction: true,
          actions: [
            { action: 'view', title: '👀 Ver Detalle', icon: ARCANA_ICON },
            { action: 'dismiss', title: '✕ Cerrar' }
          ]
        });
        break;
    }
  }
});

// Instalación del service worker
self.addEventListener('install', event => {
  console.log('📱 [SW] ARCANA Service Worker installing...');
  self.skipWaiting();
});

// Activación
self.addEventListener('activate', event => {
  console.log('📱 [SW] ARCANA Service Worker activated');
  event.waitUntil(clients.claim());
});

// Background sync para notificaciones pendientes
self.addEventListener('sync', event => {
  console.log('📱 [SW] Background sync triggered:', event.tag);
  if (event.tag === 'arcana-notifications-sync') {
    event.waitUntil(checkPendingNotifications());
  }
});

// Verificar notificaciones pendientes (para cuando la app vuelve del background)
async function checkPendingNotifications() {
  try {
    // Notificar a todos los clientes que revisen notificaciones pendientes
    const allClients = await clients.matchAll({ type: 'window' });
    for (const client of allClients) {
      client.postMessage({
        type: 'CHECK_PENDING_NOTIFICATIONS'
      });
    }
  } catch (error) {
    console.error('📱 [SW] Error checking pending notifications:', error);
  }
}

console.log('📱 [SW] ARCANA Service Worker loaded successfully v2.0');
