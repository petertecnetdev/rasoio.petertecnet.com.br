import React, { useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Col, Container, Row } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { AuthContext } from "../App";
import { getAppointmentDashboard } from "../services/platformManagementApi";
import { createSubscriptionIntent } from "../services/subscriptionIntent";
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

const personName = (person, fallback = "Não informado") =>
  [person?.first_name, person?.last_name].filter(Boolean).join(" ") || person?.user_name || fallback;

function LiveOperations({ selected }) {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(true);

  useEffect(() => {
    let active = true;
    let timer;

    const load = async (silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        const data = await getAppointmentDashboard(selected.slug);
        if (!active) return;
        setSnapshot(data || null);
        setError("");
      } catch (requestError) {
        if (!active) return;
        setError(
          requestError?.response?.data?.message ||
            requestError?.response?.data?.error ||
            "Não foi possível atualizar os indicadores do estabelecimento."
        );
      } finally {
        if (active && !silent) setRefreshing(false);
      }
    };

    load();
    timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, 10000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") load(true);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [selected.slug]);

  const summary = snapshot?.summary || {};
  const timeline = Array.isArray(snapshot?.timeline) ? snapshot.timeline : [];
  const maxValue = Math.max(1, ...timeline.flatMap((point) => [Number(point.scheduled || 0), Number(point.completed || 0)]));
  const updatedAt = snapshot?.updated_at ? new Date(snapshot.updated_at) : null;
  const next = snapshot?.next_appointment || null;

  return (
    <section className="live-ops" aria-live="polite">
      <div className="live-ops-heading">
        <div>
          <span className="rasoio-dashboard-kicker">Operação de hoje</span>
          <h2>Agendamentos e atendimentos em tempo real</h2>
          <p>Atualização automática a cada 10 segundos enquanto esta tela estiver aberta.</p>
        </div>
        <div className="live-status">
          <span className="live-status-dot" />
          <strong>{refreshing && !snapshot ? "Conectando..." : "Atualização automática"}</strong>
          <small>{updatedAt ? `Última leitura ${updatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Aguardando primeira leitura"}</small>
        </div>
      </div>

      {error && <div className="live-error">{error}</div>}

      <div className="live-metrics">
        <div><span>Total do dia</span><strong>{summary.total ?? 0}</strong></div>
        <div><span>Solicitados</span><strong>{summary.pending ?? 0}</strong></div>
        <div><span>Confirmados</span><strong>{summary.confirmed ?? 0}</strong></div>
        <div className="live-metric-hot"><span>Em atendimento agora</span><strong>{summary.in_progress ?? 0}</strong></div>
        <div><span>Concluídos</span><strong>{summary.completed ?? 0}</strong></div>
        <div><span>Cancelados/recusados</span><strong>{summary.cancelled ?? 0}</strong></div>
      </div>

      <div className="live-ops-grid">
        <article className="live-chart-card">
          <header>
            <div>
              <span>Fluxo por horário</span>
              <h3>Movimento do estabelecimento hoje</h3>
            </div>
            <div className="live-chart-legend">
              <span><i className="legend-dot legend-dot-scheduled" />Agendamentos</span>
              <span><i className="legend-dot legend-dot-completed" />Concluídos</span>
            </div>
          </header>

          <div className="live-chart" role="img" aria-label="Gráfico de agendamentos e atendimentos concluídos por horário">
            {timeline.map((point) => (
              <div className="live-chart-column" key={point.hour}>
                <div className="live-chart-bars">
                  <span
                    className="live-bar live-bar-scheduled"
                    style={{ height: `${Math.max(4, (Number(point.scheduled || 0) / maxValue) * 100)}%` }}
                    title={`${point.hour}: ${point.scheduled || 0} agendamentos`}
                  />
                  <span
                    className="live-bar live-bar-completed"
                    style={{ height: `${Math.max(4, (Number(point.completed || 0) / maxValue) * 100)}%` }}
                    title={`${point.hour}: ${point.completed || 0} concluídos`}
                  />
                </div>
                <small>{point.hour}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="live-next-card">
          <span>Próximo atendimento</span>
          {next ? (
            <>
              <strong>{new Date(next.order_datetime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</strong>
              <h3>{personName(next.client, "Cliente")}</h3>
              <p>Profissional: {personName(next.attendant, "A definir")}</p>
              <small>{next.total_duration || 30} min · #{next.order_number || next.id}</small>
              <Link to={`/order/view/${next.id}`}>Abrir atendimento →</Link>
            </>
          ) : (
            <div className="live-next-empty">Nenhum próximo atendimento ativo para hoje.</div>
          )}
        </article>
      </div>
    </section>
  );
}

LiveOperations.propTypes = {
  selected: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }).isRequired,
};

export default function DashboardPage() {
  const { user, isEmployer, establishments } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const planCode = String(searchParams.get("plan") || "").trim();
  const name =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.name ||
    "usuário";
  const owned = useMemo(
    () => (Array.isArray(establishments) ? establishments : []),
    [establishments]
  );
  const requestedSlug = searchParams.get("establishment");
  const selected = useMemo(
    () => owned.find((establishment) => establishment.slug === requestedSlug) || null,
    [owned, requestedSlug]
  );
  const selectedName = selected?.fantasy || selected?.name || null;

  useEffect(() => {
    if (!/^[a-z0-9_-]{1,80}$/i.test(planCode)) return;

    let pending = null;
    try {
      pending = JSON.parse(localStorage.getItem("pending_subscription_plan") || "null");
    } catch {
      return;
    }

    const selectedAt = pending?.selected_at ? Date.parse(pending.selected_at) : NaN;
    const isFresh = Number.isFinite(selectedAt) && Date.now() - selectedAt <= 7 * 24 * 60 * 60 * 1000;
    if (pending?.application !== "rasoio" || pending?.plan !== planCode || !isFresh) return;
    if (pending?.intent_id) return;

    let active = true;
    createSubscriptionIntent({
      planCode,
      priceCents: pending.price_cents ?? null,
      currency: pending.currency || "BRL",
      source: pending.source || "subscription_plans",
      handoff: pending.handoff || "app",
      page: window.location.pathname,
    }).then((intent) => {
      if (!active || !intent?.id) return;
      localStorage.setItem(
        "pending_subscription_plan",
        JSON.stringify({
          ...pending,
          intent_id: intent.id,
          intent_status: intent.status,
          price_cents: intent.price_cents ?? pending.price_cents ?? null,
          currency: intent.currency || pending.currency || "BRL",
        })
      );
    });

    return () => {
      active = false;
    };
  }, [planCode]);

  return (
    <main className="rasoio-dashboard">
      <Container className="py-4 py-lg-5">
        <header className="rasoio-dashboard-hero">
          <div>
            <span className="rasoio-dashboard-kicker">
              {selected ? "Visão geral do estabelecimento" : "Central Rasoio"}
            </span>
            <h1>{selected ? selectedName : `Olá, ${name}`}</h1>
            <p>
              {selected
                ? "Acompanhe a operação desta unidade, o movimento do dia e acesse rapidamente equipe, agenda e serviços."
                : "Agendamentos pessoais, operação dos seus estabelecimentos e sua agenda como profissional ficam separados para evitar ambiguidades."}
            </p>
          </div>
          <div className="rasoio-dashboard-status">
            <strong>{selected ? "1" : owned.length}</strong>
            <span>{selected ? "unidade selecionada" : owned.length === 1 ? "estabelecimento na Rasoio" : "estabelecimentos na Rasoio"}</span>
          </div>
        </header>

        {selected && <LiveOperations selected={selected} />}

        {selected ? (
          <section className="rasoio-overview-grid" aria-label={`Visão geral de ${selectedName}`}>
            <OverviewCard icon="▦" eyebrow="Operação" title="Agenda e atendimentos" text="Acompanhe solicitações, confirme horários e organize os atendimentos deste estabelecimento." to={`/establishment/orders/${selected.slug}`} cta="Abrir agenda" accent />
            <OverviewCard icon="👥" eyebrow="Equipe" title="Colaboradores" text="Gerencie quem trabalha nesta unidade e quem pode receber os próximos atendimentos." to={`/establishment/employers/${selected.slug}`} cta="Gerenciar equipe" />
            <OverviewCard icon="✂" eyebrow="Catálogo" title="Serviços" text="Configure serviços, duração e valores usados na agenda desta unidade." to={`/establishment/item/${selected.slug}`} cta="Gerenciar serviços" />
            <OverviewCard icon="◎" eyebrow="Cadastro" title="Dados do estabelecimento" text="Atualize informações, identidade e dados públicos desta unidade." to={`/establishment/update/${selected.id}`} cta="Abrir configurações" />
          </section>
        ) : (
          <section className="rasoio-overview-grid" aria-label="Visão geral dos agendamentos">
            <OverviewCard icon="◷" eyebrow="Como cliente" title="Meus agendamentos" text="Somente os horários que você marcou para receber um atendimento." to="/orders/my" cta="Ver minhas reservas" accent />
            <OverviewCard icon="▦" eyebrow="Como proprietário" title="Meus estabelecimentos" text="Escolha uma unidade para abrir a visão geral e administrar sua operação separadamente." to={owned.length ? "/establishment/my" : "/establishment/create"} cta={owned.length ? "Escolher estabelecimento" : "Cadastrar estabelecimento"} />
            <OverviewCard icon="✂" eyebrow="Como profissional" title="Minha agenda de trabalho" text={isEmployer ? "Veja os atendimentos atribuídos diretamente ao seu perfil de colaborador." : "Quando você estiver vinculado como colaborador, sua agenda profissional aparecerá aqui."} to={isEmployer ? "/employer/orders" : "/employers"} cta={isEmployer ? "Abrir minha agenda" : "Conhecer profissionais"} />
            <OverviewCard icon="＋" eyebrow="Expansão" title="Nova unidade" text="Cadastre outra unidade na mesma conta e mantenha equipe, serviços e agenda separados." to="/establishment/create" cta="Cadastrar nova unidade" />
          </section>
        )}

        {owned.length > 0 && (
          <section className="rasoio-owned-section" aria-labelledby="dashboard-establishments-title">
            <div className="rasoio-section-heading">
              <div><span>Gestão</span><h2 id="dashboard-establishments-title">Meus estabelecimentos</h2></div>
              <Link to="/establishment/my">Ver painel completo →</Link>
            </div>

            <Row className="g-3">
              {owned.map((establishment) => (
                <Col key={establishment.id} md={6} xl={4}>
                  <article className="rasoio-owned-card">
                    <div className="rasoio-owned-card-topline"><span className="rasoio-owned-dot" /><span>Rasoio</span></div>
                    <h3>{establishment.fantasy || establishment.name}</h3>
                    <p>{[establishment.city, establishment.uf].filter(Boolean).join(" • ") || "Localização não informada"}</p>
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
