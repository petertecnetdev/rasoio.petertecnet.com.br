import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const LogoutComponent = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Erro durante o logout:', error);
    }
  };

  return (
    <li>
      <button type="button" className="dropdown-item" onClick={handleLogout}>Sair</button>
    </li>
  );
};

export default LogoutComponent;
