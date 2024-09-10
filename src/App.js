import { useState, useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "assets/theme";


import Dashboard from "layouts/dashboard";
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up"; 
import LogOut from "layouts/authentication/logout";    
import EmailVerify from "layouts/authentication/email-verify";  
import authService from "./services/AuthService";
import LoadingComponent from "components/LoadingComponent";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await authService.me();
        setUser(userData);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingComponent />;
  }

  const protectedRoute = (element) => {
    if (user) {
      if (user.email_verified_at) {
        return element;
      } else {
        return <Navigate to="/email-verify" />;
      }
    }
    return <Navigate to="/login" />;
  };

  const emailVerifiedRoute = (element) => {
    if (user) {
      if (!user.email_verified_at) {
        return element;
      } else {
        return <Navigate to="/dashboard" />;
      }
    }
    return <Navigate to="/login" />;
  };

  const restrictedRoute = (element) => {
    if (!user) {
      return element;
    } else {
      return <Navigate to="/dashboard" />;
    }
  };
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Navigate to="/authentication/sign-in" replace />} />
        <Route path="/authentication/sign-in" element={restrictedRoute(<SignIn />)} />
        <Route path="/authentication/sign-up" element={restrictedRoute(<SignUp />)} />
        <Route path="/dashboard" element={protectedRoute(<Dashboard />)} />
        <Route path="/logout" element={<LogOut />} />
        <Route path="*" element={<Navigate to="/authentication/sign-in" replace />} />
        <Route path="/email-verify" element={emailVerifiedRoute(<EmailVerify />)} />
        </Routes>
    </ThemeProvider>
  );
};

export default App;
