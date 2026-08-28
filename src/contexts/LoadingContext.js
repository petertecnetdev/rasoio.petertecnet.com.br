// src/contexts/LoadingContext.js
import React, { createContext, useCallback, useMemo, useState } from "react";

export const LoadingContext = createContext({
  isLoading: false,
  beginLoading: () => {},
  endLoading: () => {},
  withLoading: async (task) => task(),
});

export function LoadingProvider({ children }) {
  const [count, setCount] = useState(0);

  const beginLoading = useCallback(() => {
    setCount((current) => current + 1);
  }, []);

  const endLoading = useCallback(() => {
    setCount((current) => Math.max(0, current - 1));
  }, []);

  const withLoading = useCallback(
    async (task) => {
      beginLoading();
      try {
        return await task();
      } finally {
        endLoading();
      }
    },
    [beginLoading, endLoading]
  );

  const value = useMemo(
    () => ({
      isLoading: count > 0,
      beginLoading,
      endLoading,
      withLoading,
    }),
    [count, beginLoading, endLoading, withLoading]
  );

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
}
