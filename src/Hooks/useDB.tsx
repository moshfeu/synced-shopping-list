import React, {
  createContext,
  FC,
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
import { useAuth } from './useAuth';
import { useUIStore } from './useUIStore';

const initialValue: DBContext = {
  list: [],
  items: [],
  categories: [],
};
const dbContext = createContext<DBContext>(initialValue);

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
  const [isLoading, doneLoading] = useReducer(() => false, true);
  const [state, setState] = useState<DBState>(initialValue);
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { dispatch } = useUIStore();

  const isFetchDone = !isLoading && !isAuthLoading;
  const isAnonymous = isFetchDone && !currentUser;

  useEffect(() => {
    if (db.hasLocal) {
      init();
    } else if (isAnonymous) {
      doneLoading();
    }

    init();
  }, [isAnonymous]);

  useEffect(() => {
    if (isFetchDone) {
      dispatch({
        type: 'IS_APP_LOADING',
        payload: false,
      });
    }
  }, [dispatch, isFetchDone]);

  function init() {
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

        doneLoading();
      },
      (error: string) => {
        doneLoading();
        alert(error);
      }
    );
  }

  return <dbContext.Provider value={state}>{children}</dbContext.Provider>;
};

export const useDB = () => {
  const { items, categories, list } = useContext(dbContext);
  if (!items || !categories || !list) {
    throw new Error('useDB must be called from a DBProvider!');
  }
  return { items, categories, list };
};
