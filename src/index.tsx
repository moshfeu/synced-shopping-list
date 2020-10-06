import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './Components/App/App';
import * as serviceWorker from './serviceWorker';
import { DBProvider } from './Hooks/useDB';
import { UIStoreProvider } from './Hooks/useUIStore';
import { AuthProvider } from './Hooks/useAuth';

ReactDOM.render(
  <React.StrictMode>
    <UIStoreProvider>
      <AuthProvider>
        <DBProvider>
          <App />
        </DBProvider>
      </AuthProvider>
    </UIStoreProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

serviceWorker.register({
  onUpdate: async (registration) => {
    await registration.unregister();
    window.location.reload();
  },
});
