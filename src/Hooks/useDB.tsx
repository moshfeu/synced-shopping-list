import React, {
  createContext,
  FC,
  useContext,
  useEffect,
  useState,
} from 'react';
import { db } from '../Services/db';
import { Categories, Category, Item, Items } from '../types';

type DBContext = {
  isLoading: boolean;
  items: Items;
  categories: Categories;
};

const initialValue: DBContext = {
  isLoading: true,
  items: [],
  categories: [],
};
export const DBContext = createContext<DBContext>(initialValue);

type DBRef = 'items' | 'categories';

function dbRefOnChange<T>(ref: DBRef, callback: (data: Array<T>) => void) {
  return new Promise((resolve) => {
    db.ref(ref).on('value', (snapshot) => {
      const snapshotAsJSON = snapshot.toJSON();
      if (snapshotAsJSON) {
        callback(
          Object.entries(snapshotAsJSON).map(([id, props]) => ({
            id,
            ...props,
          }))
        );
        resolve();
      }
    });
  });
}

export const DBProvider: FC = ({ children }) => {
  const [isLoading, setIsLoading] = useState(initialValue.isLoading);
  const [items, setItems] = useState<Items>(initialValue.items);
  const [categories, setCategories] = useState<Categories>(
    initialValue.categories
  );

  useEffect(() => {
    Promise.all([
      dbRefOnChange<Item>('items', setItems),
      dbRefOnChange<Category>('categories', setCategories),
    ]).then(() => setIsLoading(false));
  }, []);

  return (
    <DBContext.Provider
      value={{
        isLoading,
        categories,
        items,
      }}
    >
      {children}
    </DBContext.Provider>
  );
};

export const useDB = () => {
  const { items, categories, isLoading } = useContext(DBContext);
  if (!items || !categories) {
    throw new Error('useDB must be called from a DBProvider!');
  }
  return { items, categories, isLoading };
};
