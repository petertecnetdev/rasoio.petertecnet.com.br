import { createContext } from "react";

export const AuthContext = createContext({
  user: null,
  employer: null,
  isEmployer: false,
  establishments: [],
});
