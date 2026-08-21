// Service Worker para notificações e background sync do Esporte Radar
const CACHE_NAME = 'esporte-radar-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener para clique na notificação nativa
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Listener para evento de push em segundo plano (se configurado)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || '⚽ Esporte Radar: Alerta de Jogo';
    const options = {
      body: data.body || 'A partida do seu time favorito vai começar!',
      icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/53/53283.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/53/53283.png',
      tag: data.tag || 'match-alert',
      vibrate: [200, 100, 200, 100, 400],
      data: data.url || '/'
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.warn('[SW] Erro ao processar push:', e);
  }
});
