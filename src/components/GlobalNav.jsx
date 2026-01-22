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
import { FaStore, FaUserFriends, FaConciergeBell, FaBoxOpen } from "react-icons/fa";

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
    currentCity && currentUF ? `${currentCity} / ${currentUF}` : "Selecionar cidade";

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
        // No mobile o input fica escondido via CSS,
        // mas no desktop continua funcionando normalmente.
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

            {/* ✅ SEARCH (no mobile será oculto via CSS) */}
            <form className="nav__search nav__search--left mt-4" onSubmit={handleSearch}>
              <input
                ref={searchRef}
                type="search"
                placeholder="Buscar "
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar"
                className="mt-4"
              />
            </form>

            {/* ICON NAV */}
            <nav className="nav__links nav__links--icons" aria-label="Navegação principal">
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
                className="nav__locationText nav__changeCityBtn"
                onClick={() => setShowCityModal(true)}
              >
                📍 {locationText}
              </span>
            </div>

            {!loadingMenu && !isAuthed && (
              <div className="nav__authActions">
                <Link to="/login" className="nav__btn nav__btn--ghost">
                  Entrar
                </Link>
                <Link to="/register" className="nav__btn nav__btn--primary">
                  Criar conta
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

                {userMenuOpen && (
                  <div className="nav__userMenu">
                    <div className="nav__menuGroup">
                      <span className="nav__menuTitle">Configurações</span>
                      <button
                        className="nav__userMenuItem"
                        onClick={() => navigate("/user/update")}
                        type="button"
                      >
                        Conta
                      </button>
                      <button
                        className="nav__userMenuItem"
                        onClick={() => navigate("/order/my")}
                        type="button"
                      >
                        Meus agendamentos
                      </button>
                    </div>

                    {isEmployer && (
                      <>
                        <div className="nav__divider" />
                        <div className="nav__menuGroup">
                          <span className="nav__menuTitle">Área do Colaborador</span>
                          <button
                            className="nav__userMenuItem"
                            onClick={() => navigate("/employer/dashboard")}
                            type="button"
                          >
                            Painel
                          </button>
                          <button
                            className="nav__userMenuItem"
                            onClick={() => navigate("/employer/schedules")}
                            type="button"
                          >
                            Horários
                          </button>
                          <button
                            className="nav__userMenuItem"
                            onClick={() => navigate("/employer/orders")}
                            type="button"
                          >
                            Atendimentos
                          </button>
                        </div>
                      </>
                    )}

                    <div className="nav__divider" />
                    <div className="nav__menuGroup">
                      <span className="nav__menuTitle">Gestão de Estabelecimentos</span>
                      <button
                        className="nav__userMenuItem"
                        onClick={() => navigate("/establishment/my")}
                        type="button"
                      >
                        Meus estabelecimentos
                      </button>
                      <button
                        className="nav__userMenuItem"
                        onClick={() => navigate("/establishment/create")}
                        type="button"
                      >
                        Criar estabelecimento
                      </button>
                      <button
                        className="nav__userMenuItem"
                        onClick={() => navigate("/dashboard")}
                        type="button"
                      >
                        Dashboard
                      </button>
                    </div>

                    <div className="nav__divider" />
                    <div className="nav__menuGroup">
                      <button
                        className="nav__userMenuItem nav__logout"
                        onClick={onLogout}
                        type="button"
                      >
                        Sair
                      </button>
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
