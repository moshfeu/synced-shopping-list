import {
  createContext,
  FC,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';
import { db } from '../Services/firebase';

const checkInternetConnection = async () => {
  const controller = new AbortController();
  setTimeout(() => controller.abort('timeout'), 3000);

  try {
    await fetch('https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png', {
      cache: 'no-store',
      signal: controller.signal,
    });
    return true;
  } catch (e) {
    return false;
  }
};

const OnlineContext = createContext<boolean | undefined>(undefined);

export const OnlineProvider: FC = ({ children }) => {
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>();
  const [hasInternetConnection, setHasInternetConnection] = useState<boolean>();
  const [isInitiated, setInitiated] = useReducer(() => true, false);
  const isOnline = isInitiated ? isFirebaseConnected : undefined;

  useEffect(() => {
    checkInternetConnection().then(setHasInternetConnection);

    db.onConnectionChange((nextOnlineStatus) => {
      setIsFirebaseConnected(nextOnlineStatus);
    });
  }, []);

  useEffect(() => {
    const allConnectionCheckedAndAligned =
      isFirebaseConnected !== undefined &&
      isFirebaseConnected === hasInternetConnection;

    if (allConnectionCheckedAndAligned) {
      setInitiated();
    }
  }, [hasInternetConnection, isFirebaseConnected]);

  return (
    <OnlineContext.Provider value={isOnline}>{children}</OnlineContext.Provider>
  );
};

export const useOnline = () => {
  const isOnline = useContext(OnlineContext);

  return isOnline;
};
