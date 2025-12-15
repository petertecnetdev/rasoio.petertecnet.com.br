// src/pages/employer/EmployerOrdersPage.jsx
import React from "react";
import {
  Container,
  Row,
  Col,
  Spinner,
  Alert,
  Card,
  Badge,
  ListGroup,
  Button,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import GlobalNav from "../../components/GlobalNav";
import EmployerHero from "../../components/employer/EmployerHero";
import useEmployerOrders from "../../hooks/useEmployerOrders";

export default function EmployerOrdersPage() {
  const {
    orders,
    employer,
    loading,
    apiError,
    actionLoading,
    updateOrderStatus,
  } = useEmployerOrders();

  const fmtBRL = (v) =>
    Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const fmtDateTime = (v) =>
    v ? new Date(v).toLocaleString("pt-BR") : "-";

  const now = new Date();

  if (loading) {
    return (
      <>
        <GlobalNav />
        <Container className="py-5 text-center">
          <Spinner animation="border" />
        </Container>
      </>
    );
  }

  if (!employer) {
    return (
      <>
        <GlobalNav />
        <Container className="py-4">
          <Alert variant="warning">
            Colaborador não encontrado ou não vinculado.
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <GlobalNav />

      <Container className="py-4">
        <EmployerHero
          title="Meus Atendimentos"
          subtitle="Agendamentos e pedidos vinculados a você"
          icon="bi-calendar-check-fill"
          badge="Painel do Profissional"
        />

        {apiError && <Alert variant="danger">{apiError}</Alert>}

        {orders.length === 0 && (
          <Alert variant="secondary">Nenhum atendimento encontrado.</Alert>
        )}

        {orders.map((order) => {
          const start = order.scheduled_start
            ? new Date(order.scheduled_start)
            : null;
          const end = order.scheduled_end
            ? new Date(order.scheduled_end)
            : null;

          const canConfirm =
            order.type === "appointment" &&
            order.appointment_status === "pending" &&
            start &&
            now < start;

          const canFinish =
            order.type === "appointment" &&
            order.appointment_status === "confirmed" &&
            end &&
            now >= end;

          const canCancelBeforeStart =
            order.type === "appointment" &&
            ["pending", "confirmed"].includes(order.appointment_status) &&
            start &&
            now < start;

          const statusLabel = {
            pending: "Pendente",
            confirmed: "Confirmado",
            attended: "Atendido",
            not_attended: "Não atendido",
            cancelled: "Cancelado",
          }[order.appointment_status] || order.appointment_status;

          return (
            <Card
              key={order.id}
              className="mb-4"
              style={{
                background: "#0b1220",
                border: "1px solid rgba(148,163,184,.12)",
                borderRadius: 14,
              }}
            >
              <Card.Body>
                <Row className="mb-2 align-items-center">
                  <Col md={4} style={{ color: "#e5e7eb", fontWeight: 600 }}>
                    #{order.order_number}
                    <div style={{ fontSize: 13, color: "#94a3b8" }}>
                      {fmtDateTime(order.created_at)}
                    </div>
                  </Col>

                  <Col md={4}>
                    <Badge
                      bg={
                        order.appointment_status === "confirmed"
                          ? "primary"
                          : order.appointment_status === "attended"
                          ? "success"
                          : order.appointment_status === "cancelled"
                          ? "danger"
                          : "secondary"
                      }
                    >
                      {statusLabel}
                    </Badge>
                  </Col>

                  <Col
                    md={4}
                    className="text-md-end"
                    style={{ color: "#e5e7eb", fontWeight: 600 }}
                  >
                    {fmtBRL(order.total_price)}
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6} style={{ color: "#e5e7eb" }}>
                    Cliente:{" "}
                    {order.customer?.user_name ? (
                      <Link
                        to={`/user/${order.customer.user_name}`}
                        style={{ color: "#60a5fa" }}
                      >
                        {order.customer.name}
                      </Link>
                    ) : (
                      order.customer?.name
                    )}
                  </Col>

                  {order.type === "appointment" && (
                    <Col md={6} style={{ color: "#94a3b8" }}>
                      Horário: {fmtDateTime(order.scheduled_start)} →{" "}
                      {fmtDateTime(order.scheduled_end)}
                    </Col>
                  )}
                </Row>

                <ListGroup variant="flush">
                  {order.items?.map((item, idx) => (
                    <ListGroup.Item
                      key={idx}
                      style={{
                        background: "transparent",
                        color: "#e5e7eb",
                        borderColor: "rgba(148,163,184,.12)",
                      }}
                    >
                      <Row>
                        <Col md={6}>
                          {item.name}{" "}
                          {item.type && (
                            <span style={{ color: "#94a3b8" }}>
                              ({item.type})
                            </span>
                          )}
                        </Col>
                        <Col md={3}>
                          {item.quantity}x {fmtBRL(item.unit_price)}
                        </Col>
                        <Col
                          md={3}
                          className="text-md-end"
                          style={{ fontWeight: 600 }}
                        >
                          {fmtBRL(item.subtotal)}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>

                <div className="d-flex gap-2 justify-content-end mt-3 flex-wrap">
                  {canConfirm && (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={actionLoading === order.id}
                      onClick={() =>
                        updateOrderStatus(order.id, "confirm")
                      }
                    >
                      Confirmar agendamento
                    </Button>
                  )}

                  {canFinish && (
                    <>
                      <Button
                        size="sm"
                        variant="success"
                        disabled={actionLoading === order.id}
                        onClick={() =>
                          updateOrderStatus(order.id, "attended")
                        }
                      >
                        Atendido
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        disabled={actionLoading === order.id}
                        onClick={() =>
                          updateOrderStatus(order.id, "not_attended")
                        }
                      >
                        Não atendido
                      </Button>
                    </>
                  )}

                  {canCancelBeforeStart && (
                    <Button
                      size="sm"
                      variant="outline-danger"
                      disabled={actionLoading === order.id}
                      onClick={() =>
                        updateOrderStatus(order.id, "cancel")
                      }
                    >
                      Cancelar
                    </Button>
                  )}

                  <Button
                    as={Link}
                    to={`/order/view/${order.id}`}
                    size="sm"
                    variant="outline-primary"
                  >
                    Ver detalhes
                  </Button>
                </div>
              </Card.Body>
            </Card>
          );
        })}
      </Container>
    </>
  );
}
