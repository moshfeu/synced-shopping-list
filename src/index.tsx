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

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
