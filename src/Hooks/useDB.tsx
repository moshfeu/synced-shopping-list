import React, {
  createContext,
  FC,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Categories, Items, ListItem, ListItems } from '../types';
import { db } from '../Services/db';
import { useUIStore } from './useUIStore';

type DBContext = {
  list: Array<ListItem>;
  listItems: ListItems;
  items: Items;
  categories: Categories;
};

const initialValue: DBContext = {
  list: [],
  listItems: [],
  items: [],
  categories: [],
};
export const DBContext = createContext<DBContext>(initialValue);

type dbRef = { [key in keyof DBContext]: { [key: string]: DBContext[key][0] } };
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
        const state = Object.entries(snapshotAsJSON).reduce(
          (prev, [ref, items]) => ({
            ...prev,
            [ref]: Object.entries(items!).map(([id, props]) => ({
              id,
              ...props,
            })),
          }),
          {} as State
        );

        state.listItems = (state.list || []).map(({ itemId, ...rest }) => {
          const item = {
            ...snapshotAsJSON.items[itemId],
            id: itemId,
          };
          const category = snapshotAsJSON.categories[item.category || ''];

          return {
            ...rest,
            item,
            category,
          };
        });
        state.items = (state.items || []).filter(
          (item) =>
            !state.listItems.some((listItem) => listItem.item.id === item.id)
        );
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
  const { items, categories, listItems } = useContext(DBContext);
  if (!items || !categories || !listItems) {
    throw new Error('useDB must be called from a DBProvider!');
  }
  return { items, categories, listItems };
};
