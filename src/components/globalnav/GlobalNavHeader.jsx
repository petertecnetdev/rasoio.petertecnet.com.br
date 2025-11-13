import React from "react";
import { Link } from "react-router-dom";
import { Navbar } from "react-bootstrap";

export default function GlobalNavHeader({ user, loadingMenu, handleToggleMobileMenu }) {
  return (
    <Navbar expand={false} sticky="top" bg="dark" variant="dark" className="navlog__navbar">
      <Navbar.Brand as={Link} to="/" className="navlog__brand">
        <img src="/images/logo.png" alt="Logo Rasoio" className="navlog__logo-image" draggable={false} />
      </Navbar.Brand>

      {!loadingMenu &&
        (user ? (
          <button
            onClick={handleToggleMobileMenu}
            className="navlog__mobile-toggle-btn"
            aria-label="Abrir menu"
          >
            ☰
          </button>
        ) : (
          <Link to="/login" className="navlog__login-btn">
            Login
          </Link>
        ))}
    </Navbar>
  );
}
