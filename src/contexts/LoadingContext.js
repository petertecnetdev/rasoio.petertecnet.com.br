// src/contexts/LoadingContext.jsx
import React, { createContext, useState, useCallback, useEffect } from "react";
import axios from "axios";

export const LoadingContext = createContext({
  isLoading: false,
});

export function LoadingProvider({ children }) {
  const [count, setCount] = useState(0);
  const isLoading = count > 0;

  const push = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  const pop = useCallback(() => {
    setCount((c) => Math.max(c - 1, 0));
  }, []);

  useEffect(() => {
    const reqId = axios.interceptors.request.use(
      (config) => {
        push();
        return config;
      },
      (error) => {
        pop();
        return Promise.reject(error);
      }
    );

    const resId = axios.interceptors.response.use(
      (response) => {
        pop();
        return response;
      },
      (error) => {
        pop();
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqId);
      axios.interceptors.response.eject(resId);
    };
  }, [push, pop]);

  return (
    <LoadingContext.Provider value={{ isLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}
