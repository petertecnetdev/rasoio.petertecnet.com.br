import React from "react";
import { useNavigate } from "react-router-dom";
import RegisterFormComponent from "../../components/auth/RegisterFormComponent";

import "./RegisterPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/login", { replace: true });
  };

  return (
    <>

      <div className="rp-wrapper">
        {/* Glow de fundo */}
        <div className="rp-bg-effect" />

        <div className="rp-content">
          <div className="rp-card">
            {/* HEADER */}
            <div className="rp-card__header">
              <div className="rp-logo-wrapper">
                <img
                  src="/images/logo.png"
                  alt="Rasoio"
                  className="rp-logo"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/images/logo.gif";
                  }}
                />
              </div>

              <h1 className="rp-title">Criar conta</h1>
              <p className="rp-subtitle">
                Cadastre-se para começar a usar a Inkap
              </p>
            </div>

            {/* BODY */}
            <div className="rp-card__body">
              <RegisterFormComponent onSuccess={handleSuccess} />
            </div>

            {/* LINKS SECUNDÁRIOS */}
            <div className="auth-links">
              <a
                href="/password-email"
                className="auth-link-secondary"
              >
                Recuperar senha
              </a>
            </div>

            {/* FOOTER */}
            <div className="auth-footer">
              Já possui uma conta?
              <button
                type="button"
                className="auth-link-primary"
                onClick={() => navigate("/login")}
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
