// Service Worker para Push Notifications de ARCANA
// Versión actualizada con soporte mejorado para iOS/Android

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
  general: '/notificaciones',
  system: '/notificaciones'
};

// Tipos que requieren interacción persistente
const PERSISTENT_TYPES = [
  'birthday', 
  'blood_donation', 
  'extraordinary_rehearsal',
  'death_announcement',
  'director_replacement_request'
];

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
  
  const options = {
    body: data.body || data.message || 'Nueva notificación de ARCANA',
    icon: ARCANA_ICON,
    badge: ARCANA_BADGE,
    vibrate: [100, 50, 100],
    data: {
      url: targetUrl,
      notificationId: data.notificationId || data.id,
      type: notificationType,
      metadata: data.metadata || {},
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: '📱 Abrir'
      },
      {
        action: 'dismiss',
        title: 'Cerrar'
      }
    ],
    // Solo requiere interacción para tipos importantes
    requireInteraction: PERSISTENT_TYPES.includes(notificationType),
    // Agrupar por tipo
    tag: `arcana-${notificationType}-${data.notificationId || Date.now()}`,
    // Evitar duplicados reemplazando notificaciones del mismo tag
    renotify: true,
    // Configuración de imagen grande si viene
    ...(data.image && { image: data.image })
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ARCANA', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('📱 [SW] Notification clicked:', event);
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/notificaciones';
  
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
            // Navegar a la URL de destino
            if (targetUrl) {
              focusedClient.postMessage({
                type: 'NOTIFICATION_CLICK',
                url: targetUrl,
                notificationData: event.notification.data
              });
            }
            return focusedClient;
          });
        }
      }
      // Abrir nueva ventana si no hay ninguna
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
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
        // Permitir mostrar notificaciones desde la app
        const { title, body, data, tag } = event.data.payload || {};
        self.registration.showNotification(title || 'ARCANA', {
          body: body || '',
          icon: ARCANA_ICON,
          badge: ARCANA_BADGE,
          tag: tag || `arcana-${Date.now()}`,
          data: data || {}
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

console.log('📱 [SW] ARCANA Service Worker loaded successfully');
