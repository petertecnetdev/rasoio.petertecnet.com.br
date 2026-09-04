// src/components/GlobalNav.jsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBoxOpen, FaConciergeBell, FaStore, FaUserFriends } from "react-icons/fa";

import { AuthContext } from "../App";
import useImageUtils from "../hooks/useImageUtils";
import useSelectedCity from "../hooks/useSelectedCity";
import api from "../services/api";
import CitySelectorModal from "./CitySelectorModal";
import NotificationBell from "./NotificationBell";
import "./GlobalNav.css";

export default function GlobalNav({ loadingMenu, handleLogout }) {
  const { user, isEmployer } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { city } = useSelectedCity();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [search, setSearch] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const userMenuRef = useRef(null);
  const searchRef = useRef(null);
  const isAuthed = Boolean(user);

  const fullName = useMemo(() => {
    if (!user) return "";
    return (
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.name ||
      user.user_name ||
      user.username ||
      user.email ||
      "Minha conta"
    );
  }, [user]);

  const { imageUrl, handleImgError, placeholderSvg } = useImageUtils({
    fallbackText: fullName,
    fallbackShape: "round",
  });

  const avatarSrc = useMemo(() => {
    const raw = user?.images?.avatar || user?.images?.profile || user?.avatar || null;
    return imageUrl(raw) || placeholderSvg || "/images/user.png";
  }, [user, imageUrl, placeholderSvg]);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setSearch("");
  };

  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      if (handleLogout) await handleLogout();
      else {
        try {
          await api.post("/auth/logout");
        } catch {
          // A sessão local ainda deve ser encerrada se a API estiver indisponível.
        }
      }
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("employer");
      window.dispatchEvent(new Event("authChanged"));
      setUserMenuOpen(false);
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  useEffect(() => {
    const onClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") setUserMenuOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (prefix) => location.pathname.startsWith(prefix);
  const go = (path) => {
    setUserMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <header className="nav">
        <div className="nav__bar">
          <div className="nav__left nav__left--fb">
            <Link to="/" className="nav__brand" aria-label="Ir para o Rasoio">
              <img src="/rasoio-logo.png" alt="Rasoio" className="nav__logo" />
            </Link>

            <form className="nav__search nav__search--left" onSubmit={handleSearch} role="search">
              <input
                ref={searchRef}
                type="search"
                placeholder="Buscar estabelecimentos, profissionais e serviços"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Buscar no Rasoio"
              />
            </form>

            <nav className="nav__links nav__links--icons" aria-label="Navegação principal">
              <Link to="/establishments" className={`nav__link nav__iconLink ${isActive("/establishments") ? "active" : ""}`} title="Estabelecimentos" aria-label="Estabelecimentos">
                <FaStore className="nav__icon" />
              </Link>
              <Link to="/employers" className={`nav__link nav__iconLink ${isActive("/employers") ? "active" : ""}`} title="Profissionais" aria-label="Profissionais">
                <FaUserFriends className="nav__icon" />
              </Link>
              <Link to="/item/services" className={`nav__link nav__iconLink ${isActive("/item/services") ? "active" : ""}`} title="Serviços" aria-label="Serviços">
                <FaConciergeBell className="nav__icon" />
              </Link>
              <Link to="/item/products" className={`nav__link nav__iconLink ${isActive("/item/products") ? "active" : ""}`} title="Produtos" aria-label="Produtos">
                <FaBoxOpen className="nav__icon" />
              </Link>
            </nav>
          </div>

          <div className="nav__right">
            <button type="button" className="nav__locationText nav__changeCityBtn p-2" onClick={() => setShowCityModal(true)} aria-label="Alterar cidade">
              {city || "Selecionar cidade"}
            </button>

            {!loadingMenu && !isAuthed && (
              <div className="nav__authActions">
                <Link to="/login" className="nav__btn nav__btn--ghost">Entrar</Link>
              </div>
            )}

            {!loadingMenu && isAuthed && <NotificationBell />}

            {!loadingMenu && isAuthed && (
              <div className="nav__user" ref={userMenuRef}>
                <button className="nav__userBtn" onClick={() => setUserMenuOpen((open) => !open)} type="button" aria-expanded={userMenuOpen} aria-haspopup="menu">
                  <img src={avatarSrc} alt="" className="nav__avatar" onError={handleImgError} />
                  <span className="nav__userName">{fullName}</span>
                </button>

                {userMenuOpen && (
                  <div className="nav__userMenu" role="menu">
                    <div className="nav__userMenuHeader">
                      <div className="nav__userMenuHeaderLeft">
                        <img src={avatarSrc} alt="" className="nav__userMenuAvatar" onError={handleImgError} />
                        <div className="nav__userMenuHeaderInfo">
                          <div className="nav__userMenuName">{fullName}</div>
                          <div className="nav__userMenuEmail">{user?.email || ""}</div>
                        </div>
                      </div>
                      <button type="button" className="nav__userMenuClose" onClick={() => setUserMenuOpen(false)} aria-label="Fechar menu">✕</button>
                    </div>

                    <div className="nav__userMenuContent">
                      <div className="nav__menuGroup">
                        <span className="nav__menuTitle">Minha conta</span>
                        <button className="nav__userMenuItem" onClick={() => go("/orders/my")} type="button">
                          <span className="nav__menuIcon">📅</span><span className="nav__menuText">Meus agendamentos</span><span className="nav__menuArrow">›</span>
                        </button>
                        <button className="nav__userMenuItem" onClick={() => go("/user/update")} type="button">
                          <span className="nav__menuIcon">👤</span><span className="nav__menuText">Dados da conta</span><span className="nav__menuArrow">›</span>
                        </button>
                      </div>

                      {isEmployer && (
                        <>
                          <div className="nav__divider" />
                          <div className="nav__menuGroup">
                            <span className="nav__menuTitle">Área profissional</span>
                            <button className="nav__userMenuItem" onClick={() => go("/employer/dashboard")} type="button">
                              <span className="nav__menuIcon">💼</span><span className="nav__menuText">Painel profissional</span><span className="nav__menuArrow">›</span>
                            </button>
                            <button className="nav__userMenuItem" onClick={() => go("/employer/schedules")} type="button">
                              <span className="nav__menuIcon">⏱️</span><span className="nav__menuText">Disponibilidade</span><span className="nav__menuArrow">›</span>
                            </button>
                            <button className="nav__userMenuItem" onClick={() => go("/employer/orders")} type="button">
                              <span className="nav__menuIcon">🧾</span><span className="nav__menuText">Atendimentos</span><span className="nav__menuArrow">›</span>
                            </button>
                          </div>
                        </>
                      )}

                      <div className="nav__divider" />
                      <div className="nav__menuGroup">
                        <span className="nav__menuTitle">Gestão de estabelecimentos</span>
                        <button className="nav__userMenuItem" onClick={() => go("/establishment/my")} type="button">
                          <span className="nav__menuIcon">🏪</span><span className="nav__menuText">Meus estabelecimentos</span><span className="nav__menuArrow">›</span>
                        </button>
                        <button className="nav__userMenuItem" onClick={() => go("/establishment/create")} type="button">
                          <span className="nav__menuIcon">➕</span><span className="nav__menuText">Cadastrar estabelecimento</span><span className="nav__menuArrow">›</span>
                        </button>
                      </div>

                      <div className="nav__divider" />
                      <div className="nav__menuGroup">
                        <button className="nav__userMenuItem nav__logout" onClick={onLogout} type="button" disabled={loggingOut}>
                          <span className="nav__menuIcon">🚪</span><span className="nav__menuText">{loggingOut ? "Saindo..." : "Sair"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <CitySelectorModal user={user || {}} show={showCityModal} onClose={() => setShowCityModal(false)} onSelectCity={() => setShowCityModal(false)} />
    </>
  );
}

GlobalNav.propTypes = {
  loadingMenu: PropTypes.bool,
  handleLogout: PropTypes.func,
};
