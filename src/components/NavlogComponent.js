import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Nav, Navbar, NavDropdown, Spinner } from "react-bootstrap";
import authService from "../services/AuthService";
import { storageUrl } from "../config";

const Navigation = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await authService.me();
        setUser(userData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const renderCorporateMenu = () => (
    <NavDropdown title={<span><i className="fa fa-briefcase" aria-hidden="true"></i> Corporativo</span>} id="corporate-dropdown">
      <NavDropdown.Item as={Link} to="/barbershop">Minhas Barbearias</NavDropdown.Item>
      <NavDropdown.Item as={Link} to="/appointments/manage">Gerenciar Agendamentos</NavDropdown.Item>
      <NavDropdown.Item as={Link} to="/service/manage">Gerenciar Serviços</NavDropdown.Item>
      <NavDropdown.Item as={Link} to="/reports">Relatórios</NavDropdown.Item>
    </NavDropdown>
  );

  const renderAdminMenu = () => (
    <NavDropdown title={<span><i className="fa fa-cogs" aria-hidden="true"></i> Administrativo</span>} id="admin-dropdown">
      <NavDropdown.Item as={Link} to="/user/list">Usuários</NavDropdown.Item>
      <NavDropdown.Item as={Link} to="/barber/list">Barbeiros</NavDropdown.Item>
      <NavDropdown.Item as={Link} to="/service/list">Serviços</NavDropdown.Item>
      <NavDropdown.Item as={Link} to="/appointments/list">Agendamentos</NavDropdown.Item>
    </NavDropdown>
  );

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
          <Nav.Link as={Link} to="/services">Serviços</Nav.Link>
          <Nav.Link as={Link} to="/barbers">Barbeiros</Nav.Link>
          <Nav.Link as={Link} to="/appointments">Agendamentos</Nav.Link>
          <Nav.Link as={Link} to="/my-profile">Meu Perfil</Nav.Link>
          {user && user.profile && user.profile.name === 'Gerente de Barbearia' && renderCorporateMenu()}
          {user && user.profile && user.profile.name === 'Administrador' && (
            <>
              {renderCorporateMenu()}
              {renderAdminMenu()}
            </>
          )}
        </Nav>
        <Nav>
          {loading ? (
            <Spinner animation="border" variant="light" aria-live="polite" />
          ) : (
            <>
              {user && (
                <NavDropdown
                  title={user.first_name}
                  id="profile-dropdown"
                >
                  <NavDropdown.Item as={Link} to={`/user/edit`}>Gerenciar conta</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/settings">Configurações</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/logout">Sair</NavDropdown.Item>
                </NavDropdown>
              )}
              <img
                src={user && user.avatar ? `${storageUrl}/${user.avatar}` : "/images/logo.png"}
                alt="Avatar"
                className="avatar m-2"
                style={{ maxWidth: "40px", borderRadius: "50%" }}
              />
            </>
          )}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Navigation;
