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
// User
import UserListPage from "./pages/admin/user/UserListPage";
import UserCreatePage from "./pages/admin/user/UserCreatePage";
// Profile
import ProfileCreatePage from "./pages/admin/profile/ProfileCreatePage";
import ProfileListPage from "./pages/admin/profile/ProfileListPage";
import ProfileUpdatePage from "./pages/admin/profile/ProfileUpdatePage";

// Corporativo
// Item
import ItemListPage from "./pages/item/ItemListPage";
import ItemCreatePage from "./pages/item/ItemCreatePage";
import ItemUpdatePage from "./pages/item/ItemUpdatePage";
import ItemViewPage from "./pages/item/ItemViewPage";
// Barbershop
import BarbershopCreatePage from "./pages/corp/barbershop/BarbershopCreatePage";
import BarbershopViewPage from "./pages/barbershop/BarbershopViewPage";
import BarbershopUpdatePage from "./pages/corp/barbershop/BarbershopUpdatePage";
import BarbershopListPage from "./pages/corp/barbershop/BarbershopListPage";

import BarberViewPage from "./pages/barber/BarberViewPage";
import BarberIncludePage from "./pages/barber/BarberIncludePage";

import UserViewPage from "./pages/user/UserViewPage";
import UserUpdatePage from "./pages/user/UserUpdatePage";

import AppointmentListPage from "./pages/appointment/AppointmentListPage";
import AppointmentCreatePage from "./pages/appointment/AppointmentCreatePage";

// ServiceRecord
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
          const headers = {
            Authorization: `Bearer ${token}`,
          };
          const response = await axios.get(`${apiBaseUrl}/auth/me`, { headers });
          setUser(response.data.user);
        } catch (error) {
          setUser(null);
          localStorage.removeItem("token");
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <ProcessingIndicatorComponent
        messages={["Carregando...", "Quase pronto, por favor aguarde..."]}
        interval={500}
      />
    );
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
    <Router>
      <Routes>
        <Route path="/home" element={restrictedRoute(<HomePage />)} />
        <Route path="/register" element={restrictedRoute(<RegisterPage />)} />
        <Route path="/login" element={restrictedRoute(<LoginPage />)} />
        <Route path="/password-email" element={restrictedRoute(<PasswordEmailPage />)} />
        <Route path="/password-reset" element={restrictedRoute(<PasswordResetPage />)} />
        <Route path="/email-verify" element={emailVerifiedRoute(<EmailVerifyPage />)} />
        <Route path="/password" element={protectedRoute(<PasswordPage />)} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/*" element={<Navigate to="/home" />} />
        <Route path="/dashboard" element={protectedRoute(<DashboardPage />)} />

        <Route path="/user/update" element={protectedRoute(<UserUpdatePage />)} />
        <Route path="/user/list" element={protectedRoute(<UserListPage />)} />
        <Route path="/user/create" element={protectedRoute(<UserCreatePage />)} />
        <Route path="/user/:userName" element={protectedRoute(<UserViewPage />)} />

        <Route path="/profile/create" element={protectedRoute(<ProfileCreatePage />)} />
        <Route path="/profile/list" element={protectedRoute(<ProfileListPage />)} />
        <Route path="/profile/update/:id" element={protectedRoute(<ProfileUpdatePage />)} />

        <Route path="/item/list/:slug" element={protectedRoute(<ItemListPage />)} />
        <Route path="/item/create/:slug" element={protectedRoute(<ItemCreatePage />)} />
        <Route path="/item/update/:id" element={protectedRoute(<ItemUpdatePage />)} />
        <Route path="/item/:id" element={protectedRoute(<ItemViewPage />)} />

        <Route path="/barbershop" element={protectedRoute(<BarbershopListPage />)} />
        <Route path="/barbershop/create" element={protectedRoute(<BarbershopCreatePage />)} /> 
        <Route path="/barbershop/view/:slug" element={<BarbershopViewPage />} />
        <Route path="/barbershop/update/:id" element={protectedRoute(<BarbershopUpdatePage />)} />

        <Route path="/barber/view/:username" element={protectedRoute(<BarberViewPage />)} />
        <Route path="/barber/include/:slug" element={protectedRoute(<BarberIncludePage />)} />

         
        <Route path="/barbershop/view/:slug" element={<BarbershopViewPage />} />
        <Route path="/appointment/create/:slug" element={<AppointmentCreatePage />} />
        <Route path="/appointment/my" element={protectedRoute(<AppointmentListPage />)} />
        <Route path="/appointment/barbershop/:slug" element={protectedRoute(<AppointmentListPage />)} />
        <Route path="/appointment/barber/:username" element={protectedRoute(<AppointmentListPage />)} />

        <Route path="/service-record/create/:slug" element={protectedRoute(<ServiceRecordCreatePage />)} />
        <Route path="/service-record/my" element={protectedRoute(<ServiceRecordListPage />)} />
        <Route path="/service-record/barbershop/:slug" element={protectedRoute(<ServiceRecordListPage />)} />
        <Route path="/service-record/barber/:username" element={protectedRoute(<ServiceRecordListPage />)} />
        <Route path="/service-record/view/:id" element={protectedRoute(<ServiceRecordViewPage />)} />
      </Routes>
    </Router>
  );
};

export default App;
