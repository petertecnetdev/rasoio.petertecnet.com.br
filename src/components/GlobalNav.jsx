// src/components/GlobalNav.jsx
import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaStore,
  FaUserFriends,
  FaConciergeBell,
  FaBoxOpen,
} from "react-icons/fa";

import { AuthContext } from "../App";
import useImageUtils from "../hooks/useImageUtils";
import CitySelectorModal from "./CitySelectorModal";
import ProcessingIndicatorComponent from "./ProcessingIndicatorComponent";

import "./GlobalNav.css";

export default function GlobalNav({ loadingMenu, handleLogout }) {
  const { user, isEmployer } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [search, setSearch] = useState("");

  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  const isAuthed = !!user;

  /* ================= USER ================= */
  const fullName = useMemo(() => {
    if (!user) return "";
    return (
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.name ||
      user.username ||
      user.email
    );
  }, [user]);

  const { imageUrl, handleImgError, placeholderSvg } = useImageUtils({
    fallbackText: fullName,
    fallbackShape: "round",
  });

  const avatarSrc = useMemo(() => {
    const raw =
      user?.images?.avatar || user?.images?.profile || user?.avatar || null;
    return imageUrl(raw) || placeholderSvg || "/images/user.png";
  }, [user, imageUrl, placeholderSvg]);

  /* ================= LOCATION ================= */
  const currentCity = localStorage.getItem("selectedCity");
  const currentUF = localStorage.getItem("selectedUF");

  const locationText =
    currentCity && currentUF
      ? `${currentCity}`
      : "Selecionar cidade";

  /* ================= SEARCH ================= */
  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    setSearch("");
  };

  /* ================= LOGOUT ================= */
  const onLogout = async () => {
    setProcessing(true);
    try {
      if (handleLogout) await handleLogout();
    } finally {
      localStorage.clear();
      window.dispatchEvent(new Event("authChanged"));
      window.location.replace("/login");
    }
  };

  /* ================= OUTSIDE CLICK ================= */
  useEffect(() => {
    const onClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  /* ================= COMMAND SHORTCUT ================= */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (processing) {
    return (
      <ProcessingIndicatorComponent gifSrc="/images/logo.gif" minDuration={0} />
    );
  }

  const isActive = (pathPrefix) => location.pathname.startsWith(pathPrefix);

  return (
    <>
      <header className="nav">
        <div className="nav__bar">
          {/* ================= LEFT (LOGO + SEARCH + ICON LINKS) ================= */}
          <div className="nav__left nav__left--fb">
            <Link to="/" className="nav__brand" aria-label="Ir para Home">
              <img src="/images/logo.png" alt="Logo" className="nav__logo" />
            </Link>

            {/* SEARCH */}
            <form
              className="nav__search nav__search--left "
              onSubmit={handleSearch}
            >
              <input
                ref={searchRef}
                type="search"
                placeholder="Buscar "
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar"
                className=""
              />
            </form>

            {/* ICON NAV (some no mobile via CSS) */}
            <nav
              className="nav__links nav__links--icons"
              aria-label="Navegação principal"
            >
              <Link
                to="/establishments"
                className={`nav__link nav__iconLink ${
                  isActive("/establishments") ? "active" : ""
                }`}
                title="Estabelecimentos"
                aria-label="Estabelecimentos"
              >
                <FaStore className="nav__icon" />
              </Link>

              <Link
                to="/employers"
                className={`nav__link nav__iconLink ${
                  isActive("/employers") ? "active" : ""
                }`}
                title="Profissionais"
                aria-label="Profissionais"
              >
                <FaUserFriends className="nav__icon" />
              </Link>

              <Link
                to="/item/services"
                className={`nav__link nav__iconLink ${
                  isActive("/item/services") ? "active" : ""
                }`}
                title="Serviços"
                aria-label="Serviços"
              >
                <FaConciergeBell className="nav__icon" />
              </Link>

              <Link
                to="/item/products"
                className={`nav__link nav__iconLink ${
                  isActive("/item/products") ? "active" : ""
                }`}
                title="Produtos"
                aria-label="Produtos"
              >
                <FaBoxOpen className="nav__icon" />
              </Link>
            </nav>
          </div>

          {/* ================= RIGHT ================= */}
          <div className="nav__right">
            <div className="nav__locationWrap">
              <span
                className="nav__locationText nav__changeCityBtn p-2"
                onClick={() => setShowCityModal(true)}
              >
                {locationText}
              </span>
            </div>

            {!loadingMenu && !isAuthed && (
              <div className="nav__authActions">
                <Link to="/login" className="nav__btn nav__btn--ghost">
                  Entrar
                </Link>
              </div>
            )}

            {!loadingMenu && isAuthed && (
              <div className="nav__user" ref={userMenuRef}>
                <button
                  className="nav__userBtn"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  type="button"
                >
                  <img
                    src={avatarSrc}
                    alt={fullName}
                    className="nav__avatar"
                    onError={handleImgError}
                  />
                  <span className="nav__userName">{fullName}</span>
                </button>

                {/* ✅ MENU (agora está no lugar certo) */}
                {userMenuOpen && (
                  <div className="nav__userMenu" role="dialog" aria-modal="true">
                    {/* HEADER DO MENU */}
                    <div className="nav__userMenuHeader">
                      <div className="nav__userMenuHeaderLeft">
                        <img
                          src={avatarSrc}
                          alt={fullName}
                          className="nav__userMenuAvatar"
                          onError={handleImgError}
                        />

                        <div className="nav__userMenuHeaderInfo">
                          <div className="nav__userMenuName">{fullName}</div>
                          <div className="nav__userMenuEmail">
                            {user?.email || ""}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="nav__userMenuClose"
                        onClick={() => setUserMenuOpen(false)}
                        aria-label="Fechar menu"
                        title="Fechar"
                      >
                        ✕
                      </button>
                    </div>

                    {/* CONTEÚDO */}
                    <div className="nav__userMenuContent">
                      {/* Configurações */}
                      <div className="nav__menuGroup">
                        <span className="nav__menuTitle">Configurações</span>

                        <button
                          className="nav__userMenuItem"
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigate("/user/update");
                          }}
                          type="button"
                        >
                          <span className="nav__menuIcon">👤</span>
                          <span className="nav__menuText">Conta</span>
                          <span className="nav__menuArrow">›</span>
                        </button>

                        <button
                          className="nav__userMenuItem"
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigate("/orders/my");
                          }}
                          type="button"
                        >
                          <span className="nav__menuIcon">📅</span>
                          <span className="nav__menuText">Meus agendamentos</span>
                          <span className="nav__menuArrow">›</span>
                        </button>
                      </div>

                      {/* Área do Colaborador */}
                      {isEmployer && (
                        <>
                          <div className="nav__divider" />
                          <div className="nav__menuGroup">
                            <span className="nav__menuTitle">
                              Área do Colaborador
                            </span>

                            <button
                              className="nav__userMenuItem"
                              onClick={() => {
                                setUserMenuOpen(false);
                                navigate("/employer/dashboard");
                              }}
                              type="button"
                            >
                              <span className="nav__menuIcon">📊</span>
                              <span className="nav__menuText">Painel</span>
                              <span className="nav__menuArrow">›</span>
                            </button>

                            <button
                              className="nav__userMenuItem"
                              onClick={() => {
                                setUserMenuOpen(false);
                                navigate("/employer/schedules");
                              }}
                              type="button"
                            >
                              <span className="nav__menuIcon">⏱️</span>
                              <span className="nav__menuText">Horários</span>
                              <span className="nav__menuArrow">›</span>
                            </button>

                            <button
                              className="nav__userMenuItem"
                              onClick={() => {
                                setUserMenuOpen(false);
                                navigate("/employer/orders");
                              }}
                              type="button"
                            >
                              <span className="nav__menuIcon">🧾</span>
                              <span className="nav__menuText">Atendimentos</span>
                              <span className="nav__menuArrow">›</span>
                            </button>
                          </div>
                        </>
                      )}

                      {/* Gestão */}
                      <div className="nav__divider" />
                      <div className="nav__menuGroup">
                        <span className="nav__menuTitle">Gestão</span>

                        <button
                          className="nav__userMenuItem"
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigate("/establishment/my");
                          }}
                          type="button"
                        >
                          <span className="nav__menuIcon">🏪</span>
                          <span className="nav__menuText">
                            Meus estabelecimentos
                          </span>
                          <span className="nav__menuArrow">›</span>
                        </button>

                        <button
                          className="nav__userMenuItem"
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigate("/establishment/create");
                          }}
                          type="button"
                        >
                          <span className="nav__menuIcon">➕</span>
                          <span className="nav__menuText">
                            Criar estabelecimento
                          </span>
                          <span className="nav__menuArrow">›</span>
                        </button>

                        <button
                          className="nav__userMenuItem"
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigate("/dashboard");
                          }}
                          type="button"
                        >
                          <span className="nav__menuIcon">📈</span>
                          <span className="nav__menuText">Dashboard</span>
                          <span className="nav__menuArrow">›</span>
                        </button>
                      </div>

                      {/* Logout */}
                      <div className="nav__divider" />
                      <div className="nav__menuGroup">
                        <button
                          className="nav__userMenuItem nav__logout"
                          onClick={() => {
                            setUserMenuOpen(false);
                            onLogout();
                          }}
                          type="button"
                        >
                          <span className="nav__menuIcon">🚪</span>
                          <span className="nav__menuText">Sair</span>
                          
                        </button>
                      </div>
                      
                      <div className="nav__divider" />
                      
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <CitySelectorModal
        user={user || {}}
        show={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSelectCity={({ city, uf }) => {
          localStorage.setItem("selectedCity", city);
          localStorage.setItem("selectedUF", uf);
          setShowCityModal(false);
        }}
      />
    </>
  );
}

GlobalNav.propTypes = {
  loadingMenu: PropTypes.bool,
  handleLogout: PropTypes.func,
};
