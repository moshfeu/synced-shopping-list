// Self-destroying service worker to clean up old CRA/Vite service worker
// This will unregister itself and clear all caches, then redirect to clean version

// Function to show visual feedback to all clients
function showVisualFeedback(message, color = '#ff6b35') {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      if (client instanceof WindowClient) {
        client.postMessage({
          type: 'SW_CLEANUP_STATUS',
          message: message,
          color: color,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    });
  });
}

self.addEventListener('install', (e) => {
  console.log('🧹 Self-destroying SW: Installing...');
  showVisualFeedback('🧹 Self-destroying service worker installing...', '#orange');
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('🧹 Self-destroying SW: Activating and cleaning up...');
  showVisualFeedback('🧹 Service worker cleanup starting...', '#red');
  
  e.waitUntil(
    self.registration.unregister()
      .then(() => {
        console.log('🧹 Self-destroying SW: Unregistered successfully');
        showVisualFeedback('✅ Service worker unregistered', '#green');
        return self.clients.matchAll();
      })
      .then((clients) => {
        console.log('🧹 Self-destroying SW: Reloading', clients.length, 'clients');
        showVisualFeedback(`🔄 Preparing to reload ${clients.length} clients...`, '#blue');
        return self.caches.keys();
      })
      .then((cacheNames) => {
        showVisualFeedback(`🧹 Clearing ${cacheNames.length} caches...`, '#purple');
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('🧹 Self-destroying SW: Deleting cache:', cacheName);
            return self.caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        console.log('🧹 Self-destroying SW: Cleanup complete!');
        showVisualFeedback('✅ Cleanup complete! Reloading in 2 seconds...', '#green');
        
        // Wait a bit for user to see the message, then reload
        setTimeout(() => {
          return self.clients.matchAll();
        }, 2000);
      })
      .then((clients) => {
        clients.forEach((client) => {
          if (client instanceof WindowClient) {
            // Add cache-busting to force fresh load
            const url = new URL(client.url);
            url.searchParams.set('sw-cleanup', Date.now().toString());
            client.navigate(url.toString());
          }
        });
        return Promise.resolve();
      })
      .catch((error) => {
        console.error('🧹 Self-destroying SW: Error during cleanup:', error);
        showVisualFeedback('❌ Error during cleanup: ' + error.message, '#red');
      })
  );
});

// Handle messages from clients (for visual feedback setup)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SW_CLEANUP_READY') {
    // Client is ready to receive visual updates
    showVisualFeedback('🚀 Self-destroying service worker activated!', '#orange');
  }
});