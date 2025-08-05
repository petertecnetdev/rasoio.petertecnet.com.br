// src/contexts/LoadingContext.jsx
import React, { createContext, useState, useCallback } from "react";
import PropTypes from "prop-types";

export const LoadingContext = createContext({
  isLoading: false,
  push: () => {},
  pop: () => {},
});

let counter = 0;

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  const push = useCallback(() => {
    counter += 1;
    setIsLoading(true);
  }, []);

  const pop = useCallback(() => {
    counter = Math.max(0, counter - 1);
    if (counter === 0) setIsLoading(false);
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, push, pop }}>
      {children}
    </LoadingContext.Provider>
  );
};

LoadingProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
