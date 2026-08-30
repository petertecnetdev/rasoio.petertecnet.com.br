// src/pages/auth/LoginPage.js
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoginFormComponent from "../../components/auth/LoginFormComponent";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = location?.state?.from;
  const from =
    typeof fromState === "string"
      ? fromState
      : fromState?.pathname
        ? `${fromState.pathname}${fromState.search || ""}${fromState.hash || ""}`
        : "/";
  const resumeAppointment = Boolean(location?.state?.resumeAppointment);

  const handleSuccess = () => {
    navigate(from, {
      replace: true,
      state: resumeAppointment ? { resumeAppointment: true } : undefined,
    });
  };

  return (
    <div className="lp">
      <div className="lp__bg" aria-hidden="true">
        <div className="lp__noise" />
        <div className="lp__orb lp__orb--a" />
        <div className="lp__orb lp__orb--b" />
        <div className="lp__grid" />
      </div>

      <div className="lp__container">
        <div className="lp__layout">
          <aside className="lp__hero">
            <div className="lp__heroCard">
              <div className="lp__heroTop">
                <div className="lp__heroLogoWrap" aria-hidden="true">
                  <img
                    src="/images/logo.png"
                    alt=""
                    className="lp__heroLogo"
                    draggable={false}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "/images/logo.gif";
                    }}
                  />
                </div>

                <div className="lp__heroText">
                  <h1 className="lp__heroTitle">Rasoio</h1>
                  <p className="lp__heroSubtitle">
                    Gestão e agendamento para barbearias, barbeiros e clientes em
                    um só lugar.
                  </p>
                </div>
              </div>

              <div className="lp__heroInfo">
                <div className="lp__heroBadge">
                  <span className="lp__dot" />
                  Agenda • equipe • serviços • clientes
                </div>

                <ul className="lp__heroList">
                  <li>
                    <span className="lp__check">✓</span>
                    <div className="lp__heroListText">
                      <b>Agenda organizada</b> por profissional, com horários e
                      disponibilidade em um só fluxo.
                    </div>
                  </li>
                  <li>
                    <span className="lp__check">✓</span>
                    <div className="lp__heroListText">
                      <b>Gestão da barbearia</b> com equipe, serviços, produtos e
                      atendimentos.
                    </div>
                  </li>
                  <li>
                    <span className="lp__check">✓</span>
                    <div className="lp__heroListText">
                      <b>Área do barbeiro</b> para acompanhar agenda e rotina de
                      atendimento.
                    </div>
                  </li>
                  <li>
                    <span className="lp__check">✓</span>
                    <div className="lp__heroListText">
                      <b>Experiência do cliente</b> para encontrar barbearias,
                      profissionais e agendar rapidamente.
                    </div>
                  </li>
                </ul>

                <div className="lp__heroFootnote">
                  <span className="lp__shield" aria-hidden="true">🔐</span>
                  Seu acesso é protegido e os dados são enviados com conexão segura.
                </div>
              </div>
            </div>
          </aside>

          <main className="lp__main">
            <div className="lp__card">
              <header className="lp__cardHeader">
                <div className="lp__logoWrap">
                  <img
                    src="/images/logo.png"
                    alt="Rasoio"
                    className="lp__logo"
                    draggable={false}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "/images/logo.gif";
                    }}
                  />
                </div>
                <h2 className="lp__title">Bem-vindo de volta</h2>
                <p className="lp__subtitle">
                  {resumeAppointment
                    ? "Entre para continuar seu agendamento de onde parou."
                    : "Entre para acessar seus agendamentos e recursos de gestão."}
                </p>
              </header>

              <section className="lp__cardBody">
                <LoginFormComponent onSuccess={handleSuccess} />
              </section>

              <footer className="lp__cardFooter">
                <div className="lp__footerLine" />
                <small className="lp__footerText">
                  Ao entrar, você concorda com as políticas de uso e privacidade
                  do sistema.
                </small>
              </footer>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
