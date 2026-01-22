import React from "react";
import { Link } from "react-router-dom";
import "./GlobalNav.css";

export default function GlobalNavHeader({ user, onOpenMenu }) {
  const isAuthed = !!user?.email;

  return (
    <header className="gn-header">
      {/* LOGO */}
      <Link to="/" className="gn-logo">
        <img src="/images/logo.png" alt="Rasoio" />
      </Link>

      {/* LINKS PÚBLICOS */}
      <nav className="gn-public-links">
        <Link to="/establishments">Estabelecimentos</Link>
        <Link to="/employers">Profissionais</Link>
        <Link to="/item/services">Serviços</Link>
        <Link to="/item/products">Produtos</Link>
      </nav>

      {/* AÇÕES */}
      <div className="gn-actions">
        {!isAuthed && (
          <>
            <Link to="/login" className="gn-login">
              Entrar
            </Link>
            <Link to="/register" className="gn-register">
              Criar conta
            </Link>
          </>
        )}

        {isAuthed && (
          <button
            className="gn-avatar-btn"
            onClick={onOpenMenu}
            aria-label="Abrir menu do usuário"
          >
            <img
              src={user.avatar || "/images/user.png"}
              alt="Avatar"
            />
          </button>
        )}
      </div>
    </header>
  );
}
