import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { List } from '../List/List';
import { MainNav } from '../MainNav/MainNav';
import { CategoriesList } from '../Categories/Categories';

function App() {
  return (
    <div className='App'>
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
