// src/App.jsx
import React, { useState, useEffect, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import ProcessingIndicatorComponent from "./components/ProcessingIndicatorComponent";
import { LoadingProvider, LoadingContext } from "./contexts/LoadingContext";
import { apiBaseUrl } from "./config";
import { GoogleOAuthProvider } from "@react-oauth/google";


import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import EmailVerifyPage from "./pages/auth/EmailVerifyPage";
import LogoutPage from "./pages/auth/LogoutPage";
import PasswordEmailPage from "./pages/auth/PasswordEmailPage";
import PasswordResetPage from "./pages/auth/PasswordResetPage";
import PasswordPage from "./pages/auth/PasswordPage";

import DashboardPage from "./pages/DashboardPage";

import OrderCreatePage from "./pages/order/OrderCreatePage";
import OrderListPage from "./pages/order/OrderListPage";
import OrderEditPage from "./pages/order/OrderEditPage";

import UserViewPage from "./pages/user/UserViewPage";
import UserUpdatePage from "./pages/user/UserUpdatePage";

import ItemListPage from "./pages/item/ItemListPage";
import ItemCreatePage from "./pages/item/ItemCreatePage";
import ItemViewPage from "./pages/item/ItemViewPage";
import ItemUpdatePage from "./pages/item/ItemUpdatePage";

import EmployerListPage from "./pages/employer/EmployerListPage";
import EmployerCreatePage from "./pages/employer/EmployerCreatePage";
import EmployerUpdatePage from "./pages/employer/EmployerUpdatePage";
import EmployerViewPage from "./pages/employer/EmployerViewPage";
import EmployerDashboardPage from "./pages/employer/EmployerDashboardPage";


import EstablishmentCreatePage from "./pages/establishment/EstablishmentCreatePage";
import EstablishmentViewPage from "./pages/establishment/EstablishmentViewPage";
import EstablishmentUpdatePage from "./pages/establishment/EstablishmentUpdatePage";
import EstablishmentSchedulePage from "./pages/establishment/EstablishmentSchedulePage";


import "./index.css";

function AppInner() {
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const { isLoading } = useContext(LoadingContext);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const { data } = await axios.get(`${apiBaseUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(data.user);
        } catch {
          localStorage.removeItem("token");
        }
      }
      setInitialLoading(false);
    })();
  }, []);

  if (initialLoading) {
    return (
      <ProcessingIndicatorComponent
        interval={100}
        gifSrc="/images/logo.gif"
      />
    );
  }

  const protectedRoute = (el) =>
    user
      ? user.email_verified_at
        ? el
        : <Navigate to="/email-verify" replace />
      : <Navigate to="/login" replace />;

  const emailVerifiedRoute = (el) =>
    user
      ? !user.email_verified_at
        ? el
        : <Navigate to="/" replace />
      : <Navigate to="/login" replace />;

  const restrictedRoute = (el) =>
    user ? <Navigate to="/" replace /> : el;

  return (
    <>
      {isLoading && (
        <ProcessingIndicatorComponent
          interval={800}
          gifSrc="/images/logo.gif"
        />
      )}

      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/establishment/view/:slug" element={<EstablishmentViewPage />} />
          <Route path="/employer/view/:user_name" element={<EmployerViewPage  />} />

          <Route path="/register" element={restrictedRoute(<RegisterPage />)} />
          <Route path="/login" element={restrictedRoute(<LoginPage />)} />
          <Route path="/password-email" element={restrictedRoute(<PasswordEmailPage />)} />
          <Route path="/password-reset" element={restrictedRoute(<PasswordResetPage />)} />
          <Route path="/email-verify" element={emailVerifiedRoute(<EmailVerifyPage />)} />
          <Route path="/password" element={protectedRoute(<PasswordPage />)} />
          <Route path="/logout" element={<LogoutPage />} />

          <Route path="/dashboard" element={protectedRoute(<DashboardPage />)} />

          <Route path="/order/list/:entityId" element={protectedRoute(<OrderListPage />)} />
          <Route path="/order/create/:entityId" element={protectedRoute(<OrderCreatePage />)} />
          <Route path="/order/edit/:entityId/:id" element={protectedRoute(<OrderEditPage />)} />

          <Route path="/user/update" element={protectedRoute(<UserUpdatePage />)} />
          <Route path="/user/:userName" element={protectedRoute(<UserViewPage />)} />

          <Route path="/item/list/:slug" element={protectedRoute(<ItemListPage />)} />
          <Route path="/item/create/:slug" element={protectedRoute(<ItemCreatePage />)} />
          <Route path="/item/view/:slug" element={protectedRoute(<ItemViewPage />)} />
          <Route path="/item/update/:id" element={protectedRoute(<ItemUpdatePage />)} />
          <Route path="/item/:id" element={protectedRoute(<ItemViewPage />)} />

          <Route path="/employer/list/:slug" element={protectedRoute(<EmployerListPage />)} />
          <Route path="/employer/create/:slug" element={protectedRoute(<EmployerCreatePage />)} />
          <Route path="/employer/update/:id" element={protectedRoute(<EmployerUpdatePage />)} />
          <Route path="/employer/:id" element={protectedRoute(<EmployerViewPage />)} />
          <Route path="/employer/dashboard" element={protectedRoute(<EmployerDashboardPage />)} />


          <Route path="/establishment/create" element={protectedRoute(<EstablishmentCreatePage />)} />
          <Route path="/establishment/update/:id" element={protectedRoute(<EstablishmentUpdatePage />)} />
          <Route path="/establishment/schedule/:slug"  element={<EstablishmentSchedulePage />} />



          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default function App() {
  return (
    <LoadingProvider>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID} locale="pt-BR">
        <AppInner />
      </GoogleOAuthProvider>
    </LoadingProvider>
  );
}
