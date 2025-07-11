import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
<<<<<<< HEAD
import { Nav, Navbar, NavDropdown, Spinner, Badge } from "react-bootstrap";
import { storageUrl, apiBaseUrl } from "../config";
import axios from "axios";

const Navigation = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Verifica se é mobile com base no tamanho da janela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth >= 992) {
        setShowMobileMenu(false);
      }
    };
    handleResize();
=======
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
>>>>>>> b6dc8a5d0af000183a529371eabcd70a64f359c4
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
<<<<<<< HEAD
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const response = await axios.get(`${apiBaseUrl}/auth/me`, { headers });
        const userData = response.data.user;

        let userNotifications = [];
        if (userData.extra_info) {
          try {
            const parsedExtraInfo = JSON.parse(userData.extra_info);
            userNotifications = parsedExtraInfo.notifications || [];
          } catch (e) {
            console.error("Erro ao converter extra_info", e);
          }
        }

        setUser(userData);
        setNotifications(userNotifications);
      } catch (error) {
        console.error("Erro ao buscar dados do usuário", error);
        window.location.href = "/login";
      } finally {
        setLoading(false);
        setLoadingMenu(false);
      }
    };

    fetchUserData();
  }, []);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "/images/logo.png";
  };

  const handleToggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const renderCorporateMenu = () => (
    <NavDropdown
      title={
        <span>
          <i className="nav-icon" aria-hidden="true"></i> Corporativo
        </span>
      }
      id="corporate-dropdown"
      className="nav-dropdown-corporate"
    >
      <NavDropdown.Item
        as={Link}
        to="/barbershop"
        className="nav-dropdown-item"
        onClick={() => setShowMobileMenu(false)}
      >
        Minhas Barbearias
      </NavDropdown.Item>
    </NavDropdown>
  );

  const renderAdminMenu = () => (
    <NavDropdown
      title={
        <span>
          <i className="nav-icon" aria-hidden="true"></i> Administrativo
        </span>
      }
      id="admin-dropdown"
      className="nav-dropdown-admin"
    >
      <NavDropdown.Item
        as={Link}
        to="/user/list"
        className="nav-dropdown-item"
        onClick={() => setShowMobileMenu(false)}
      >
        Usuários
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        to="/barber/list"
        className="nav-dropdown-item"
        onClick={() => setShowMobileMenu(false)}
      >
        Barbeiros
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        to="/service/list"
        className="nav-dropdown-item"
        onClick={() => setShowMobileMenu(false)}
      >
        Serviços
      </NavDropdown.Item>
      <NavDropdown.Item
        as={Link}
        to="/appointments/list"
        className="nav-dropdown-item"
        onClick={() => setShowMobileMenu(false)}
      >
        Agendamentos
      </NavDropdown.Item>
    </NavDropdown>
  );

  const renderNavContent = () => (
    <>
      <Nav className="nav-links">
        <Nav.Link as={Link} to="/services" className="nav-link" onClick={() => setShowMobileMenu(false)}>
          <i className="nav-icon" aria-hidden="true"></i> Serviços
        </Nav.Link>
        <Nav.Link as={Link} to="/barbers" className="nav-link" onClick={() => setShowMobileMenu(false)}>
          <i className="nav-icon" aria-hidden="true"></i> Barbeiros
        </Nav.Link>
        <Nav.Link as={Link} to="/appointments" className="nav-link" onClick={() => setShowMobileMenu(false)}>
          <i className="nav-icon" aria-hidden="true"></i> Agendamentos
        </Nav.Link>
        {loadingMenu ? (
          <Spinner animation="border" variant="light" size="sm" className="nav-spinner" />
        ) : (
          <>
            {user && user.profile && user.profile.name === "Gerente de Barbearia" && renderCorporateMenu()}
            {user && user.profile && user.profile.name === "Administrador" && (
              <>
                {renderCorporateMenu()}
                {renderAdminMenu()}
              </>
            )}
          </>
        )}
      </Nav>
      <Nav className="nav-right">
        {loading ? (
          <Spinner animation="border" variant="light" aria-live="polite" className="nav-spinner" />
        ) : (
          <>
            <NavDropdown
              title={
                <span>
                  <i className="nav-icon" aria-hidden="true"></i>
                  {notifications.length > 0 && (
                    <Badge bg="light" text="dark" className="nav-badge">
                      {notifications.length}
                    </Badge>
                  )}
                </span>
              }
              id="notifications-dropdown"
              className="nav-notifications"
              onClick={() => setShowMobileMenu(false)}
            >
              {notifications.length === 0 ? (
                <NavDropdown.Item className="nav-notification-item" disabled>
                  Sem notificações
                </NavDropdown.Item>
              ) : (
                <>
                  {notifications.slice(0, 6).map((notification, index) => (
                    <NavDropdown.Item className="nav-notification-item" key={index} onClick={() => setShowMobileMenu(false)}>
                      <div className="nav-notification-content">
                        <div className="nav-notification-text">{notification.content}</div>
                        <small className="nav-notification-date">
                          {new Date(notification.created_at).toLocaleString()}
                        </small>
                      </div>
                    </NavDropdown.Item>
                  ))}
                  {notifications.length > 6 && (
                    <NavDropdown.Item as={Link} to="/notifications" className="nav-notification-item" onClick={() => setShowMobileMenu(false)}>
                      Ver todas as notificações
                    </NavDropdown.Item>
                  )}
                </>
              )}
            </NavDropdown>
            {loading ? (
              <Spinner animation="border" variant="light" className="nav-spinner" />
            ) : (
              <>
                {user && (
                  <NavDropdown title={user.first_name} id="profile-dropdown" className="nav-profile-dropdown">
                    <NavDropdown.Item as={Link} to={`/user/update`} className="nav-dropdown-item" onClick={() => setShowMobileMenu(false)}>
                      Gerenciar conta
                    </NavDropdown.Item>

                    <NavDropdown.Item as={Link} to={`/appointment/my`} className="nav-dropdown-item" onClick={() => setShowMobileMenu(false)}>
                      Meus agendamentos
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/logout" className="nav-dropdown-item" onClick={() => setShowMobileMenu(false)}>
                      Sair
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
                <img
                  src={user && user.avatar ? `${storageUrl}/${user.avatar}` : "/images/user.png"}
                  alt="Avatar"
                  className="nav-avatar"
                  onError={handleImageError}
                />
              </>
            )}
          </>
        )}
      </Nav>
    </>
  );

  return (
    <>
      <Navbar expand="lg" sticky="top" bg="dark" variant="dark" className="nav-container">
        <Navbar.Brand as={Link} to="/" className="nav-brand">
          <img src="/images/logo.png" alt="Logo" className="nav-logo" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbarNav" className="nav-toggle" onClick={handleToggleMobileMenu}>
          {/* Exibe o ícone de sanduíche somente no mobile */}
          {isMobile && (
            <span style={{ fontSize: "1.5rem", color: "#ffffff" }}>
              &#9776;
            </span>
          )}
        </Navbar.Toggle>
        {!isMobile && (
          <Navbar.Collapse id="navbarNav" className="nav-collapse">
            {renderNavContent()}
          </Navbar.Collapse>
        )}
      </Navbar>
      {isMobile && showMobileMenu && (
        <div
          className="mobile-menu-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "#000000",
            zIndex: 1050,
            overflowY: "auto",
            padding: "20px"
          }}
        >
          <div className="mobile-menu-header" style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleToggleMobileMenu}
              style={{
                background: "none",
                border: "none",
                fontSize: "2rem",
                color: "#ffffff",
                cursor: "pointer"
              }}
            >
              &times;
            </button>
          </div>
          <div
            className="mobile-menu-content"
            style={{
              marginTop: "20px",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-around",
              flexWrap: "wrap"
            }}
          >
            {renderNavContent()}
          </div>
=======
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
>>>>>>> b6dc8a5d0af000183a529371eabcd70a64f359c4
        </div>
      )}
    </>
  );
};

<<<<<<< HEAD
export default Navigation;
=======
export default NavlogComponent;
>>>>>>> b6dc8a5d0af000183a529371eabcd70a64f359c4
