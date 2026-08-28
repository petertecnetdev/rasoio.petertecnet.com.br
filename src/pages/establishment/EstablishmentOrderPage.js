// src/pages/establishment/EstablishmentOrderPage.js
import React, { useMemo, useState } from "react";
import { Alert, Col, Container, Row, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import GlobalButton from "../../components/GlobalButton";
import GlobalOrderCard from "../../components/GlobalOrderCard";
import useEstablishmentOrdersBySlug from "../../hooks/useEstablishmentOrdersBySlug";
import "./EstablishmentOrderPage.css";

const normalizeStatus = (order) =>
  String(order?.appointment_status || order?.status || "").toLowerCase();

export default function EstablishmentOrderPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const { establishment, orders, loading, apiError } =
    useEstablishmentOrdersBySlug(slug);

  const summary = useMemo(() => {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);

    return orders.reduce(
      (acc, order) => {
        const status = normalizeStatus(order);
        const dateValue = order?.order_datetime || order?.date || order?.created_at;
        const orderDate = dateValue ? new Date(dateValue) : null;
        const isToday =
          orderDate && !Number.isNaN(orderDate.getTime())
            ? orderDate.toISOString().slice(0, 10) === todayKey
            : false;

        acc.total += 1;
        if (["pending", "waiting", "requested"].includes(status)) acc.pending += 1;
        if (["confirmed", "approved"].includes(status)) acc.confirmed += 1;
        if (["completed", "finished", "done"].includes(status)) acc.completed += 1;
        if (isToday) acc.today += 1;
        return acc;
      },
      { total: 0, pending: 0, confirmed: 0, completed: 0, today: 0 }
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;
    if (filter === "today") {
      const todayKey = new Date().toISOString().slice(0, 10);
      return orders.filter((order) => {
        const value = order?.order_datetime || order?.date || order?.created_at;
        const parsed = value ? new Date(value) : null;
        return parsed && !Number.isNaN(parsed.getTime())
          ? parsed.toISOString().slice(0, 10) === todayKey
          : false;
      });
    }

    return orders.filter((order) => {
      const status = normalizeStatus(order);
      if (filter === "pending") return ["pending", "waiting", "requested"].includes(status);
      if (filter === "confirmed") return ["confirmed", "approved"].includes(status);
      if (filter === "completed") return ["completed", "finished", "done"].includes(status);
      return true;
    });
  }, [filter, orders]);

  if (loading) {
    return (
      <Container className="py-5 text-center" aria-live="polite">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (apiError || !establishment) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          {apiError || "Barbearia não encontrada ou você não possui acesso a ela."}
        </Alert>
      </Container>
    );
  }

  const summaryCards = [
    ["all", "Total", summary.total],
    ["today", "Hoje", summary.today],
    ["pending", "Pendentes", summary.pending],
    ["confirmed", "Confirmados", summary.confirmed],
    ["completed", "Concluídos", summary.completed],
  ];

  return (
    <main className="establishment-agenda-page">
      <EstablishmentHero
        entity={establishment}
        title={`Agenda da ${establishment.fantasy || establishment.name}`}
        subtitle="Agenda operacional da barbearia"
        description="Aqui aparecem os agendamentos recebidos por esta barbearia, inclusive os atendimentos atribuídos aos colaboradores da equipe."
        showBack
      />

      <Container className="py-4 py-lg-5">
        <section className="agenda-command-center">
          <header className="agenda-command-header">
            <div>
              <span>Resumo operacional</span>
              <h2>Agendamentos da barbearia</h2>
              <p>
                Esta visão pertence ao estabelecimento. Para os seus agendamentos como cliente, use “Meus agendamentos”.
              </p>
            </div>
            <div className="agenda-command-actions">
              <GlobalButton
                variant="outline-light"
                size="md"
                onClick={() => navigate(`/establishment/employers/${slug}`)}
              >
                Equipe
              </GlobalButton>
              <GlobalButton
                variant="primary"
                size="md"
                rounded
                onClick={() => navigate(`/order/create/${slug}`)}
              >
                Novo atendimento
              </GlobalButton>
            </div>
          </header>

          <div className="agenda-summary-grid" role="group" aria-label="Filtros da agenda">
            {summaryCards.map(([key, label, value]) => (
              <button
                type="button"
                key={key}
                onClick={() => setFilter(key)}
                className={`agenda-summary-card${filter === key ? " active" : ""}`}
              >
                <strong>{value}</strong>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="agenda-results-heading">
          <div>
            <span>Exibindo</span>
            <strong>{filteredOrders.length} atendimento{filteredOrders.length === 1 ? "" : "s"}</strong>
          </div>
          <button type="button" onClick={() => navigate("/orders/my")}>Meus agendamentos →</button>
        </div>

        {filteredOrders.length === 0 ? (
          <Alert variant="info">Nenhum atendimento encontrado neste filtro.</Alert>
        ) : (
          <Row className="g-4">
            {filteredOrders.map((order) => (
              <Col key={order.id} xs={12} md={6} lg={4}>
                <GlobalOrderCard order={order} />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </main>
  );
}
