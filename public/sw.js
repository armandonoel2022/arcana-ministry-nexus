// Service Worker para Push Notifications de ARCANA
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'Nueva notificación de ARCANA',
    icon: '/arcana-notification-icon.png',
    badge: '/arcana-notification-icon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/notificaciones',
      notificationId: data.notificationId,
      type: data.type,
      metadata: data.metadata || {}
    },
    actions: [
      {
        action: 'open',
        title: '📱 Abrir ARCANA'
      },
      {
        action: 'dismiss',
        title: 'Cerrar'
      }
    ],
    requireInteraction: data.type === 'birthday' || data.type === 'blood_donation' || data.type === 'extraordinary_rehearsal',
    tag: data.type || 'general',
    // Configuración de imagen grande para overlays importantes
    ...(data.image && { image: data.image })
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ARCANA', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event.action);
  event.notification.close();
  
  if (event.action === 'open' || event.action === '') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        // Si ya hay una ventana abierta de ARCANA, enfócala
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(client => {
              // Navegar a la URL de la notificación
              if (event.notification.data.url) {
                client.postMessage({
                  type: 'NAVIGATE',
                  url: event.notification.data.url
                });
              }
              return client;
            });
          }
        }
        // Si no hay ventanas abiertas, abre una nueva
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || '/notificaciones');
        }
      })
    );
  }
});

// Manejo de mensajes desde la aplicación
self.addEventListener('message', event => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('ARCANA Service Worker loaded successfully');
