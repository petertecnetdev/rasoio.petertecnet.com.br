// src/components/NavlogComponent.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar, Container } from "react-bootstrap";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../config";

const NavlogComponent = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCorporateSubmenu, setShowCorporateSubmenu] = useState(false);
  const [showAdminSubmenu, setShowAdminSubmenu] = useState(false);
  const [showBarberSubmenu, setShowBarberSubmenu] = useState(false);

  // Fecha o menu mobile ao redimensionar para >= 992px
  useEffect(() => {
    const onResize = () => window.innerWidth >= 992 && setShowMobileMenu(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Busca dados do usuário
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const { data } = await axios.get(`${apiBaseUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(data);  // data já contém user, is_barber, barber, barbershops...
        } catch {
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
      setLoadingMenu(false);
    })();
  }, []);

  const toggleMobile       = () => setShowMobileMenu(v => !v);
  const toggleCorp         = () => setShowCorporateSubmenu(v => !v);
  const toggleAdmin        = () => setShowAdminSubmenu(v => !v);
  const toggleBarber       = () => setShowBarberSubmenu(v => !v);

  // condição para mostrar o submenu corporativo:
  const isManager = user?.barbershops && user.barbershops.length > 0;

  return (
    <>
      <Navbar expand="lg" sticky="top" variant="dark" className="nav-background">
        <Container fluid className="d-flex align-items-center">
          <Navbar.Brand as={Link} to="/" className="nav-brand">
            <img src="/images/logo.png" alt="Logo" className="nav-logo" />
          </Navbar.Brand>
          <button
            onClick={toggleMobile}
            className="nav-toggle"
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </Container>
      </Navbar>

      {showMobileMenu && (
        <div className="mobile-overlay">
          <button
            onClick={toggleMobile}
            className="close-icon"
            aria-label="Close menu"
          >
            ×
          </button>

          {loading || loadingMenu ? (
            <p className="loading-text">Carregando...</p>
          ) : user ? (
            <>
              <img
                src={user.user.avatar ? `${storageUrl}/${user.user.avatar}` : "/images/user.png"}
                alt={user.user.first_name}
                className="mobile-avatar"
                onError={e => (e.target.src = "/images/user.png")}
              />
              <h5 className="mobile-username">{user.user.first_name}</h5>

              <nav className="mobile-nav">
                <Link to="/user/update" onClick={toggleMobile} className="mobile-link">
                  Gerenciar Conta
                </Link>
                <Link to="/appointment/my" onClick={toggleMobile} className="mobile-link">
                  Meus Agendamentos
                </Link>

                {/* Submenu Corporativo se for gerente */}
                {isManager && (
                  <>
                    <button onClick={toggleCorp} className="submenu-toggle">
                      Corporativo {showCorporateSubmenu ? "▲" : "▼"}
                    </button>
                    {showCorporateSubmenu && (
                      <div className="submenu-list">
                        {user.barbershops.map(shop => (
                          <Link
                            key={shop.id}
                            to={`/barbershop`}
                            onClick={toggleMobile}
                            className="mobile-link"
                          >
                            {shop.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Submenu Administrativo */}
                {user.user.profile?.name === "Administrador" && (
                  <>
                    <button onClick={toggleAdmin} className="submenu-toggle">
                      Administrativo {showAdminSubmenu ? "▲" : "▼"}
                    </button>
                    {showAdminSubmenu && (
                      <div className="submenu-list">
                        <Link to="/user/list" onClick={toggleMobile} className="mobile-link">
                          Usuários
                        </Link>
                        <Link to="/barber/list" onClick={toggleMobile} className="mobile-link">
                          Barbeiros
                        </Link>
                        <Link to="/service/list" onClick={toggleMobile} className="mobile-link">
                          Serviços
                        </Link>
                        <Link to="/appointments/list" onClick={toggleMobile} className="mobile-link">
                          Agendamentos
                        </Link>
                      </div>
                    )}
                  </>
                )}

                {/* Submenu Área do Barbeiro */}
                {user.is_barber && (
                  <>
                    <button onClick={toggleBarber} className="submenu-toggle">
                      Área do Barbeiro {showBarberSubmenu ? "▲" : "▼"}
                    </button>
                    {showBarberSubmenu && (
                      <div className="submenu-list">
                        <Link
                          to={`/service-record/barber/${user.user.user_name}`}
                          onClick={toggleMobile}
                          className="mobile-link"
                        >
                          Meus Atendimentos
                        </Link>
                        <Link
                          to={`/appointment/barber/${user.user.user_name}`}
                          onClick={toggleMobile}
                          className="mobile-link"
                        >
                          Agendamentos de Clientes
                        </Link>
                      </div>
                    )}
                  </>
                )}

                <Link to="/logout" onClick={toggleMobile} className="mobile-link">
                  Sair
                </Link>
              </nav>
            </>
          ) : (
            <div className="mobile-auth">
              <Link to="/login" onClick={toggleMobile} className="mobile-link">
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
