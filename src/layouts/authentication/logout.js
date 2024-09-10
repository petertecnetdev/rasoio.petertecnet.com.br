import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/AuthService';
import LoadingComponent from '../../components/LoadingComponent'; // Importa o componente de carregamento

const Logout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logout = async () => {
      try {
        await authService.logout(); // 
          history('/login', { replace: true });
      } catch (error) {
        console.error('Erro durante o logout:', error);
      } finally {
        setTimeout(() => {
          setLoading(false);
          navigate('/login');
        }, 2000); 
      }
    };

    localStorage.removeItem("token");
    window.location.href = "/login";
    logout();
  }, [navigate]);

  if (loading) {
    return <LoadingComponent />;
}

  return null;
};

export default Logout;
