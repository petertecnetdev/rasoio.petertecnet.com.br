// src/layouts/AppLayout.jsx
import React, { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import PropTypes from "prop-types";

import GlobalNav from "../components/GlobalNav";
import GlobalFooter from "../components/GlobalFooter";

import "./AppLayout.css";

export default function AppLayout({ loadingMenu, handleLogout }) {
  const footerRef = useRef(null);

  // ✅ mede a altura real do footer e aplica no container do layout (uma vez pra tudo)
  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    const apply = () => {
      const h = el.offsetHeight || 0;
      document.documentElement.style.setProperty("--gfooter-height", `${h}px`);
    };

    apply();

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => apply());
      ro.observe(el);
    } else {
      window.addEventListener("resize", apply);
    }

    return () => {
      document.documentElement.style.removeProperty("--gfooter-height");
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", apply);
    };
  }, []);

  return (
    <div className="app-shell">
      <GlobalNav loadingMenu={loadingMenu} handleLogout={handleLogout} />
      <main className="app-main">
        <Outlet />
      </main>

      {/* ✅ ref aqui */}
      <div ref={footerRef}>
        <GlobalFooter />
      </div>
    </div>
  );
}

AppLayout.propTypes = {
  loadingMenu: PropTypes.bool,
  handleLogout: PropTypes.func,
};
