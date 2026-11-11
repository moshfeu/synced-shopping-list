import { useCallback, useState } from 'react';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable - state stays in memory only
  }
}

export function useSessionStorageState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => read(key, initial));

  const update = useCallback(
    (updater: (prev: T) => T) => {
      setState((prev) => {
        const next = updater(prev);
        write(key, next);
        return next;
      });
    },
    [key]
  );

  return [state, update] as const;
}
