import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/AuthService";
import LoadingComponent from "../../components/LoadingComponent";

const LogoutPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logout = async () => {
      try {
        await authService.logout();
        localStorage.removeItem("token");
      } catch (error) {
        console.error("Erro durante o logout:", error);
      } finally {
        setTimeout(() => {
          setLoading(false);
          navigate("/login", { replace: true });
        }, 2000);
      }
    };

    logout();
  }, [navigate]);

  if (loading) {
    return <LoadingComponent />;
  }

  return null;
};

export default LogoutPage;
