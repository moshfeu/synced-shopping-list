import React, {
  FC,
  createContext,
  useState,
  useEffect,
  useContext,
} from 'react';
import { auth } from '../Services/auth';

// import { register } from '../Services/messaging';

type CurrentUser = firebase.User | null | undefined;

const AuthContext = createContext<{
  currentUser: CurrentUser | null;
  isLoading: boolean;
}>({
  currentUser: null,
  isLoading: true,
});

export const AuthProvider: FC = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    auth.onAuthStateChanged(function (user) {
      if (user) {
        setCurrentUser(user);
        // register(user);
      } else {
        console.log('no');
        setCurrentUser(null);
      }
      setIsLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const authContext = useContext(AuthContext);
  if (authContext === undefined) {
    throw new Error('useAuth must be called from a AuthProvider!');
  }
  return authContext;
};
