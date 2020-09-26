import React, { ChangeEvent } from 'react';
import './App.css';
import { useDB } from './Contexts/Items';
import { addItem } from './Services/Firebase';

function App() {
  const { items } = useDB();

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
      <ul>
        {Object.entries(items).map(([id, item]) => (
          <li key={id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
