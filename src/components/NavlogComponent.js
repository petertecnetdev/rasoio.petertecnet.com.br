import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Nav, Navbar, NavDropdown, Spinner, Badge } from "react-bootstrap";
import { storageUrl, apiBaseUrl } from "../config";
import axios from "axios";

const Navigation = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
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

  const renderCorporateMenu = () => (
    <NavDropdown
      title={<span><i className="fa fa-briefcase" aria-hidden="true"></i> Corporativo</span>}
      id="corporate-dropdown"
    >
      <NavDropdown.Item as={Link} to="/barbershop">Minhas Barbearias</NavDropdown.Item>
    </NavDropdown>
  );

  const renderAdminMenu = () => (
    <NavDropdown
      title={<span><i className="fa fa-cogs" aria-hidden="true"></i> Administrativo</span>}
      id="admin-dropdown"
    >
      <NavDropdown.Item as={Link} to="/user/list">Usuários</NavDropdown.Item>
      <NavDropdown.Item as={Link} to="/barber/list">Barbeiros</NavDropdown.Item>
      <NavDropdown.Item as={Link} to="/service/list">Serviços</NavDropdown.Item>
      <NavDropdown.Item as={Link} to="/appointments/list">Agendamentos</NavDropdown.Item>
    </NavDropdown>
  );

  const handleImageError = (e) => {
    e.target.onerror = null; // Evitar loops infinitos caso a imagem padrão também falhe
    e.target.src = "/images/logo.png"; // Caminho da imagem padrão
  };

  return (
    <Navbar expand="lg" sticky="top" bg="dark" variant="dark" className="mb-4">
      <Navbar.Brand as={Link} to="/">
        <img
          src="/images/logo.png"
          alt="Logo"
          className="rounded-circle"
          style={{ width: "60px", height: "60px" }}
        />
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="navbarNav" />
      <Navbar.Collapse id="navbarNav">
        <Nav className="me-auto">
          <Nav.Link as={Link} to="/services">
            <i className="fa fa-scissors" aria-hidden="true"></i> Serviços
          </Nav.Link>
          <Nav.Link as={Link} to="/barbers">
            <i className="fa fa-user" aria-hidden="true"></i> Barbeiros
          </Nav.Link>
          <Nav.Link as={Link} to="/appointments">
            <i className="fa fa-calendar" aria-hidden="true"></i> Agendamentos
          </Nav.Link>

          {loadingMenu ? (
            <Spinner animation="border" variant="light" size="sm" className="m-2" />
          ) : (
            <>
              {user && user.profile && user.profile.name === 'Gerente de Barbearia' && renderCorporateMenu()}
              {user && user.profile && user.profile.name === 'Administrador' && (
                <>
                  {renderCorporateMenu()}
                  {renderAdminMenu()}
                </>
              )}
            </>
          )}
        </Nav>
        <Nav>
          {loading ? (
            <Spinner animation="border" variant="light" aria-live="polite" />
          ) : (
            <NavDropdown
              title={
                <span>
                  <i className="fa fa-globe" aria-hidden="true"></i>
                  {notifications.length > 0 && (
                    <Badge bg="light" text="dark">
                      {notifications.length}
                    </Badge>
                  )}
                </span>
              }
              id="notifications-dropdown"
              className="notifications-dropdown"
            >
              {notifications.length === 0 ? (
                <NavDropdown.Item className="text-white" disabled>Sem notificações</NavDropdown.Item>
              ) : (
                <>
                  {notifications.slice(0, 6).map((notification, index) => ( 
                    <NavDropdown.Item className="text-white" key={index}>
                      <div style={{ fontSize: '14px', lineHeight: '1.2' }}>
                        <div className="text-warning" style={{ fontSize: '12px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {notification.content}
                        </div>
                        <small className="text-white">{new Date(notification.created_at).toLocaleString()}</small>
                      </div>
                    </NavDropdown.Item>
                  ))}
                  {notifications.length > 6 && (
                    <NavDropdown.Item as={Link} to="/notifications" className="text-center">
                      Ver todas as notificações
                    </NavDropdown.Item>
                  )}
                </>
              )}
            </NavDropdown>
          )}
          {loading ? (
            <Spinner animation="border" variant="light" />
          ) : (
            <>
              {user && (
                <NavDropdown title={user.first_name} id="profile-dropdown">
                  <NavDropdown.Item as={Link} to={`/user/update`}>Gerenciar conta</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/logout">Sair</NavDropdown.Item>
                </NavDropdown>
              )}
              <img
                src={user && user.avatar ? `${storageUrl}/${user.avatar}` : "/images/user.png"}
                alt="Avatar"
                className="avatar m-2 img-logo-user"
                onError={handleImageError} // Função para tratar erro de carregamento da imagem
              />
            </>
          )}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Navigation;
