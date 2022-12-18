import {
  createContext,
  FC,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';
import { db } from '../Services/firebase';
import * as cache from '../Services/cache';
import { dbRef, firebaseToState } from '../Services/converters';
import { DB_REF } from '../Services/db';
import { DBContext, DBState } from '../Types/db';
import { Item } from '../Types/entities';
import { useUIStore } from './useUIStore';
import { useOnline } from './useOnline';

type DBContextProvider = DBContext & { isDBReady: boolean };

const initialValue: DBContextProvider = {
  list: [],
  items: [],
  categories: [],
  isDBReady: true,
};

const dbContext = createContext<DBContextProvider>(initialValue);

function cacheItemsImage() {
  db.db
    .ref(DB_REF.ITEMS)
    .orderByChild('image')
    .startAt('!')
    .endAt('~')
    .on('value', (snapshot) => {
      const snapshotItems = snapshot.val();
      if (!snapshotItems) {
        return;
      }
      const images = Object.values<Item>(snapshotItems).map(
        (item) => item.image
      );
      images.forEach((image) => cache.add(image!));
    });
}

export const DBProvider: FC = ({ children }) => {
  const [isDBReady, dbIsReady] = useReducer(() => true, false);
  const [state, setState] = useState<DBState>(initialValue);
  const isOnline = useOnline();
  const { appDoneLoading } = useUIStore();
  const isDbDoneLoadingOrIsOffline = !db.isLoading || isOnline === false;

  const init = useCallback(() => {
    cacheItemsImage();
    db.ref().off('value');
    db.ref().on(
      'value',
      (snapshot) => {
        const snapshotJson = snapshot.toJSON() as dbRef;
        if (snapshot && snapshotJson) {
          const state = firebaseToState(snapshotJson);
          setState(state);
        }

        if (isDbDoneLoadingOrIsOffline) {
          appDoneLoading();
        }
      },
      (error: string) => {
        alert(error);
      }
    );
  }, [appDoneLoading, isDbDoneLoadingOrIsOffline]);

  useEffect(() => {
    init();
    dbIsReady();
  }, [init]);

  return (
    <dbContext.Provider value={{ ...state, isDBReady }}>
      {children}
    </dbContext.Provider>
  );
};

export const useDB = () => {
  const { items, categories, list, isDBReady } = useContext(dbContext);
  if (!items || !categories || !list) {
    throw new Error('useDB must be called from a DBProvider!');
  }
  return { items, categories, list, isDBReady };
};
