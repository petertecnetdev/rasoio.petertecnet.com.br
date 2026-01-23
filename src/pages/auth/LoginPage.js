// src/pages/auth/LoginPage.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiBaseUrl, appId } from "../../config";

import "./LoginPage.css";

import LoginFormComponent from "../../components/auth/LoginFormComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [processing, setProcessing] = useState(false);

  const from = location?.state?.from?.pathname || "/";

  const handleSuccess = () => {
    navigate(from, { replace: true });
  };

  // 🔒 BLOQUEIO TOTAL DA UI
  if (processing) {
    return (
      <ProcessingIndicatorComponent
        gifSrc="/images/logo.gif"
        minDuration={900}
      />
    );
  }

  return (
    <div className="lp">
      {/* efeitos de fundo */}
      <div className="lp__bg">
        <div className="lp__noise" />
        <div className="lp__orb lp__orb--a" />
        <div className="lp__orb lp__orb--b" />
        <div className="lp__grid" />
      </div>

      <div className="lp__container">
        <div className="lp__layout">
          {/* BRAND / HERO */}
          <aside className="lp__hero">
            <div className="lp__heroCard">
              {/* TOP */}
              <div className="lp__heroTop">
                <div className="lp__heroLogoWrap" aria-hidden="true">
                  <img
                    src="/images/logo.png"
                    alt=""
                    className="lp__heroLogo"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/logo.gif";
                    }}
                  />
                </div>

                <div className="lp__heroText">
                  <h1 className="lp__heroTitle">Rasoio</h1>

                  <p className="lp__heroSubtitle">
                    A plataforma premium para barbearias que querem organização,
                    velocidade e crescimento. Tudo em um único painel: agenda,
                    equipe, serviços, produtos e performance.
                  </p>
                </div>
              </div>

              {/* INFO */}
              <div className="lp__heroInfo">
                <div className="lp__heroBadge">
                  <span className="lp__dot" />
                  Plataforma segura • Login criptografado • Acesso rápido
                </div>

                {/* lista rica */}
                <ul className="lp__heroList">
                  <li>
                    <span className="lp__check">✓</span>
                    <div className="lp__heroListText">
                      <b>Agendamento inteligente</b> por profissional, com horários
                      organizados e controle de disponibilidade.
                    </div>
                  </li>

                  <li>
                    <span className="lp__check">✓</span>
                    <div className="lp__heroListText">
                      <b>Controle comercial</b> com serviços e produtos, vitrine
                      digital e gestão de preços.
                    </div>
                  </li>

                  <li>
                    <span className="lp__check">✓</span>
                    <div className="lp__heroListText">
                      <b>Experiência premium</b> rápida, responsiva e moderna —
                      feita para funcionar liso no mobile e no desktop.
                    </div>
                  </li>

                  <li>
                    <span className="lp__check">✓</span>
                    <div className="lp__heroListText">
                      <b>Relatórios e métricas</b> para acompanhar crescimento e
                      otimizar resultados do negócio.
                    </div>
                  </li>
                </ul>

                {/* stats */}
                <div className="lp__heroStats">
                  <div className="lp__stat">
                    <div className="lp__statValue">+3x</div>
                    <div className="lp__statLabel">mais produtividade</div>
                  </div>

                  <div className="lp__stat">
                    <div className="lp__statValue">0%</div>
                    <div className="lp__statLabel">burocracia</div>
                  </div>

                  <div className="lp__stat">
                    <div className="lp__statValue">100%</div>
                    <div className="lp__statLabel">focado no cliente</div>
                  </div>
                </div>

                {/* rodapé hero */}
                <div className="lp__heroFootnote">
                  <span className="lp__shield" aria-hidden="true">
                    🔐
                  </span>
                  Seu acesso é protegido e os dados do sistema são tratados com
                  segurança.
                </div>
              </div>
            </div>
          </aside>

          {/* LOGIN CARD */}
          <main className="lp__main">
            <div className="lp__card">
              <header className="lp__cardHeader">
                <div className="lp__logoWrap">
                  <img
                    src="/images/logo.png"
                    alt="Rasoio"
                    className="lp__logo"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/logo.gif";
                    }}
                  />
                </div>

                <h2 className="lp__title">Bem-vindo de volta</h2>
                <p className="lp__subtitle">
                  Entre para gerenciar seus agendamentos, barbearias, produtos e
                  serviços.
                </p>
              </header>

              <section className="lp__cardBody">
                <LoginFormComponent
                  onStart={() => setProcessing(true)}
                  onSuccess={handleSuccess}
                  onError={() => setProcessing(false)}
                  redirectTo={from}
                  apiBaseUrl={apiBaseUrl}
                  appId={appId}
                />
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
