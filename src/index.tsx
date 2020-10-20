import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './Components/App/App';
import * as serviceWorker from './serviceWorker';
import { DBProvider } from './Hooks/useDB';
import { UIStoreProvider } from './Hooks/useUIStore';
import { AuthProvider } from './Hooks/useAuth';
import { BrowserRouter as Router } from 'react-router-dom';
import { createMuiTheme, ThemeProvider } from '@material-ui/core';

const theme = createMuiTheme({
  overrides: {
    MuiListItemSecondaryAction: {
      root: {
        right: 0,
      },
    },
  },
});

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <ThemeProvider theme={theme}>
        <UIStoreProvider>
          <AuthProvider>
            <DBProvider>
              <App />
            </DBProvider>
          </AuthProvider>
        </UIStoreProvider>
      </ThemeProvider>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
