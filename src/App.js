// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { GoogleOAuthProvider } from "@react-oauth/google";

import HomePage from "./pages/HomePage";

// Auth
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import EmailVerifyPage from "./pages/auth/EmailVerifyPage";
import LogoutPage from "./pages/auth/LogoutPage";
import PasswordEmailPage from "./pages/auth/PasswordEmailPage";
import PasswordResetPage from "./pages/auth/PasswordResetPage";
import PasswordPage from "./pages/auth/PasswordPage";

// Dashboard
import DashboardPage from "./pages/DashboardPage";

import EstablishmentCreatePage from "./pages/establishment/EstablishmentCreatePage";
import EstablishmentViewPage from "./pages/establishment/EstablishmentViewPage";
import EstablishmentUpdatePage from "./pages/establishment/EstablishmentUpdatePage";

// Items
import ItemListPage from "./pages/item/ItemListPage";
import ItemCreatePage from "./pages/item/ItemCreatePage";
import ItemUpdatePage from "./pages/item/ItemUpdatePage";
import ItemViewPage from "./pages/item/ItemViewPage";

// Barbershops
import BarbershopListPage from "./pages/corp/barbershop/BarbershopListPage";
import BarbershopCreatePage from "./pages/corp/barbershop/BarbershopCreatePage";
import BarbershopUpdatePage from "./pages/corp/barbershop/BarbershopUpdatePage";
import BarbershopViewPage from "./pages/barbershop/BarbershopViewPage";

// Barbers
import BarberViewPage from "./pages/barber/BarberViewPage";
import BarberIncludePage from "./pages/barber/BarberIncludePage";

// Appointments
import AppointmentCreatePage from "./pages/appointment/AppointmentCreatePage";
import AppointmentsClientPage from "./pages/appointment/AppointmentsClientPage";
import AppointmentsBarberPage from "./pages/appointment/AppointmentsBarberPage";
import BarbershopAppointmentsPage from "./pages/appointment/BarbershopAppointmentsPage";

// Service Records
import ServiceRecordListPage from "./pages/serviceRecord/ServiceRecordListPage";
import ServiceRecordCreatePage from "./pages/serviceRecord/ServiceRecordCreatePage";
import ServiceRecordViewPage from "./pages/serviceRecord/ServiceRecordViewPage";

import ProcessingIndicatorComponent from "./components/ProcessingIndicatorComponent";
import { apiBaseUrl } from "./config";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const { data } = await axios.get(`${apiBaseUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(data.user);
        } catch {
          setUser(null);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <ProcessingIndicatorComponent
        messages={["Carregando...", "Aguarde um instante..."]}
        interval={500}
      />
    );
  }

  const protectedRoute = (element) => {
    if (!user) return <Navigate to="/login" replace />;
    if (!user.email_verified_at) return <Navigate to="/email-verify" replace />;
    return element;
  };

  const emailVerifiedRoute = (element) => {
    if (user && !user.email_verified_at) return element;
    return <Navigate to="/dashboard" replace />;
  };

  const restrictedRoute = (element) => {
    if (!user) return element;
    return <Navigate to="/dashboard" replace />;
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          {/* Públicas */}
          <Route path="/home" element={restrictedRoute(<HomePage />)} />
          <Route path="/register" element={restrictedRoute(<RegisterPage />)} />
          <Route path="/login" element={restrictedRoute(<LoginPage />)} />
          <Route path="/password-email" element={restrictedRoute(<PasswordEmailPage />)} />
          <Route path="/password-reset" element={restrictedRoute(<PasswordResetPage />)} />
          <Route path="/email-verify" element={emailVerifiedRoute(<EmailVerifyPage />)} />
          <Route path="/password" element={protectedRoute(<PasswordPage />)} />
          <Route path="/logout" element={<LogoutPage />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={protectedRoute(<DashboardPage />)} />

          {/* Establishments */}
          <Route path="/establishment/create" element={protectedRoute(<EstablishmentCreatePage />)} />
          <Route path="/establishment/view/:slug" element={protectedRoute(<EstablishmentViewPage />)} />
          <Route path="/establishment/update/:id" element={protectedRoute(<EstablishmentUpdatePage />)} />

          {/* Items */}
          <Route path="/item/list/:slug" element={protectedRoute(<ItemListPage />)} />
          <Route path="/item/create/:slug" element={protectedRoute(<ItemCreatePage />)} />
          <Route path="/item/update/:id" element={protectedRoute(<ItemUpdatePage />)} />
          <Route path="/item/:slug" element={protectedRoute(<ItemViewPage />)} />

          {/* Barbershops */}
          <Route path="/barbershop" element={protectedRoute(<BarbershopListPage />)} />
          <Route path="/barbershop/create" element={protectedRoute(<BarbershopCreatePage />)} />
          <Route path="/barbershop/update/:id" element={protectedRoute(<BarbershopUpdatePage />)} />
          <Route path="/barbershop/view/:slug" element={protectedRoute(<BarbershopViewPage />)} />

          {/* Barbers */}
          <Route path="/barber/view/:username" element={protectedRoute(<BarberViewPage />)} />
          <Route path="/barber/include/:slug" element={protectedRoute(<BarberIncludePage />)} />

          {/* Appointments */}
          <Route path="/appointment/create/:slug" element={protectedRoute(<AppointmentCreatePage />)} />
          <Route path="/appointment/my" element={protectedRoute(<AppointmentsClientPage />)} />
          <Route path="/appointment/barber" element={protectedRoute(<AppointmentsBarberPage />)} />
          <Route path="/appointment/barbershop/:slug" element={protectedRoute(<BarbershopAppointmentsPage />)} />

          {/* Service Records */}
          <Route path="/service-record/my" element={protectedRoute(<ServiceRecordListPage />)} />
          <Route path="/service-record/barber/:username" element={protectedRoute(<ServiceRecordListPage />)} />
          <Route path="/service-record/barbershop/:slug" element={protectedRoute(<ServiceRecordListPage />)} />
          <Route path="/service-record/create/:slug" element={protectedRoute(<ServiceRecordCreatePage />)} />
          <Route path="/service-record/view/:id" element={protectedRoute(<ServiceRecordViewPage />)} />

          {/* Redirecionamento */}
          <Route path="/*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
