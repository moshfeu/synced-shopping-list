import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { CategoriesList } from '../Categories/Categories';
import { List } from '../List/List';
import { MainNav } from '../MainNav/MainNav';
import { ServiceWorkerWrapper } from '../ServiceWorkerWrapper/ServiceWorkerWrapper';

function App() {
  return (
    <div className='App'>
      <CssBaseline />
      <ServiceWorkerWrapper />
      <MainNav />
      <Switch>
        <Route path='/' exact component={List} />
        <Route path='/item/:id' component={List} />
        <Route path='/history' component={List} />
        <Route path='/categories' component={CategoriesList} />
      </Switch>
    </div>
  );
}

export default App;
