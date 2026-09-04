import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Nav, Spinner } from "react-bootstrap";

import authService from "../services/AuthService";
import { storageUrl } from "../config";

const Navigation = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchUserData = async () => {
      try {
        const userData = await authService.me();
        if (active) setUser(userData);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    const fetchNotifications = async () => {
      try {
        const userNotifications = await authService.getNotifications();
        if (active) setNotifications(Array.isArray(userNotifications) ? userNotifications : []);
      } catch {
        if (active) setNotifications([]);
      } finally {
        if (active) setLoadingNotifications(false);
      }
    };

    fetchUserData();
    fetchNotifications();

    return () => {
      active = false;
    };
  }, []);

  const canManageEstablishments = useMemo(() => {
    const profile = String(user?.profile?.name || "").toLowerCase();
    return Boolean(
      user &&
        (profile.includes("administrador") ||
          profile.includes("gerente") ||
          user?.can_manage_establishments === true)
    );
  }, [user]);

  return (
    <aside className="sidebar" aria-label="Navegação secundária">
      <div className="sidebar-brand">
        <Link to="/" aria-label="Ir para a página inicial da Rasoio">
          <img
            src="/rasoio-logo.png"
            alt="Rasoio"
            className="rounded-circle"
            style={{ width: "60px", height: "60px" }}
          />
        </Link>
      </div>

      <Nav className="flex-column">
        {loadingNotifications ? (
          <Spinner animation="border" variant="light" aria-label="Carregando notificações" />
        ) : (
          <div className="nav-item notifications" aria-live="polite">
            <span>
              <i className="fa fa-globe" aria-hidden="true" />
              {notifications.length > 0 && <Badge bg="light" text="dark">{notifications.length}</Badge>}
            </span>
            {notifications.length === 0 ? (
              <span>Sem notificações</span>
            ) : (
              notifications.map((notification, index) => (
                <div key={notification?.id || index} className="nav-item">
                  {notification?.message || "Nova notificação"}
                </div>
              ))
            )}
          </div>
        )}

        <Link to="/establishments" className="nav-link">
          <i className="fa fa-building" aria-hidden="true" /> Estabelecimentos
        </Link>
        <Link to="/employers" className="nav-link">
          <i className="fa fa-user" aria-hidden="true" /> Profissionais
        </Link>
        <Link to="/item/services" className="nav-link">
          <i className="fa fa-calendar-check" aria-hidden="true" /> Serviços
        </Link>
        <Link to="/orders/my" className="nav-link">
          <i className="fa fa-calendar" aria-hidden="true" /> Meus agendamentos
        </Link>

        {canManageEstablishments && (
          <>
            <Link to="/establishment/my" className="nav-link">Gerenciar estabelecimentos</Link>
            <Link to="/dashboard" className="nav-link">Visão geral</Link>
          </>
        )}
      </Nav>

      <div className="sidebar-footer">
        {loading ? (
          <Spinner animation="border" variant="light" aria-label="Carregando conta" />
        ) : user ? (
          <div className="profile-dropdown">
            <span>{user.first_name}</span>
            <div className="dropdown-menu">
              <Link to="/user/update" className="dropdown-item">Gerenciar conta</Link>
              <Link to="/logout" className="dropdown-item">Sair</Link>
            </div>
            <img
              src={user.avatar ? `${storageUrl}/${user.avatar}` : "/rasoio-logo.png"}
              alt={`Avatar de ${user.first_name || "usuário"}`}
              className="avatar m-2"
              style={{ maxWidth: "40px", borderRadius: "50%" }}
            />
          </div>
        ) : null}
      </div>
    </aside>
  );
};

export default Navigation;
