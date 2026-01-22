// src/components/GlobalFooter.jsx
// ✅ Remova a lógica de mexer no body (has-gfooter) se você aplicou a medição no AppLayout.
// Mantenha o footer simples e fixo.

import React, { useContext, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  FaHome,
  FaStore,
  FaUserFriends,
  FaConciergeBell,
  FaBoxOpen,
  FaUserCircle,
  FaSignInAlt,
} from "react-icons/fa";

import { AuthContext } from "../App";
import "./GlobalFooter.css";

export default function GlobalFooter({ className }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthed = !!user;

  const isActive = useMemo(() => {
    const path = location.pathname || "/";
    return {
      home: path === "/",
      establishments: path.startsWith("/establishments") || path.startsWith("/establishment/"),
      employers: path.startsWith("/employers") || path.startsWith("/employer/"),
      services: path.startsWith("/item/services"),
      products: path.startsWith("/item/products"),
      account: path.startsWith("/user/") || path.startsWith("/login") || path.startsWith("/register"),
    };
  }, [location.pathname]);

  const [pressed, setPressed] = useState(null);

  const go = (to) => {
    setPressed(to);
    setTimeout(() => setPressed(null), 120);
    navigate(to);
  };

  return (
    <footer className={`gfooter ${className || ""}`}>
      <div className="gfooter__inner">
        <button
          type="button"
          className={`gfooter__item ${isActive.home ? "active" : ""} ${
            pressed === "/" ? "pressed" : ""
          }`}
          onClick={() => go("/")}
          aria-label="Home"
          title="Home"
        >
          <FaHome className="gfooter__icon" />
          <span className="gfooter__label">Home</span>
        </button>

        <button
          type="button"
          className={`gfooter__item ${isActive.establishments ? "active" : ""} ${
            pressed === "/establishments" ? "pressed" : ""
          }`}
          onClick={() => go("/establishments")}
          aria-label="Estabelecimentos"
          title="Estabelecimentos"
        >
          <FaStore className="gfooter__icon" />
          <span className="gfooter__label">Estabs</span>
        </button>

        <button
          type="button"
          className={`gfooter__item ${isActive.employers ? "active" : ""} ${
            pressed === "/employers" ? "pressed" : ""
          }`}
          onClick={() => go("/employers")}
          aria-label="Profissionais"
          title="Profissionais"
        >
          <FaUserFriends className="gfooter__icon" />
          <span className="gfooter__label">Profs</span>
        </button>

        <button
          type="button"
          className={`gfooter__item ${isActive.services ? "active" : ""} ${
            pressed === "/item/services" ? "pressed" : ""
          }`}
          onClick={() => go("/item/services")}
          aria-label="Serviços"
          title="Serviços"
        >
          <FaConciergeBell className="gfooter__icon" />
          <span className="gfooter__label">Serviços</span>
        </button>

        <button
          type="button"
          className={`gfooter__item ${isActive.products ? "active" : ""} ${
            pressed === "/item/products" ? "pressed" : ""
          }`}
          onClick={() => go("/item/products")}
          aria-label="Produtos"
          title="Produtos"
        >
          <FaBoxOpen className="gfooter__icon" />
          <span className="gfooter__label">Produtos</span>
        </button>

        {!isAuthed ? (
          <Link
            to="/login"
            className={`gfooter__item gfooter__link ${isActive.account ? "active" : ""}`}
            aria-label="Entrar"
            title="Entrar"
          >
            <FaSignInAlt className="gfooter__icon" />
            <span className="gfooter__label">Entrar</span>
          </Link>
        ) : (
          <button
            type="button"
            className={`gfooter__item ${isActive.account ? "active" : ""} ${
              pressed === "/user/update" ? "pressed" : ""
            }`}
            onClick={() => go("/user/update")}
            aria-label="Conta"
            title="Conta"
          >
            <FaUserCircle className="gfooter__icon" />
            <span className="gfooter__label">Conta</span>
          </button>
        )}
      </div>
    </footer>
  );
}

GlobalFooter.propTypes = {
  className: PropTypes.string,
};
