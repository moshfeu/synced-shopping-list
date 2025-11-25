import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { useDB } from '../../Hooks/useDB';
import { useAppBadge } from '../../Hooks/useAppBadge';
import { CategoriesList } from '../Categories/Categories';
import { List } from '../List/List';
import { MainNav } from '../MainNav/MainNav';

function App() {
  const { list } = useDB();

  // Update app badge based on urgent items
  useAppBadge(list);

  return (
    <div className='App'>
      <CssBaseline />
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
