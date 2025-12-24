// Service Worker Migration Script
// This script helps migrate from the old CRA service worker to the new Vite PWA service worker

(function() {
  // Check if migration has already been done
  const migrationKey = 'pwa-migration-done';
  if (localStorage.getItem(migrationKey) === 'true') {
    return; // Migration already completed
  }

  if ('serviceWorker' in navigator) {
    // Unregister all existing service workers
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      const unregisterPromises = registrations.map(function(registration) {
        return registration.unregister();
      });

      return Promise.all(unregisterPromises);
    }).then(function() {
      // Clear all caches
      if ('caches' in window) {
        return caches.keys().then(function(cacheNames) {
          const deletePromises = cacheNames.map(function(cacheName) {
            return caches.delete(cacheName);
          });
          return Promise.all(deletePromises);
        });
      }
    }).then(function() {
      // Mark migration as complete
      localStorage.setItem(migrationKey, 'true');

      // Force a page reload to ensure the new PWA setup takes over
      window.location.reload();
    }).catch(function(error) {
      // Mark as done anyway to prevent infinite loops
      localStorage.setItem(migrationKey, 'true');
    });
  } else {
    // No service worker support, mark as migrated
    localStorage.setItem(migrationKey, 'true');
  }
})();