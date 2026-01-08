import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { storageUrl } from "../../config";
import GlobalNavAdminMenu from "./GlobalNavAdminMenu";
import GlobalNavEstablishments from "./GlobalNavEstablishments";
import "./GlobalNavMenu.css";

export default function GlobalNavMenu({
  user,
  loading,
  showAdminSubmenu,
  setShowAdminSubmenu,
  showEstSubmenu,
  setShowEstSubmenu,
  handleToggleMobileMenu,
  handleLogout,
}) {
  const avatarSrc = useMemo(() => {
    const paths = [user?.avatar, user?.images?.avatar, user?.images?.profile].filter(Boolean);
    if (!paths.length) return "/images/user.png";
    return paths[0].startsWith("http") ? paths[0] : `${storageUrl}/${paths[0]}`;
  }, [user]);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "/images/user.png";
  };

  return (
    <div className="navlog__mobile-menu">
      <div className="navlog__mobile-close">
        <button onClick={handleToggleMobileMenu} className="navlog__close-btn">×</button>
      </div>

      <div className="navlog__mobile-content">
        {loading ? (
          <p className="navlog__loading">Carregando...</p>
        ) : (
          <>
            <img src={avatarSrc} alt="Avatar" onError={handleImageError} className="navlog__avatar" />
            <h5 className="navlog__user-name">{user?.first_name}</h5>

            <nav className="navlog__mobile-links">
              <Link to="/establishments" onClick={handleToggleMobileMenu} className="navlog__link">Estabelecimentos</Link>
              <Link to="/employers" onClick={handleToggleMobileMenu} className="navlog__link">Profissionais</Link>
              <Link to="/item/services" onClick={handleToggleMobileMenu} className="navlog__link">Serviços</Link>
              <Link to="/item/products" onClick={handleToggleMobileMenu} className="navlog__link">Produtos</Link>

              {user && user.profile?.name !== "Administrador" && (
                <Link to="/appointments/my" onClick={handleToggleMobileMenu} className="navlog__link">Meus Agendamentos</Link>
              )}

              <Link to="/user/update" onClick={handleToggleMobileMenu} className="navlog__link">Gerenciar Conta</Link>
              <Link to="/invite" onClick={handleToggleMobileMenu} className="navlog__link">Convidar Usuário</Link>

              {user?.profile?.name === "Administrador" && (
                <GlobalNavAdminMenu
                  showAdminSubmenu={showAdminSubmenu}
                  setShowAdminSubmenu={setShowAdminSubmenu}
                  handleToggleMobileMenu={handleToggleMobileMenu}
                />
              )}

              {user?.isEmployer && (
                <Link to="/employer/dashboard" onClick={handleToggleMobileMenu} className="navlog__link">Área do Colaborador</Link>
              )}

              <Link to="/logout" onClick={() => { handleToggleMobileMenu(); handleLogout(); }} className="navlog__link">Sair</Link>
            </nav>
          </>
        )}
      </div>
    </div>
  );
}
