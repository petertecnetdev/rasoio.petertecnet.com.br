import React, { useContext, useMemo } from "react";
import PropTypes from "prop-types";
import { Col, Container, Row } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { AuthContext } from "../App";
import "./dashboard-v2.css";

const OverviewCard = ({ icon, eyebrow, title, text, to, cta, accent = false }) => (
  <article className={`rasoio-overview-card${accent ? " rasoio-overview-card-accent" : ""}`}>
    <div className="rasoio-overview-icon" aria-hidden="true">{icon}</div>
    <div className="rasoio-overview-eyebrow">{eyebrow}</div>
    <h2>{title}</h2>
    <p>{text}</p>
    <Link className="rasoio-overview-link" to={to}>
      {cta}<span aria-hidden="true">→</span>
    </Link>
  </article>
);

OverviewCard.propTypes = {
  icon: PropTypes.string.isRequired,
  eyebrow: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  cta: PropTypes.string.isRequired,
  accent: PropTypes.bool,
};

export default function DashboardPage() {
  const { user, isEmployer, establishments } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const name =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.name ||
    "usuário";
  const owned = Array.isArray(establishments) ? establishments : [];
  const requestedSlug = searchParams.get("establishment");
  const selected = useMemo(
    () => owned.find((establishment) => establishment.slug === requestedSlug) || null,
    [owned, requestedSlug]
  );
  const selectedName = selected?.fantasy || selected?.name || null;

  return (
    <main className="rasoio-dashboard">
      <Container className="py-4 py-lg-5">
        <header className="rasoio-dashboard-hero">
          <div>
            <span className="rasoio-dashboard-kicker">
              {selected ? "Visão geral da barbearia" : "Central Rasoio"}
            </span>
            <h1>{selected ? selectedName : `Olá, ${name}`}</h1>
            <p>
              {selected
                ? "Acesse rapidamente a agenda, equipe, serviços, produtos e configurações desta unidade."
                : "Agendamentos pessoais, operação das suas barbearias e sua agenda como profissional ficam separados para evitar ambiguidades."}
            </p>
          </div>
          <div className="rasoio-dashboard-status">
            <strong>{selected ? "1" : owned.length}</strong>
            <span>{selected ? "unidade selecionada" : owned.length === 1 ? "barbearia na Rasoio" : "barbearias na Rasoio"}</span>
          </div>
        </header>

        {selected ? (
          <section className="rasoio-overview-grid" aria-label={`Visão geral da ${selectedName}`}>
            <OverviewCard
              icon="▦"
              eyebrow="Operação"
              title="Agenda e atendimentos"
              text="Acompanhe solicitações, confirme horários e organize os atendimentos desta barbearia."
              to={`/establishment/orders/${selected.slug}`}
              cta="Abrir agenda"
              accent
            />
            <OverviewCard
              icon="👥"
              eyebrow="Equipe"
              title="Colaboradores"
              text="Gerencie quem trabalha nesta unidade e quem pode receber os próximos atendimentos."
              to={`/establishment/employers/${selected.slug}`}
              cta="Gerenciar equipe"
            />
            <OverviewCard
              icon="✂"
              eyebrow="Catálogo"
              title="Serviços"
              text="Configure serviços, duração e valores usados na agenda desta unidade."
              to={`/establishment/item/${selected.slug}`}
              cta="Gerenciar serviços"
            />
            <OverviewCard
              icon="◎"
              eyebrow="Cadastro"
              title="Dados da barbearia"
              text="Atualize informações, identidade e dados públicos desta unidade."
              to={`/establishment/update/${selected.id}`}
              cta="Abrir configurações"
            />
          </section>
        ) : (
          <section className="rasoio-overview-grid" aria-label="Visão geral dos agendamentos">
            <OverviewCard
              icon="◷"
              eyebrow="Como cliente"
              title="Meus agendamentos"
              text="Somente os horários que você marcou para receber um atendimento em uma barbearia."
              to="/orders/my"
              cta="Ver minhas reservas"
              accent
            />

            <OverviewCard
              icon="▦"
              eyebrow="Como proprietário"
              title="Minhas barbearias"
              text="Escolha uma unidade para abrir a visão geral e administrar sua operação separadamente."
              to={owned.length ? "/establishment/my" : "/establishment/create"}
              cta={owned.length ? "Escolher barbearia" : "Cadastrar barbearia"}
            />

            <OverviewCard
              icon="✂"
              eyebrow="Como profissional"
              title="Minha agenda de trabalho"
              text={isEmployer
                ? "Veja os atendimentos atribuídos diretamente ao seu perfil de colaborador."
                : "Quando você estiver vinculado como colaborador, sua agenda profissional aparecerá aqui."}
              to={isEmployer ? "/employer/orders" : "/employers"}
              cta={isEmployer ? "Abrir minha agenda" : "Conhecer profissionais"}
            />

            <OverviewCard
              icon="＋"
              eyebrow="Expansão"
              title="Nova barbearia"
              text="Cadastre outra unidade na mesma conta e mantenha equipe, serviços e agenda separados."
              to="/establishment/create"
              cta="Cadastrar nova unidade"
            />
          </section>
        )}

        {owned.length > 0 && (
          <section className="rasoio-owned-section" aria-labelledby="dashboard-barbershops-title">
            <div className="rasoio-section-heading">
              <div>
                <span>Gestão</span>
                <h2 id="dashboard-barbershops-title">Minhas barbearias</h2>
              </div>
              <Link to="/establishment/my">Ver painel completo →</Link>
            </div>

            <Row className="g-3">
              {owned.map((establishment) => (
                <Col key={establishment.id} md={6} xl={4}>
                  <article className="rasoio-owned-card">
                    <div className="rasoio-owned-card-topline">
                      <span className="rasoio-owned-dot" />
                      <span>Rasoio</span>
                    </div>
                    <h3>{establishment.fantasy || establishment.name}</h3>
                    <p>
                      {[establishment.city, establishment.uf].filter(Boolean).join(" • ") || "Localização não informada"}
                    </p>
                    <div className="rasoio-owned-actions">
                      <Link to={`/dashboard?establishment=${encodeURIComponent(establishment.slug)}`}>Visão geral</Link>
                      <Link to={`/establishment/orders/${establishment.slug}`}>Agenda</Link>
                      <Link to={`/establishment/employers/${establishment.slug}`}>Equipe</Link>
                    </div>
                  </article>
                </Col>
              ))}
            </Row>
          </section>
        )}
      </Container>
    </main>
  );
}
