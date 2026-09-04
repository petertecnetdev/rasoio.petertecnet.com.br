import React from "react";
import { useNavigate } from "react-router-dom";

import GlobalNav from "../../components/GlobalNav";
import InviteCompleteFormComponent from "../../components/auth/InviteCompleteFormComponent";

import "./InviteCompletePage.css";

export default function InviteCompletePage() {
  const navigate = useNavigate();

  return (
    <>
      <GlobalNav />

      <div className="ic-wrapper">
        <div className="ic-bg-effect" />

        <div className="ic-content">
          <div className="ic-card">
            {/* HEADER */}
            <div className="ic-card__header">
              <div className="ic-logo-wrapper">
                <img
                  src="/rasoio-logo.png"
                  alt="Rasoio"
                  className="ic-logo"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/rasoio-logo.png";
                  }}
                />
              </div>

              <h1 className="ic-title">Finalizar convite</h1>
              <p className="ic-subtitle">
                Defina sua senha para concluir o acesso
              </p>
            </div>

            {/* BODY */}
            <div className="ic-card__body">
              <InviteCompleteFormComponent redirectTo="/login" />
            </div>

            {/* FOOTER */}
            <div className="ic-footer">
              <button
                type="button"
                className="ic-link"
                onClick={() => navigate("/login")}
              >
                Voltar ao login
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
