// src/components/NavlogComponent.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "react-bootstrap";
import { storageUrl, apiBaseUrl } from "../config";
import axios from "axios";

const NavlogComponent = () => {
  const [user, setUser] = useState(null);
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
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const headers = { Authorization: `Bearer ${token}` };
          const { data } = await axios.get(`${apiBaseUrl}/auth/me`, { headers });
          setUser(data.user);
        } catch {
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
      setLoadingMenu(false);
    };
    fetchUserData();
  }, []);

  const handleImageError = e => {
    e.target.onerror = null;
    e.target.src = "/images/user.png";
  };

  const toggleMobile = () => setShowMobileMenu(v => !v);
  const toggleCorp   = () => setShowCorporateSubmenu(v => !v);
  const toggleAdmin  = () => setShowAdminSubmenu(v => !v);
  const toggleBarber = () => setShowBarberSubmenu(v => !v);

  return (
    <>
      <Navbar expand="lg" sticky="top" bg="dark" variant="dark" className="px-3">
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
          <img src="/images/logo.png" alt="Logo" style={{ height: "40px" }} />
        </Navbar.Brand>
        <button onClick={toggleMobile} style={{ background: "none", border: "none", fontSize: "1.8rem", color: "#fff" }}>
          ☰
        </button>
      </Navbar>

      {showMobileMenu && (
        <div
          style={{
            position: "fixed", top: 0, left: 0,
            width: "100vw", height: "100vh",
            backgroundColor: "#000", zIndex: 1050,
            padding: "20px", overflowY: "auto",
            display: "flex", flexDirection: "column", alignItems: "center"
          }}
        >
          <button onClick={toggleMobile} style={{ background: "none", border: "none", fontSize: "2rem", color: "#fff", alignSelf: "flex-end" }}>
            ×
          </button>

          {loading || loadingMenu ? (
            <p style={{ color: "#fff" }}>Carregando...</p>
          ) : user ? (
            <>
              <img
                src={user.avatar ? `${storageUrl}/${user.avatar}` : "/images/user.png"}
                onError={handleImageError}
                alt={user.first_name}
                style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "50%", marginBottom: "10px" }}
              />
              <h5 style={{ color: "#fff" }}>{user.first_name}</h5>
              <div style={{ marginTop: "30px", display: "flex", flexDirection: "column", gap: "20px", alignItems: "center" }}>
                <Link to="/user/update" onClick={toggleMobile} style={{ color: "#fff", textDecoration: "none" }}>Gerenciar Conta</Link>
                <Link to="/appointment/my" onClick={toggleMobile} style={{ color: "#fff", textDecoration: "none" }}>Meus Agendamentos</Link>

                {user.profile?.name === "Gerente de Barbearia" && (
                  <>
                    <button onClick={toggleCorp} style={{ background: "none", border: "none", color: "#fff", textAlign: "left", width: "100%" }}>
                      Corporativo {showCorporateSubmenu ? "▲" : "▼"}
                    </button>
                    {showCorporateSubmenu && (
                      <div style={{ paddingLeft: "15px", marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <Link to="/barbershop" onClick={toggleMobile} style={{ color: "#fff", textDecoration: "none" }}>Minhas Barbearias</Link>
                      </div>
                    )}
                  </>
                )}

                {user.profile?.name === "Administrador" && (
                  <>
                    <button onClick={toggleAdmin} style={{ background: "none", border: "none", color: "#fff", textAlign: "left", width: "100%", marginTop: "15px" }}>
                      Administrativo {showAdminSubmenu ? "▲" : "▼"}
                    </button>
                    {showAdminSubmenu && (
                      <div style={{ paddingLeft: "15px", marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <Link to="/user/list" onClick={toggleMobile} style={{ color: "#fff", textDecoration: "none" }}>Usuários</Link>
                        <Link to="/barber/list" onClick={toggleMobile} style={{ color: "#fff", textDecoration: "none" }}>Barbeiros</Link>
                        <Link to="/service/list" onClick={toggleMobile} style={{ color: "#fff", textDecoration: "none" }}>Serviços</Link>
                        <Link to="/appointments/list" onClick={toggleMobile} style={{ color: "#fff", textDecoration: "none" }}>Agendamentos</Link>
                      </div>
                    )}
                  </>
                )}

                {user.is_barber && (
                  <>
                    <button onClick={toggleBarber} style={{ background: "none", border: "none", color: "#fff", textAlign: "left", width: "100%", marginTop: "15px" }}>
                      Área do Barbeiro {showBarberSubmenu ? "▲" : "▼"}
                    </button>
                    {showBarberSubmenu && (
                      <div style={{ paddingLeft: "15px", marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <Link to={`/service-record/barber/${user.user_name}`} onClick={toggleMobile} style={{ color: "#fff", textDecoration: "none" }}>
                          Meus Atendimentos
                        </Link>
                        <Link to={`/appointment/barber/${user.user_name}`} onClick={toggleMobile} style={{ color: "#fff", textDecoration: "none" }}>
                          Agendamentos de Clientes
                        </Link>
                      </div>
                    )}
                  </>
                )}

                <Link to="/logout" onClick={toggleMobile} style={{ color: "#fff", textDecoration: "none" }}>Sair</Link>
              </div>
            </>
          ) : (
            <div style={{ marginTop: "30px", display: "flex", flexDirection: "column", gap: "20px", alignItems: "center" }}>
              <Link to="/login" onClick={toggleMobile} style={{ color: "#fff", textDecoration: "none" }}>Login</Link>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default NavlogComponent;
