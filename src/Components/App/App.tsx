import React from 'react';
import { Drawer } from '../Drawer/Drawer';
import { List } from '../List/List';
import { Search } from '../Search/Search';
import { Switch, Route, BrowserRouter as Router } from 'react-router-dom';
import { CategoriesList } from '../Categories/Categories';

function App() {
  return (
    <div className='App'>
      <Search />
      <Router>
        <Drawer />
        <Switch>
          <Route path='/' exact component={List} />
          <Route path='/categories' component={CategoriesList} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
