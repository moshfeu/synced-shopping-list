import React, { createContext, FC, useContext, useEffect, useState } from 'react';
import { db } from '../Services/Firebase';
import { Items } from '../types';

export const DBContext = createContext<Items>({});

export const DBProvider: FC<any> = ({children}) => {
  const [items, setItems] = useState<Items>({});

  useEffect(() => {
    db.ref(`items`).on('value', (snapshot) => {
      console.log('items: ', snapshot.toJSON());
      const itemsFromDB = snapshot.toJSON()
      if (itemsFromDB) {
        setItems(itemsFromDB as Items);
      }
    });
  }, []);

  return (
    <DBContext.Provider value={items}>
      {children}
    </DBContext.Provider>
  );
}


export const useDB = () => {
  const items = useContext(DBContext);
  if (!items) {
    throw new Error(
      'useDB must be called from a DBProvider!'
    );
  }
  return {items};
}
