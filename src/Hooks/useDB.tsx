import React, {
  createContext,
  FC,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Categories, Item, ItemView, ListItem, ListItemView } from '../types';
import { db } from '../Services/db';
import { useUIStore } from './useUIStore';

type DBStructure = {
  list: Array<ListItem>;
  items: Array<Item>;
  categories: Categories;
};

type DBContext = {
  list: Array<ListItemView>;
  items: Array<ItemView>;
  categories: Categories;
};

const initialValue: DBContext = {
  list: [],
  items: [],
  categories: [],
};
export const DBContext = createContext<DBContext>(initialValue);

type dbRef = {
  [key in keyof DBStructure]: { [key: string]: DBStructure[key][0] };
};
type State = {
  [key in keyof DBContext]: DBContext[key];
};

export const DBProvider: FC = ({ children }) => {
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState<State>(initialValue);
  const { dispatch } = useUIStore();

  useEffect(() => {
    db.ref().on('value', (snapshot) => {
      const snapshotAsJSON = snapshot.toJSON() as dbRef;
      if (snapshotAsJSON) {
        const dbData = Object.entries(snapshotAsJSON).reduce(
          (prev, [ref, items]) => ({
            ...prev,
            [ref]: Object.entries(items!).map(([id, props]) => ({
              id,
              ...props,
            })),
          }),
          {} as DBStructure
        );

        const items = (dbData.items || []).map(({ categoryId, ...item }) => ({
          ...item,
          category: categoryId
            ? {
                ...snapshotAsJSON.categories[categoryId || ''],
                id: categoryId,
              }
            : undefined,
        }));

        const list = (dbData.list || []).map(({ itemId, ...listItem }) => {
          const itemIndex = items.findIndex((item) => item.id === itemId);
          const [item] = items.splice(itemIndex, 1);
          return {
            ...listItem,
            item,
          };
        });

        const state: State = {
          ...dbData,
          items: items.filter((dbItem) => !snapshotAsJSON.list[dbItem.id]),
          list,
        };

        setState(state);

        if (!loaded) {
          setLoaded(true);
        }
      }
    });
  }, [loaded]);

  useEffect(() => {
    if (loaded) {
      dispatch({
        type: 'IS_APP_LOADING',
        payload: false,
      });
    }
  }, [dispatch, loaded]);

  return <DBContext.Provider value={state}>{children}</DBContext.Provider>;
};

export const useDB = () => {
  const { items, categories, list } = useContext(DBContext);
  if (!items || !categories || !list) {
    throw new Error('useDB must be called from a DBProvider!');
  }
  return { items, categories, list };
};
