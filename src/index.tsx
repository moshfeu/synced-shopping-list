import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import {
  createTheme,
  ThemeProvider,
  Theme,
  StyledEngineProvider,
} from '@mui/material';
import App from './Components/App/App';
import { AuthProvider } from './Hooks/useAuth';
import { DBProvider } from './Hooks/useDB';
import { UIStoreProvider } from './Hooks/useUIStore';

declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

const theme = createTheme({
  components: {
    MuiListItemSecondaryAction: {
      styleOverrides: {
        root: {
          right: 0,
        },
      },
    },
  },
});

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <UIStoreProvider>
            <AuthProvider>
              <DBProvider>
                <App />
              </DBProvider>
            </AuthProvider>
          </UIStoreProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
