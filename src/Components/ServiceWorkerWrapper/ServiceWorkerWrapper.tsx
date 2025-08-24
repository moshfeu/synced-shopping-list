import React, { FC, useEffect, useState } from 'react';
import { Snackbar, Button } from '@mui/material';

export const ServiceWorkerWrapper: FC = () => {
  const [showReload, setShowReload] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Register the service worker and listen for updates
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    setWaitingWorker(newWorker);
                    setShowReload(true);
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('SW registration failed', error);
          });
      });
    }
  }, []);

  const reloadPage = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      waitingWorker.addEventListener('statechange', (e) => {
        if ((e.target as any)?.state === 'activated') {
          window.location.reload();
        }
      });
    }
    setShowReload(false);
  };

  return (
    <Snackbar
      open={showReload}
      message='A new version is available!'
      onClick={reloadPage}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      action={
        <Button color='inherit' size='small' onClick={reloadPage}>
          Reload
        </Button>
      }
    />
  );
};
