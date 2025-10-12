// Visual Service Worker Cleanup Feedback
// This script shows service worker cleanup progress on screen for mobile debugging

(function() {
  let feedbackOverlay = null;
  let messageLog = null;

  function createVisualFeedback() {
    if (feedbackOverlay) return;

    feedbackOverlay = document.createElement('div');
    feedbackOverlay.id = 'sw-cleanup-overlay';
    feedbackOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      font-family: monospace;
      font-size: 16px;
      padding: 20px;
      z-index: 999999;
      overflow-y: auto;
      box-sizing: border-box;
    `;

    const content = document.createElement('div');
    content.innerHTML = `
      <h2 style="color: #ff6b35; margin: 0 0 20px 0;">🧹 SERVICE WORKER CLEANUP</h2>
      <div id="sw-message-log"></div>
      <div style="margin-top: 20px; padding: 10px; background: #333; border-radius: 5px;">
        <strong>What's happening?</strong><br>
        Your app is cleaning up the old service worker and caches.
        This will only happen once during the migration.
      </div>
    `;
    feedbackOverlay.appendChild(content);
    document.body.appendChild(feedbackOverlay);
    
    messageLog = document.getElementById('sw-message-log');
  }

  function addMessage(message, color, timestamp) {
    if (!messageLog) return;

    const logEntry = document.createElement('div');
    logEntry.style.cssText = `
      margin: 8px 0;
      padding: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      border-left: 4px solid ${color};
    `;
    logEntry.innerHTML = `<strong>${timestamp}</strong>: ${message}`;
    messageLog.appendChild(logEntry);
    messageLog.scrollTop = messageLog.scrollHeight;
  }

  // Listen for service worker messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_CLEANUP_STATUS') {
        createVisualFeedback();
        addMessage(event.data.message, event.data.color, event.data.timestamp);
      }
    });

    // Tell service worker we're ready to receive messages
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'SW_CLEANUP_READY'
        });
      }
    });
  }

  // Also create overlay immediately in case service worker is already running
  if (window.location.search.includes('sw-cleanup')) {
    createVisualFeedback();
    addMessage('🔄 Page reloaded after service worker cleanup', '#blue', new Date().toLocaleTimeString());
    
    // Clean up URL after a few seconds
    setTimeout(() => {
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
        addMessage('✅ URL cleaned, migration complete!', '#green', new Date().toLocaleTimeString());
        
        // Remove overlay after showing completion
        setTimeout(() => {
          if (feedbackOverlay) {
            feedbackOverlay.remove();
          }
        }, 3000);
      }
    }, 2000);
  }
})();