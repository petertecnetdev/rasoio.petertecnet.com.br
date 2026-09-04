// src/pages/auth/RegisterPage.jsx
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
    <div className="rp">
      <div className="rp__bg">
        <div className="rp__noise" />
        <div className="rp__orb rp__orb--a" />
        <div className="rp__orb rp__orb--b" />
        <div className="rp__grid" />
      </div>

      <div className="rp__container">
        <div className="rp__layout">
          <aside className="rp__hero">
            <div className="rp__heroCard">
              <div className="rp__heroTop">
                <div className="rp__heroLogoWrap" aria-hidden="true">
                  <img
                    src="/rasoio-logo.png"
                    alt=""
                    className="rp__heroLogo"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/rasoio-logo.png";
                    }}
                  />
                </div>

                <div className="rp__heroText">
                  <h1 className="rp__heroTitle">Rasoio</h1>

                  <p className="rp__heroSubtitle">
                    Crie sua conta e eleve a gestão do seu estabelecimento para um nível
                    profissional. Centralize agenda, colaboradores, serviços e
                    produtos em uma plataforma moderna, rápida e segura.
                  </p>
                </div>
              </div>

              <div className="rp__heroInfo">
                <div className="rp__heroBadge">
                  <span className="rp__dot" />
                  Cadastro rápido • Segurança avançada • Experiência premium
                </div>

                <ul className="rp__heroList">
                  <li>
                    <span className="rp__check">✓</span>
                    <div className="rp__heroListText">
                      <b>Agenda inteligente</b> com horários, regras de atendimento e
                      controle total da disponibilidade.
                    </div>
                  </li>

                  <li>
                    <span className="rp__check">✓</span>
                    <div className="rp__heroListText">
                      <b>Equipe organizada</b> com gestão de profissionais,
                      permissões e desempenho por colaborador.
                    </div>
                  </li>

                  <li>
                    <span className="rp__check">✓</span>
                    <div className="rp__heroListText">
                      <b>Serviços e produtos</b> bem estruturados: catálogo, preços,
                      destaque e vitrine digital para o cliente.
                    </div>
                  </li>

                  <li>
                    <span className="rp__check">✓</span>
                    <div className="rp__heroListText">
                      <b>Visão de negócio</b> com métricas, relatórios e um painel
                      feito para apoiar a operação e o crescimento.
                    </div>
                  </li>
                </ul>

                <div className="rp__heroStats">
                  <div className="rp__stat">
                    <div className="rp__statValue">+10x</div>
                    <div className="rp__statLabel">mais organização</div>
                  </div>

                  <div className="rp__stat">
                    <div className="rp__statValue">24/7</div>
                    <div className="rp__statLabel">agendamentos</div>
                  </div>

                  <div className="rp__stat">
                    <div className="rp__statValue">100%</div>
                    <div className="rp__statLabel">online e seguro</div>
                  </div>
                </div>

                <div className="rp__heroFootnote">
                  <span className="rp__shield" aria-hidden="true">
                    🔐
                  </span>
                  Seus dados são protegidos e seu cadastro é confirmado por e-mail.
                </div>
              </div>
            </div>
          </aside>

          <main className="rp__main">
            <div className="rp__card">
              <header className="rp__cardHeader">
                <div className="rp__logoWrap">
                  <img
                    src="/rasoio-logo.png"
                    alt="Rasoio"
                    className="rp__logo"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/rasoio-logo.png";
                    }}
                  />
                </div>

                <h2 className="rp__title">Criar conta</h2>
                <p className="rp__subtitle">
                  Cadastre-se para começar a usar a Rasoio.
                </p>
              </header>

              <section className="rp__cardBody">
                <RegisterFormComponent onSuccess={handleSuccess} />
              </section>

              <footer className="rp__cardFooter">
                <div className="rp__footerLine" />

                <div className="rp__links">
                  <a className="rp__linkSecondary" href="/password-email">
                    Recuperar senha
                  </a>
                </div>

                <div className="rp__footerText">
                  Já possui uma conta?
                  <button
                    type="button"
                    className="rp__linkPrimary"
                    onClick={() => navigate("/login")}
                  >
                    Entrar
                  </button>
                </div>
              </footer>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
