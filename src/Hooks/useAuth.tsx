import React, {
  FC,
  createContext,
  useState,
  useEffect,
  useContext,
} from 'react';
import { auth } from '../Services/auth';

type CurrentUser = firebase.User | null | undefined;

const AuthContext = createContext<CurrentUser>(undefined);

export const AuthProvider: FC = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(undefined);

  useEffect(() => {
    auth.onAuthStateChanged(function (user) {
      if (user) {
        setCurrentUser(user);
      } else {
        console.log('no');
        setCurrentUser(null);
      }
    });
  }, []);

  return currentUser !== undefined ? (
    <AuthContext.Provider value={currentUser}>{children}</AuthContext.Provider>
  ) : null;
};

export const useAuth = () => {
  const currentUser = useContext(AuthContext);
  if (currentUser === undefined) {
    throw new Error('useAuth must be called from a AuthProvider!');
  }
  return currentUser;
};
