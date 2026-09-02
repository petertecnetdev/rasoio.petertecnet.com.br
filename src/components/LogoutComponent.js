import React from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/AuthService";

const LogoutComponent = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Mesmo quando a API falha, encerra a sessão local para não prender o usuário.
      console.error("Erro durante o logout:", error);
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("authChanged"));
      navigate("/login", { replace: true });
    }
  };

  return (
    <li>
      <button type="button" className="dropdown-item" onClick={handleLogout}>
        Sair
      </button>
    </li>
  );
};

export default LogoutComponent;
