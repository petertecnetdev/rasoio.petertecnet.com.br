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

  const renderMenus = () => {
    if (!user) return null;

    if (user.profile?.name === "Administrador") {
      return (
        <div className="globalnav__desktop-menu d-none d-lg-flex">
          <MenuLink to="/user/list">Usuários</MenuLink>
          <MenuLink to="/barber/list">Colaboradores</MenuLink>
          <MenuLink to="/service/list">Serviços</MenuLink>
          <MenuLink to="/appointments/list">Agendamentos</MenuLink>
        </div>
      );
    }

    if (user.isEmployer) {
      return (
        <div className="globalnav__desktop-menu d-none d-lg-flex">
          <MenuLink to="/employer/dashboard">Minha Agenda</MenuLink>
          <MenuLink to="/establishment/view">Minha Barbearia</MenuLink>
        </div>
      );
    }

    return (
      <div className="globalnav__desktop-menu d-none d-lg-flex">
        <MenuLink to="/services">Serviços</MenuLink>
        <MenuLink to="/items">Produtos</MenuLink>
        <MenuLink to="/appointments/my">Meus Agendamentos</MenuLink>
      </div>
    );
  };

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

        {renderMenus()}
      </div>

      <div className="globalnav__right">
        {!loadingMenu && (
          user ? (
            <button
              onClick={handleToggleMobileMenu}
              className="navlog__mobile-toggle-btn globalnav__mobile-btn"
              aria-label="Abrir menu"
            >
              ☰
            </button>
          ) : (
            <Link to="/login" className="navlog__login-btn globalnav__login-btn">
              Login
            </Link>
          )
        )}
      </div>
    </Navbar>
  );
}
