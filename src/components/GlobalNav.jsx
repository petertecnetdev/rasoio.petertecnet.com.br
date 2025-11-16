import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { apiBaseUrl } from "../config";
import GlobalNavHeader from "./globalnav/GlobalNavHeader";
import GlobalNavMenu from "./globalnav/GlobalNavMenu";
import "./GlobalNav.css";

export default function GlobalNav() {
  const location = useLocation();
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem("user");
    return cached ? JSON.parse(cached) : null;
  });

  const [loading, setLoading] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAdminSubmenu, setShowAdminSubmenu] = useState(false);
  const [showEstSubmenu, setShowEstSubmenu] = useState(false);
  const [showBarberSubmenu, setShowBarberSubmenu] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) setShowMobileMenu(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
          setLoadingMenu(false);
        }
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const { data } = await axios.get(`${apiBaseUrl}/auth/me`, { headers });

        if (!cancelled) {
          const userData = {
            ...data.user,
            isEmployer: data.is_employer,
            employer: data.employer,
            establishments: data.establishments || [],
            profile: data.profile || {},
            is_barber: data.user?.is_barber ?? false, // 🔥 ADICIONADO
          };

          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMenu(false);
        }
      }
    };

    loadUser();

    const handleAuthChanged = () => loadUser();
    window.addEventListener("authChanged", handleAuthChanged);

    return () => {
      cancelled = true;
      window.removeEventListener("authChanged", handleAuthChanged);
    };
  }, [location.pathname]);

  const handleToggleMobileMenu = () => {
    setShowMobileMenu((prev) => !prev);
    setShowAdminSubmenu(false);
    setShowEstSubmenu(false);
    setShowBarberSubmenu(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authChanged"));
    window.location.replace("/");
  };

  return (
    <>
      <GlobalNavHeader
        user={user}
        loadingMenu={loadingMenu}
        handleToggleMobileMenu={handleToggleMobileMenu}
      />

      {showMobileMenu && user && (
        <GlobalNavMenu
          user={user}
          loading={loading}
          showAdminSubmenu={showAdminSubmenu}
          setShowAdminSubmenu={setShowAdminSubmenu}
          showEstSubmenu={showEstSubmenu}
          setShowEstSubmenu={setShowEstSubmenu}
          showBarberSubmenu={showBarberSubmenu}         // 🔥 ADICIONADO
          setShowBarberSubmenu={setShowBarberSubmenu}   // 🔥 ADICIONADO
          handleToggleMobileMenu={handleToggleMobileMenu}
          handleLogout={handleLogout}
        />
      )}
    </>
  );
}
