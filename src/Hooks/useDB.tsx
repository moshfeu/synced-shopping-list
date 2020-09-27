import React, {
  createContext,
  FC,
  useContext,
  useEffect,
  useState,
} from 'react';
import { db } from '../Services/db';
import { Categories, Items } from '../types';

export const ItemsContext = createContext<Items>({});
export const CategoriesContext = createContext<Items>({});

type DBRef = 'items' | 'categories';

function dbRefOnChange<T>(ref: DBRef, callback: (data: T) => void) {
  db.ref(ref).on('value', (snapshot) => {
    const snapshotAsJSON = snapshot.toJSON();
    if (snapshotAsJSON) {
      callback(snapshotAsJSON as T);
    }
  });
}

export const DBProvider: FC = ({ children }) => {
  const [items, setItems] = useState<Items>({});
  const [categories, setCategories] = useState<Categories>({});

  useEffect(() => {
    dbRefOnChange<Items>('items', setItems);
    dbRefOnChange<Categories>('categories', setCategories);
  }, []);

  return (
    <ItemsContext.Provider value={items}>
      <CategoriesContext.Provider value={categories}>
        {children}
      </CategoriesContext.Provider>
    </ItemsContext.Provider>
  );
};

export const useDB = () => {
  const items = useContext(ItemsContext);
  const categories = useContext(CategoriesContext);
  if (!items || !categories) {
    throw new Error('useDB must be called from a DBProvider!');
  }
  return { items, categories };
};
