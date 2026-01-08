import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Navbar } from "react-bootstrap";
import "./GlobalNavHeader.css";

export default function GlobalNavHeader({ user, loadingMenu, handleToggleMobileMenu }) {
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path);

  const MenuLink = ({ to, children }) => (
    <Link
      to={to}
      className={`globalnav__desktop-link ${isActive(to) ? "active" : ""}`}
    >
      {children}
    </Link>
  );

  return (
    <Navbar
      expand={false}
      sticky="top"
      bg="dark"
      variant="dark"
      className="navlog__navbar globalnav__header"
    >
      <div className="globalnav__left">
        <Navbar.Brand as={Link} to="/" className="navlog__brand globalnav__brand">
          <img
            src="/images/logo.png"
            alt="Logo Rasoio"
            className="navlog__logo-image globalnav__logo"
            draggable={false}
          />
        </Navbar.Brand>

        {/* MENU DESKTOP */}
        <div className="globalnav__desktop-menu d-none d-lg-flex">
          <MenuLink to="/establishments">Estabelecimentos</MenuLink>
          <MenuLink to="/employers">Profissionais</MenuLink>
          <MenuLink to="/item/services">Serviços</MenuLink>
          <MenuLink to="/item/products">Produtos</MenuLink>

          {user && user.profile?.name !== "Administrador" && (
            <MenuLink to="/appointments/my">Meus Agendamentos</MenuLink>
          )}

          {user?.profile?.name === "Administrador" && (
            <>
              <MenuLink to="/user/list">Usuários</MenuLink>
              <MenuLink to="/barber/list">Colaboradores</MenuLink>
              <MenuLink to="/appointments/list">Agendamentos</MenuLink>
            </>
          )}
        </div>
      </div>

      <div className="globalnav__right">
        {!loadingMenu && (
          <button
            onClick={handleToggleMobileMenu}
            className="navlog__mobile-toggle-btn globalnav__mobile-btn"
            aria-label="Abrir menu"
          >
            ☰
          </button>
        )}
      </div>
    </Navbar>
  );
}
