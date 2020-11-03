import React, { FC, useEffect, useState } from 'react';
import { Snackbar, Button } from '@material-ui/core';
import * as serviceWorker from '../../serviceWorker';

export const ServiceWorkerWrapper: FC = () => {
  const [showReload, setShowReload] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null
  );

  const onSWUpdate = (registration: ServiceWorkerRegistration) => {
    setShowReload(true);
    setWaitingWorker(registration.waiting);
  };

  useEffect(() => {
    serviceWorker.register({ onUpdate: onSWUpdate });
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw-cache.js')
        .then(() => 'sw-cache registered');
    }
  }, []);

  const reloadPage = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    setShowReload(false);
    waitingWorker?.addEventListener('statechange', (e) => {
      if ((e.target as any)?.state === 'activated') {
        window.location.reload();
      }
    });
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
