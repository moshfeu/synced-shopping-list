import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { CategoriesList } from '../Categories/Categories';
import { List } from '../List/List';
import { MainNav } from '../MainNav/MainNav';

function App() {
  return (
    <div className='App'>
      <CssBaseline />
      <MainNav />
      <Routes>
        <Route path='/' element={<List />} />
        <Route path='/item/:id/*' element={<List />} />
        <Route path='/history' element={<List />} />
        <Route path='/categories' element={<CategoriesList />} />
      </Routes>
    </div>
  );
}

export default App;
