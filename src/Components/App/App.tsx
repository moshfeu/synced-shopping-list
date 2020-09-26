import React, { ChangeEvent } from 'react';
import { addItem } from '../../Services/Firebase';
import { List } from '../List/List';

function App() {
  function onSubmit(e: ChangeEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.target);
    addItem({ name: data.get('name') as string });
  }

  return (
    <div className='App'>
      <form onSubmit={onSubmit}>
        <input name='name' type='text' />
      </form>
      <List />
    </div>
  );
}

export default App;
