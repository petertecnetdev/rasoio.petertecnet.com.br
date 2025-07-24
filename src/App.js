import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

import HomePage from "./pages/HomePage";

// Auth
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import EmailVerifyPage from "./pages/auth/EmailVerifyPage";
import LogoutPage from "./pages/auth/LogoutPage";
import PasswordEmailPage from "./pages/auth/PasswordEmailPage";
import PasswordResetPage from "./pages/auth/PasswordResetPage";
import PasswordPage from "./pages/auth/PasswordPage";

import DashboardPage from "./pages/DashboardPage";

// Administrativo
import UserListPage from "./pages/admin/user/UserListPage";
import UserCreatePage from "./pages/admin/user/UserCreatePage";
import UserViewPage from "./pages/user/UserViewPage";
import UserUpdatePage from "./pages/user/UserUpdatePage";

import ProfileCreatePage from "./pages/admin/profile/ProfileCreatePage";
import ProfileListPage from "./pages/admin/profile/ProfileListPage";
import ProfileUpdatePage from "./pages/admin/profile/ProfileUpdatePage";

// Corporativo
import ItemListPage from "./pages/item/ItemListPage";
import ItemCreatePage from "./pages/item/ItemCreatePage";
import ItemUpdatePage from "./pages/item/ItemUpdatePage";
import ItemViewPage from "./pages/item/ItemViewPage";

import BarbershopListPage from "./pages/corp/barbershop/BarbershopListPage";
import BarbershopCreatePage from "./pages/corp/barbershop/BarbershopCreatePage";
import BarbershopUpdatePage from "./pages/corp/barbershop/BarbershopUpdatePage";
import BarbershopViewPage from "./pages/barbershop/BarbershopViewPage";

import BarberViewPage from "./pages/barber/BarberViewPage";
import BarberIncludePage from "./pages/barber/BarberIncludePage";

// Agendamentos
import AppointmentCreatePage from "./pages/appointment/AppointmentCreatePage";
import AppointmentsClientPage from "./pages/appointment/AppointmentsClientPage.js";
import AppointmentsBarberPage from "./pages/appointment/AppointmentsBarberPage";
import BarbershopAppointmentsPage from "./pages/appointment/BarbershopAppointmentsPage.js";

// Service Record
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

  const protectedRoute = element => {
    if (!user) return <Navigate to="/login" />;
    if (!user.email_verified_at) return <Navigate to="/email-verify" />;
    return element;
  };

  const emailVerifiedRoute = element => {
    if (user && !user.email_verified_at) return element;
    return <Navigate to="/dashboard" />;
  };

  const restrictedRoute = element => {
    if (!user) return element;
    return <Navigate to="/dashboard" />;
  };

  return (
    <Router>
      <Routes>
        {/* PÚBLICAS */}
        <Route path="/home" element={restrictedRoute(<HomePage />)} />
        <Route path="/register" element={restrictedRoute(<RegisterPage />)} />
        <Route path="/login" element={restrictedRoute(<LoginPage />)} />
        <Route path="/password-email" element={restrictedRoute(<PasswordEmailPage />)} />
        <Route path="/password-reset" element={restrictedRoute(<PasswordResetPage />)} />
        <Route path="/email-verify" element={emailVerifiedRoute(<EmailVerifyPage />)} />
        <Route path="/password" element={protectedRoute(<PasswordPage />)} />
        <Route path="/logout" element={<LogoutPage />} />

        {/* DASHBOARD */}
        <Route path="/dashboard" element={protectedRoute(<DashboardPage />)} />

        {/* USUÁRIOS */}
        <Route path="/user/list" element={protectedRoute(<UserListPage />)} />
        <Route path="/user/create" element={protectedRoute(<UserCreatePage />)} />
        <Route path="/user/:userName" element={protectedRoute(<UserViewPage />)} />
        <Route path="/user/update" element={protectedRoute(<UserUpdatePage />)} />

        {/* PERFIS */}
        <Route path="/profile/list" element={protectedRoute(<ProfileListPage />)} />
        <Route path="/profile/create" element={protectedRoute(<ProfileCreatePage />)} />
        <Route path="/profile/update/:id" element={protectedRoute(<ProfileUpdatePage />)} />

        {/* ITENS */}
        <Route path="/item/list/:slug" element={protectedRoute(<ItemListPage />)} />
        <Route path="/item/create/:slug" element={protectedRoute(<ItemCreatePage />)} />
        <Route path="/item/update/:id" element={protectedRoute(<ItemUpdatePage />)} />
        <Route path="/item/:id" element={protectedRoute(<ItemViewPage />)} />

        {/* BARBERSHOP */}
        <Route path="/barbershop" element={protectedRoute(<BarbershopListPage />)} />
        <Route path="/barbershop/create" element={protectedRoute(<BarbershopCreatePage />)} />
        <Route path="/barbershop/update/:id" element={protectedRoute(<BarbershopUpdatePage />)} />
        <Route path="/barbershop/view/:slug" element={<BarbershopViewPage />} />

        {/* BARBEIRO */}
        <Route path="/barber/view/:username" element={<BarberViewPage />} />
        <Route path="/barber/include/:slug" element={protectedRoute(<BarberIncludePage />)} />

        {/* AGENDAMENTOS */}
        <Route path="/appointment/create/:slug" element={<AppointmentCreatePage />} />
        <Route path="/appointment/my" element={protectedRoute(<AppointmentsClientPage />)} />
        <Route path="/appointment/barber" element={protectedRoute(<AppointmentsBarberPage />)} />
        <Route path="/appointment/barbershop/:slug" element={protectedRoute(<BarbershopAppointmentsPage />)} />

        {/* SERVICE RECORD */}
        <Route path="/service-record/my" element={protectedRoute(<ServiceRecordListPage />)} />
        <Route path="/service-record/barber/:username" element={protectedRoute(<ServiceRecordListPage />)} />
        <Route path="/service-record/barbershop/:slug" element={protectedRoute(<ServiceRecordListPage />)} />
        <Route path="/service-record/create/:slug" element={protectedRoute(<ServiceRecordCreatePage />)} />
        <Route path="/service-record/view/:id" element={protectedRoute(<ServiceRecordViewPage />)} />

        {/* REDIRECIONAMENTO */}
        <Route path="/*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
