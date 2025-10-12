// Aggressive Service Worker Migration Script - FORCE UPDATE with Visual Feedback
// This script forces a complete PWA migration from CRA to Vite

(function() {
  // Emergency debug - show immediately that script is running
  let debugBanner = null;

  // Create emergency debug overlay that shows everything visually
  function createDebugBanner(message, color = 'red') {
    if (!debugBanner) {
      debugBanner = document.createElement('div');
      debugBanner.id = 'debug-banner';
      debugBanner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        min-height: 60px;
        background: ${color};
        color: white;
        font-size: 16px;
        font-weight: bold;
        text-align: center;
        padding: 10px;
        z-index: 999999;
        box-sizing: border-box;
        line-height: 1.3;
      `;
      document.body.appendChild(debugBanner);
    } else {
      debugBanner.style.background = color;
    }
    debugBanner.textContent = message;
    return debugBanner;
  }

  // Show script is running immediately
  createDebugBanner('🚨 MIGRATION SCRIPT LOADED! DOM: ' + document.readyState, 'red');

  // Create visual overlay for mobile debugging
  function createMigrationOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'migration-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      font-family: monospace;
      font-size: 14px;
      padding: 20px;
      z-index: 999999;
      overflow-y: auto;
      box-sizing: border-box;
    `;

    const content = document.createElement('div');
    content.innerHTML = `
      <h2 style="color: #ff6b35; margin: 0 0 20px 0;">🔄 PWA MIGRATION IN PROGRESS</h2>
      <div id="migration-log"></div>
      <div style="margin-top: 20px; padding: 10px; background: #333; border-radius: 5px;">
        <strong>What's happening?</strong><br>
        Your app is updating to fix the service worker issue.
        This will only happen once.
      </div>
    `;
    overlay.appendChild(content);

    document.body.appendChild(overlay);
    return document.getElementById('migration-log');
  }

  function log(message, color) {
    console.log(message);
    if (window.migrationLog) {
      const logEntry = document.createElement('div');
      logEntry.style.cssText = `
        margin: 5px 0;
        padding: 5px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        color: ${color || '#fff'};
      `;
      logEntry.textContent = new Date().toLocaleTimeString() + ': ' + message;
      window.migrationLog.appendChild(logEntry);
      window.migrationLog.scrollTop = window.migrationLog.scrollHeight;
    }
  }

  // Wait for DOM to be ready
  function initMigration() {
    createDebugBanner('🔍 initMigration() called!', 'blue');

    // Check if migration was already completed
    const migrationCompleted = localStorage.getItem('pwa-migration-completed');

    createDebugBanner('📋 Migration flag: ' + (migrationCompleted || 'NOT SET'), 'purple');

    if (migrationCompleted) {
      createDebugBanner('✅ Migration already completed, skipping...', 'green');
      setTimeout(() => {
        if (debugBanner) debugBanner.remove();
      }, 5000);
      return;
    }

    createDebugBanner('🚀 Starting migration process...', 'orange');

    window.migrationLog = createMigrationOverlay();

    log('🚀 FORCE PWA MIGRATION STARTING...', '#4CAF50');
    log('📱 Visual debug mode enabled for mobile', '#2196F3');

    // Run migration once only
    let migrationSteps = 0;
    const totalSteps = 4;

    function updateProgress() {
      migrationSteps++;
      log('📊 Step ' + migrationSteps + '/' + totalSteps + ' completed', '#FFC107');
    }

    // Step 1: Unregister ALL service workers
    log('🔍 Step 1: Checking service workers...', '#9C27B0');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        log('📋 Found ' + registrations.length + ' service workers', '#FF9800');
        if (registrations.length > 0) {
          registrations.forEach(function(registration, i) {
            log('🗑️ Unregistering SW #' + (i+1) + ': ' + registration.scope, '#f44336');
            registration.unregister();
          });
        } else {
          log('✅ No service workers found', '#4CAF50');
        }
        updateProgress();
        clearCaches();
      }).catch(function(error) {
        log('❌ Error checking service workers: ' + error.message, '#f44336');
        updateProgress();
        clearCaches();
      });
    } else {
      log('❌ Service worker not supported', '#f44336');
      updateProgress();
      clearCaches();
    }

    // Step 2: Clear ALL caches
    function clearCaches() {
      log('🔍 Step 2: Checking caches...', '#9C27B0');
      if ('caches' in window) {
        caches.keys().then(function(cacheNames) {
          log('📋 Found ' + cacheNames.length + ' caches', '#FF9800');
          if (cacheNames.length > 0) {
            cacheNames.forEach(function(cacheName, i) {
              log('🗑️ Deleting cache #' + (i+1) + ': ' + cacheName, '#f44336');
              caches.delete(cacheName);
            });
          } else {
            log('✅ No caches found', '#4CAF50');
          }
          updateProgress();
          clearStorage();
        }).catch(function(error) {
          log('❌ Error checking caches: ' + error.message, '#f44336');
          updateProgress();
          clearStorage();
        });
      } else {
        log('❌ Cache API not supported', '#f44336');
        updateProgress();
        clearStorage();
      }
    }

    // Step 3: Clear storage
    function clearStorage() {
      log('🔍 Step 3: Clearing storage...', '#9C27B0');
      try {
        const lsCount = localStorage.length;
        const ssCount = sessionStorage.length;

        localStorage.clear();
        sessionStorage.clear();

        // Set migration completed flag immediately
        localStorage.setItem('pwa-migration-completed', 'true');

        log('🧹 Cleared ' + lsCount + ' localStorage items', '#4CAF50');
        log('🧹 Cleared ' + ssCount + ' sessionStorage items', '#4CAF50');

        // Clear IndexedDB if it exists
        if ('indexedDB' in window) {
          const dbsToDelete = ['firebaseLocalStorageDb', 'workbox-precache'];
          dbsToDelete.forEach(function(dbName) {
            try {
              indexedDB.deleteDatabase(dbName);
              log('🗑️ Deleted IndexedDB: ' + dbName, '#4CAF50');
            } catch(e) {
              log('⚠️ Could not delete IndexedDB: ' + dbName, '#FFC107');
            }
          });
        }

        updateProgress();
      } catch (e) {
        log('❌ Storage clear error: ' + e.message, '#f44336');
        updateProgress();
      }

      forceReload();
    }

    // Step 4: Force HARD reload
    function forceReload() {
      log('🔍 Step 4: Preparing reload...', '#9C27B0');
      log('✅ Migration completed successfully!', '#4CAF50');
      log('🔄 Reloading page in 3 seconds...', '#2196F3');

      let countdown = 3;
      const countdownInterval = setInterval(function() {
        countdown--;
        if (countdown > 0) {
          log('⏰ Reload in ' + countdown + '...', '#FFC107');
        } else {
          clearInterval(countdownInterval);
          log('💥 RELOADING NOW!', '#ff6b35');
          updateProgress();

          setTimeout(function() {
            // Just reload normally - no URL params needed
            window.location.reload(true);
          }, 500);
        }
      }, 1000);
    }
  }

  // Start migration when DOM is ready
  if (document.readyState === 'loading') {
    createDebugBanner('📅 DOM loading, waiting for ready...', 'orange');
    document.addEventListener('DOMContentLoaded', function() {
      createDebugBanner('📅 DOMContentLoaded fired!', 'blue');
      setTimeout(initMigration, 500);
    });
  } else {
    createDebugBanner('📅 DOM already ready, starting...', 'blue');
    setTimeout(initMigration, 500);
  }
})();