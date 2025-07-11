import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { storageUrl, apiBaseUrl } from "../config";

const NavlogComponent = () => {
  const [user, setUser] = useState(null);
  const [isBarber, setIsBarber] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCorporateSubmenu, setShowCorporateSubmenu] = useState(false);
  const [showAdminSubmenu, setShowAdminSubmenu] = useState(false);
  const [showBarberSubmenu, setShowBarberSubmenu] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) setShowMobileMenu(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const { data } = await axios.get(`${apiBaseUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(data.user);
          setIsBarber(data.is_barber);
        } catch {
          localStorage.removeItem("token");
          setUser(null);
          setIsBarber(false);
        }
      }
      setLoading(false);
      setLoadingMenu(false);
    };
    fetchUser();
  }, []);

  const handleImageError = e => {
    e.target.onerror = null;
    e.target.src = "/images/user.png";
  };

  const toggleMobile = () => setShowMobileMenu(v => !v);
  const toggleCorp = () => setShowCorporateSubmenu(v => !v);
  const toggleAdmin = () => setShowAdminSubmenu(v => !v);
  const toggleBarber = () => setShowBarberSubmenu(v => !v);

  return (
    <>
      <nav className="nav-container nav-collapse">
        <div className="nav-brand">
          <Link to="/">
            <img src="/images/logo.png" alt="Logo" className="nav-logo" />
          </Link>
        </div>
        <div className="nav-right">
          <button className="nav-toggle" onClick={toggleMobile}>
            ☰
          </button>
        </div>
      </nav>

      {showMobileMenu && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu-header">
            <button className="nav-toggle" onClick={toggleMobile}>
              ×
            </button>
          </div>

          {loading || loadingMenu ? (
            <p className="nav-link">Carregando...</p>
          ) : user ? (
            <div className="mobile-menu-content">
              <img
                src={user.avatar ? `${storageUrl}/${user.avatar}` : "/images/user.png"}
                onError={handleImageError}
                alt="Avatar"
                className="nav-avatar"
              />
              <h5 className="nav-link">{user.first_name}</h5>
              <div className="nav-links">
                <Link to="/user/update" onClick={toggleMobile} className="nav-link">
                  Gerenciar Conta
                </Link>
                <Link to="/appointment/my" onClick={toggleMobile} className="nav-link">
                  Meus Agendamentos
                </Link>

                {(user.profile?.name === "Gerente de Barbearia" ||
                  user.profile?.name === "Administrador") && (
                  <>
                    <button
                      className="nav-dropdown-corporate"
                      onClick={toggleCorp}
                    >
                      Corporativo {showCorporateSubmenu ? "▲" : "▼"}
                    </button>
                    {showCorporateSubmenu && (
                      <div className="nav-links">
                        <Link
                          to="/barbershop"
                          onClick={toggleMobile}
                          className="nav-dropdown-item nav-link"
                        >
                          Minhas Barbearias
                        </Link>
                      </div>
                    )}
                  </>
                )}

                {user.profile?.name === "Administrador" && (
                  <>
                    <button
                      className="nav-dropdown-admin"
                      onClick={toggleAdmin}
                    >
                      Administrativo {showAdminSubmenu ? "▲" : "▼"}
                    </button>
                    {showAdminSubmenu && (
                      <div className="nav-links">
                        <Link to="/user/list" onClick={toggleMobile} className="nav-dropdown-item nav-link">
                          Usuários
                        </Link>
                        <Link to="/barber/list" onClick={toggleMobile} className="nav-dropdown-item nav-link">
                          Barbeiros
                        </Link>
                        <Link to="/service/list" onClick={toggleMobile} className="nav-dropdown-item nav-link">
                          Serviços
                        </Link>
                        <Link to="/appointments/list" onClick={toggleMobile} className="nav-dropdown-item nav-link">
                          Agendamentos
                        </Link>
                      </div>
                    )}
                  </>
                )}

                {isBarber && (
                  <>
                    <button
                      className="nav-profile-dropdown"
                      onClick={toggleBarber}
                    >
                      Área do Barbeiro {showBarberSubmenu ? "▲" : "▼"}
                    </button>
                    {showBarberSubmenu && (
                      <div className="nav-links">
                        <Link to="/barber/schedule" onClick={toggleMobile} className="nav-dropdown-item nav-link">
                          Agenda
                        </Link>
                        <Link to="/barber/commission" onClick={toggleMobile} className="nav-dropdown-item nav-link">
                          Comissão
                        </Link>
                        <Link to="/barber/report" onClick={toggleMobile} className="nav-dropdown-item nav-link">
                          Relatório
                        </Link>
                      </div>
                    )}
                  </>
                )}

                <Link to="/logout" onClick={toggleMobile} className="nav-link">
                  Sair
                </Link>
              </div>
            </div>
          ) : (
            <div className="mobile-menu-content">
              <Link to="/login" onClick={toggleMobile} className="nav-link">
                Login
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default NavlogComponent;
