// src/pages/establishment/EstablishmentOrderPage.js
import React from "react";
import { Alert, Col, Container, Row, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import GlobalButton from "../../components/GlobalButton";
import GlobalOrderCard from "../../components/GlobalOrderCard";
import useEstablishmentOrdersBySlug from "../../hooks/useEstablishmentOrdersBySlug";

export default function EstablishmentOrderPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { establishment, orders, loading, apiError } =
    useEstablishmentOrdersBySlug(slug);

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

  return (
    <Container className="py-4">
      <EstablishmentHero
        entity={establishment}
        title={`Atendimentos da ${establishment.fantasy || establishment.name}`}
        subtitle="Histórico e gestão da operação"
        description="Acompanhe agendamentos e pedidos, consulte status e registre novos atendimentos."
        showBack
      />

      <div className="d-flex justify-content-end my-4">
        <GlobalButton
          variant="primary"
          size="md"
          rounded
          onClick={() => navigate(`/order/create/${slug}`)}
        >
          Novo atendimento
        </GlobalButton>
      </div>

      {orders.length === 0 ? (
        <Alert variant="info">Nenhum atendimento encontrado para esta barbearia.</Alert>
      ) : (
        <Row className="g-4">
          {orders.map((order) => (
            <Col key={order.id} xs={12} md={6} lg={4}>
              <GlobalOrderCard order={order} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}
