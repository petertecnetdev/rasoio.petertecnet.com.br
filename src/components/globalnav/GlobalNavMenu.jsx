import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./GlobalNav.css";

export default function GlobalNavMenu({
  user,
  isEmployer,
  establishments,
  onClose,
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  return (
    <div className="gn-overlay" onClick={onClose}>
      <aside className="gn-menu" onClick={(e) => e.stopPropagation()}>
        <button className="gn-close" onClick={onClose}>×</button>

        {/* USER */}
        <div className="gn-user">
          <img src={user.avatar || "/images/user.png"} alt="Avatar" />
          <div>
            <strong>{user.first_name}</strong>
            <span>{user.email}</span>
          </div>
        </div>

        <nav className="gn-links">
          <div className="gn-group">Minha Conta</div>
          <Link to="/user/update" onClick={onClose}>Configurações</Link>

          <div className="gn-group">Cliente</div>
          <Link to="/order/my" onClick={onClose}>Meus Agendamentos</Link>

          {isEmployer && (
            <>
              <div className="gn-group">Colaborador</div>
              <Link to="/employer/dashboard" onClick={onClose}>Painel</Link>
              <Link to="/employer/schedules" onClick={onClose}>Horários</Link>
              <Link to="/employer/orders" onClick={onClose}>Atendimentos</Link>
            </>
          )}

          {establishments?.length > 0 && (
            <>
              <div className="gn-group">Estúdios</div>
              <Link to="/establishment/my" onClick={onClose}>
                Meus Estabelecimentos
              </Link>
              <Link to="/establishment/create" onClick={onClose}>
                Novo Estabelecimento
              </Link>
            </>
          )}

          <button
            className="gn-logout"
            onClick={() => {
              localStorage.clear();
              window.location.replace("/");
            }}
          >
            Sair
          </button>
        </nav>
      </aside>
    </div>
  );
}
