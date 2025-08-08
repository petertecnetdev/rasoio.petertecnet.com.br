// src/App.jsx
import React, { useState, useEffect, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import ProcessingIndicatorComponent from "./components/ProcessingIndicatorComponent";
import { LoadingProvider, LoadingContext } from "./contexts/LoadingContext";
import { apiBaseUrl } from "./config";

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

import UserListPage from "./pages/admin/user/UserListPage";
import UserCreatePage from "./pages/admin/user/UserCreatePage";
import UserViewPage from "./pages/user/UserViewPage";
import UserUpdatePage from "./pages/user/UserUpdatePage";

import ProfileCreatePage from "./pages/admin/profile/ProfileCreatePage";
import ProfileListPage from "./pages/admin/profile/ProfileListPage";
import ProfileUpdatePage from "./pages/admin/profile/ProfileUpdatePage";

import ItemListPage from "./pages/item/ItemListPage";
import ItemCreatePage from "./pages/item/ItemCreatePage";
import ItemUpdatePage from "./pages/item/ItemUpdatePage";
import ItemViewPage from "./pages/item/ItemViewPage";

import EmployerListPage from "./pages/employer/EmployerListPage";
import EmployerCreatePage from "./pages/employer/EmployerCreatePage";
import EmployerUpdatePage from "./pages/employer/EmployerUpdatePage";
import EmployerViewPage from "./pages/employer/EmployerViewPage";

import EstablishmentListPage from "./pages/corp/establishment/EstablishmentListPage";
import EstablishmentCreatePage from "./pages/establishment/EstablishmentCreatePage";
import EstablishmentViewPage from "./pages/establishment/EstablishmentViewPage";
import EstablishmentUpdatePage from "./pages/establishment/EstablishmentUpdatePage";

import AppointmentListPage from "./pages/appointment/AppointmentListPage";
import AppointmentCreatePage from "./pages/appointment/AppointmentCreatePage";

import ServiceRecordListPage from "./pages/serviceRecord/ServiceRecordListPage";
import ServiceRecordCreatePage from "./pages/serviceRecord/ServiceRecordCreatePage";
import ServiceRecordViewPage from "./pages/serviceRecord/ServiceRecordViewPage";

import ReportOrderPage from "./pages/report/ReportOrderPage";

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
        interval={500}
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
        : <Navigate to="/dashboard" replace />
      : <Navigate to="/login" replace />;

  const restrictedRoute = (el) =>
    user ? <Navigate to="/dashboard" replace /> : el;

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

          <Route path="/employer/list/:slug" element={protectedRoute(<EmployerListPage />)} />
          <Route path="/employer/create/:slug" element={protectedRoute(<EmployerCreatePage />)} />
          <Route path="/employer/update/:id" element={protectedRoute(<EmployerUpdatePage />)} />
          <Route path="/employer/:id" element={protectedRoute(<EmployerViewPage />)} />

          <Route path="/establishment" element={protectedRoute(<EstablishmentListPage />)} />
          <Route path="/establishment/create" element={protectedRoute(<EstablishmentCreatePage />)} />
          <Route path="/establishment/update/:id" element={protectedRoute(<EstablishmentUpdatePage />)} />

          <Route path="/appointment/create/:slug" element={protectedRoute(<AppointmentCreatePage />)} />
          <Route path="/appointment/my" element={protectedRoute(<AppointmentListPage />)} />
          <Route path="/appointment/barbershop/:slug" element={protectedRoute(<AppointmentListPage />)} />
          <Route path="/appointment/barber/:username" element={protectedRoute(<AppointmentListPage />)} />

          <Route path="/service-record/create/:slug" element={protectedRoute(<ServiceRecordCreatePage />)} />
          <Route path="/service-record/my" element={protectedRoute(<ServiceRecordListPage />)} />
          <Route path="/service-record/barbershop/:slug" element={protectedRoute(<ServiceRecordListPage />)} />
          <Route path="/service-record/barber/:username" element={protectedRoute(<ServiceRecordListPage />)} />
          <Route path="/service-record/view/:id" element={protectedRoute(<ServiceRecordViewPage />)} />

          <Route path="/report/order/:entityId" element={protectedRoute(<ReportOrderPage />)} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default function App() {
  return (
    <LoadingProvider>
      <AppInner />
    </LoadingProvider>
  );
}
