import { useCallback, useEffect, useState } from "react";

/**
 * useState backed by localStorage. Server renders (and hydrates) with the
 * default value, then loads the stored value after mount to avoid hydration
 * mismatches.
 */
export function useLocalStorageState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    const stored = window.localStorage.getItem(key);
    if (stored === null) return;
    try {
      setValue(JSON.parse(stored) as T);
    } catch {
      window.localStorage.removeItem(key);
    }
  }, [key]);

  const setAndStore = useCallback(
    (next: T) => {
      setValue(next);
      window.localStorage.setItem(key, JSON.stringify(next));
    },
    [key],
  );

  return [value, setAndStore] as const;
}
