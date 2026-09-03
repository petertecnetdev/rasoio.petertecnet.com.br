// src/App.js
import React, {
  Suspense,
  createContext,
  lazy,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import ProcessingIndicatorComponent from "./components/ProcessingIndicatorComponent";
import SeoManager from "./components/SeoManager";
import { LoadingContext, LoadingProvider } from "./contexts/LoadingContext";
import AppLayout from "./layouts/AppLayout";
import api from "./services/api";
import { appId } from "./config";

const HomePage = lazy(() => import("./pages/HomePage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const EmailVerifyPage = lazy(() => import("./pages/auth/EmailVerifyPage"));
const LogoutPage = lazy(() => import("./pages/auth/LogoutPage"));
const PasswordEmailPage = lazy(() => import("./pages/auth/PasswordEmailPage"));
const PasswordResetPage = lazy(() => import("./pages/auth/PasswordResetPage"));
const PasswordPage = lazy(() => import("./pages/auth/PasswordPage"));
const InvitePage = lazy(() => import("./pages/auth/InvitePage"));
const InviteCompletePage = lazy(() => import("./pages/auth/InviteCompletePage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));

const OrderCreatePage = lazy(() => import("./pages/order/OrderCreatePage"));
const OrderListPage = lazy(() => import("./pages/order/OrderListPage"));
const OrderEditPage = lazy(() => import("./pages/order/OrderEditPage"));
const OrderMyPage = lazy(() => import("./pages/order/OrderMyPage"));
const OrderViewPage = lazy(() => import("./pages/order/OrderViewPage"));

const UserViewPage = lazy(() => import("./pages/user/UserViewPage"));
const UserUpdatePage = lazy(() => import("./pages/user/UserUpdatePage"));

const ItemListPage = lazy(() => import("./pages/item/ItemListPage"));
const ItemCreatePage = lazy(() => import("./pages/item/ItemCreatePage"));
const ItemViewPage = lazy(() => import("./pages/item/ItemViewPage"));
const ItemUpdatePage = lazy(() => import("./pages/item/ItemUpdatePage"));
const ItemServiceHomePage = lazy(() => import("./pages/item/ItemServiceHomePage"));
const ItemProductHomePage = lazy(() => import("./pages/item/ItemProductHomePage"));

const EmployerListPage = lazy(() => import("./pages/employer/EmployerListPage"));
const EmployerCreatePage = lazy(() => import("./pages/employer/EmployerCreatePage"));
const EmployerUpdatePage = lazy(() => import("./pages/employer/EmployerUpdatePage"));
const EmployerViewPage = lazy(() => import("./pages/employer/EmployerViewPage"));
const EmployerMePage = lazy(() => import("./pages/employer/EmployerMePage"));
const EmployerSchedulesPage = lazy(() => import("./pages/employer/EmployerSchedulesPage"));
const EmployerOrdersPage = lazy(() => import("./pages/employer/EmployerOrdersPage"));
const EmployerHomePage = lazy(() => import("./pages/employer/EmployerHomePage"));

const EstablishmentCreatePage = lazy(() => import("./pages/establishment/EstablishmentCreatePage"));
const EstablishmentViewPage = lazy(() => import("./pages/establishment/EstablishmentViewPage"));
const EstablishmentUpdatePage = lazy(() => import("./pages/establishment/EstablishmentUpdatePage"));
const EstablishmentOrderPage = lazy(() => import("./pages/establishment/EstablishmentOrderPage"));
const EstablishmentMyPage = lazy(() => import("./pages/establishment/EstablishmentMyPage"));
const EstablishmentEmployersPage = lazy(() => import("./pages/establishment/EstablishmentEmployersPage"));
const EstablishmentItemPage = lazy(() => import("./pages/establishment/EstablishmentItemPage"));
const EstablishmentHomePage = lazy(() => import("./pages/establishment/EstablishmentHomePage"));
const EstablishmentResourcesPage = lazy(() => import("./pages/establishment/EstablishmentResourcesPage"));

export const AuthContext = createContext(null);

const RouteFallback = () => (
  <ProcessingIndicatorComponent
    interval={1200}
    messages={["Carregando..."]}
    gifSrc="/images/logo.gif"
  />
);

function AppInner() {
  const { isLoading } = useContext(LoadingContext);
  const [user, setUser] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [isEmployer, setIsEmployer] = useState(false);
  const [establishments, setEstablishments] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("employer");
    setUser(null);
    setEmployer(null);
    setIsEmployer(false);
    setEstablishments([]);
  }, []);

  const syncAuth = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      clearSession();
      setInitialLoading(false);
      return;
    }

    try {
      const { data } = await api.get("/auth/me");
      const nextUser = data?.user ?? null;
      const nextEmployer = data?.employer ?? null;
      const appEstablishments = Array.isArray(data?.establishments)
        ? data.establishments.filter(
            (establishment) => Number(establishment?.app_id) === Number(appId)
          )
        : [];

      if (nextUser) localStorage.setItem("user", JSON.stringify(nextUser));
      else localStorage.removeItem("user");

      if (nextEmployer) localStorage.setItem("employer", JSON.stringify(nextEmployer));
      else localStorage.removeItem("employer");

      setUser(nextUser);
      setEmployer(nextEmployer);
      setIsEmployer(Boolean(data?.is_employer));
      setEstablishments(appEstablishments);
    } catch (error) {
      if ([401, 403].includes(error?.response?.status)) {
        localStorage.removeItem("token");
        clearSession();
      }
    } finally {
      setInitialLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    syncAuth();

    const handleAuthChanged = () => {
      syncAuth();
    };

    const handleStorage = (event) => {
      if (event.key === "token") handleAuthChanged();
    };

    window.addEventListener("authChanged", handleAuthChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("authChanged", handleAuthChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, [syncAuth]);

  const authValue = useMemo(
    () => ({
      user,
      setUser,
      employer,
      setEmployer,
      isEmployer,
      setIsEmployer,
      establishments,
      setEstablishments,
      refreshAuth: syncAuth,
    }),
    [user, employer, isEmployer, establishments, syncAuth]
  );

  if (initialLoading) return <RouteFallback />;

  const protectedRoute = (element) => {
    if (!user) return <Navigate to="/login" replace />;
    if (!user.email_verified_at) return <Navigate to="/email-verify" replace />;
    return element;
  };

  const emailVerifiedRoute = (element) => {
    if (!user) return <Navigate to="/login" replace />;
    return user.email_verified_at ? <Navigate to="/" replace /> : element;
  };

  const restrictedRoute = (element) =>
    user ? <Navigate to="/" replace /> : element;

  return (
    <AuthContext.Provider value={authValue}>
      {isLoading && <RouteFallback />}

      <Router>
        <SeoManager />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<AppLayout loadingMenu={false} />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />

              <Route path="/establishments" element={<EstablishmentHomePage />} />
              <Route path="/establishment/view/:slug" element={<EstablishmentViewPage />} />
              <Route path="/employers" element={<EmployerHomePage />} />
              <Route path="/employer/view/:user_name" element={<EmployerViewPage />} />

              <Route path="/item/services" element={<ItemServiceHomePage />} />
              <Route path="/item/products" element={<ItemProductHomePage />} />
              <Route path="/item/view/:slug" element={<ItemViewPage />} />

              <Route path="/register" element={restrictedRoute(<RegisterPage />)} />
              <Route path="/login" element={restrictedRoute(<LoginPage />)} />
              <Route path="/password-email" element={restrictedRoute(<PasswordEmailPage />)} />
              <Route path="/password-reset" element={restrictedRoute(<PasswordResetPage />)} />
              <Route path="/email-verify" element={emailVerifiedRoute(<EmailVerifyPage />)} />
              <Route path="/password" element={protectedRoute(<PasswordPage />)} />
              <Route path="/logout" element={<LogoutPage />} />
              <Route path="/invite" element={<InvitePage />} />
              <Route path="/invite-complete" element={<InviteCompletePage />} />

              <Route path="/dashboard" element={protectedRoute(<DashboardPage />)} />
              <Route path="/orders/my" element={protectedRoute(<OrderMyPage />)} />
              <Route path="/order/view/:id" element={protectedRoute(<OrderViewPage />)} />
              <Route path="/order/list/:slug" element={protectedRoute(<OrderListPage />)} />
              <Route path="/order/create/:slug" element={protectedRoute(<OrderCreatePage />)} />
              <Route path="/order/edit/:entityId/:id" element={protectedRoute(<OrderEditPage />)} />

              <Route path="/user/update" element={protectedRoute(<UserUpdatePage />)} />
              <Route path="/user/:userName" element={protectedRoute(<UserViewPage />)} />

              <Route path="/item/list/:slug" element={protectedRoute(<ItemListPage />)} />
              <Route path="/item/create/:slug" element={protectedRoute(<ItemCreatePage />)} />
              <Route path="/item/update/:id" element={protectedRoute(<ItemUpdatePage />)} />

              <Route path="/employer/list/:slug" element={protectedRoute(<EmployerListPage />)} />
              <Route path="/employer/create/:slug" element={protectedRoute(<EmployerCreatePage />)} />
              <Route path="/employer/update/:id" element={protectedRoute(<EmployerUpdatePage />)} />
              <Route path="/employer/:id" element={protectedRoute(<EmployerViewPage />)} />
              <Route path="/employer/dashboard" element={protectedRoute(<EmployerMePage />)} />
              <Route path="/employer/schedules" element={protectedRoute(<EmployerSchedulesPage />)} />
              <Route path="/employer/orders" element={protectedRoute(<EmployerOrdersPage />)} />

              <Route path="/establishment/create" element={protectedRoute(<EstablishmentCreatePage />)} />
              <Route path="/establishment/update/:id" element={protectedRoute(<EstablishmentUpdatePage />)} />
              <Route path="/establishment/my" element={protectedRoute(<EstablishmentMyPage />)} />
              <Route path="/establishment/orders/:slug" element={protectedRoute(<EstablishmentOrderPage />)} />
              <Route path="/establishment/item/:slug" element={protectedRoute(<EstablishmentItemPage />)} />
              <Route path="/establishment/employers/:slug" element={protectedRoute(<EstablishmentEmployersPage />)} />
              <Route path="/establishment/resources/:id" element={protectedRoute(<EstablishmentResourcesPage />)} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </AuthContext.Provider>
  );
}

export default function App() {
  return (
    <LoadingProvider>
      <GoogleOAuthProvider
        clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ""}
        locale="pt-BR"
      >
        <AppInner />
      </GoogleOAuthProvider>
    </LoadingProvider>
  );
}
