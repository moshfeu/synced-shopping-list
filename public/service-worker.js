// Self-destroying service worker to clean up old CRA/Vite service worker
// This will unregister itself and clear all caches, then redirect to clean version

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    self.registration.unregister()
      .then(() => self.clients.matchAll())
      .then((clients) => {
        clients.forEach((client) => {
          if (client instanceof WindowClient) {
            // Add cache-busting to force fresh load
            const url = new URL(client.url);
            url.searchParams.set('sw-cleanup', Date.now().toString());
            client.navigate(url.toString());
          }
        });
        return self.caches.keys();
      })
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => self.caches.delete(cacheName))
        );
      })
  );
});