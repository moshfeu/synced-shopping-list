import React, {
  createContext,
  FC,
  useContext,
  useEffect,
  useState,
} from 'react';
import { DBContext, DBState } from '../Types/db';
import { db } from '../Services/firebase';
import { useUIStore } from './useUIStore';
import { useAuth } from './useAuth';
import { dbRef, firebaseToState } from '../Services/converters';

const initialValue: DBContext = {
  list: [],
  items: [],
  categories: [],
};
const dbContext = createContext<DBContext>(initialValue);

export const DBProvider: FC = ({ children }) => {
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState<DBState>(initialValue);
  const currentUser = useAuth();
  const { dispatch } = useUIStore();

  useEffect(() => {
    if (currentUser) {
      db.ref().off('value');
      db.ref().on(
        'value',
        (snapshot) => {
          if (snapshot) {
            const state = firebaseToState(snapshot.toJSON() as dbRef);
            setState(state);

            if (!loaded) {
              setLoaded(true);
            }
          }
        },
        (error: string) => {
          setLoaded(true);
          alert(error);
        }
      );
    } else {
      setLoaded(true);
      setState({
        categories: [],
        items: [],
        list: [],
      });
    }
  }, [currentUser, loaded]);

  useEffect(() => {
    if (loaded) {
      dispatch({
        type: 'IS_APP_LOADING',
        payload: false,
      });
    }
  }, [dispatch, loaded]);

  return <dbContext.Provider value={state}>{children}</dbContext.Provider>;
};

export const useDB = () => {
  const { items, categories, list } = useContext(dbContext);
  if (!items || !categories || !list) {
    throw new Error('useDB must be called from a DBProvider!');
  }
  return { items, categories, list };
};
