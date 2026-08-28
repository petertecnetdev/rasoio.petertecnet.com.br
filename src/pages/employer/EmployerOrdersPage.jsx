// src/pages/employer/EmployerOrdersPage.jsx
import React from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  ListGroup,
  Row,
  Spinner,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import EmployerHero from "../../components/employer/EmployerHero";
import useEmployerOrders from "../../hooks/useEmployerOrders";
import useImageUtils from "../../hooks/useImageUtils";

const fmtBRL = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const fmtDateTime = (value) =>
  value ? new Date(value).toLocaleString("pt-BR") : "-";

const resolveCustomer = (order) => {
  const customer = order?.customer || order?.client || {};
  const firstName = customer.first_name || customer.name || "";
  const lastName = customer.last_name || "";

  return {
    ...customer,
    name: `${firstName} ${lastName}`.trim() || order?.customer_name || "Cliente",
    user_name: customer.user_name || customer.username || null,
  };
};

const resolveStart = (order) => order?.scheduled_start || order?.order_datetime || null;

const resolveEnd = (order) => {
  if (order?.scheduled_end) return order.scheduled_end;
  const start = resolveStart(order);
  if (!start) return null;
  const date = new Date(start);
  date.setMinutes(date.getMinutes() + Number(order?.total_duration || 30));
  return date.toISOString();
};

const normalizeItem = (row) => ({
  name: row?.name || row?.item?.name || "Item",
  quantity: Number(row?.quantity || row?.pivot?.quantity || 1),
  unitPrice: Number(row?.unit_price || row?.pivot?.unit_price || row?.item?.price || 0),
  subtotal: Number(
    row?.subtotal ||
      row?.pivot?.subtotal ||
      Number(row?.quantity || row?.pivot?.quantity || 1) *
        Number(row?.unit_price || row?.pivot?.unit_price || row?.item?.price || 0)
  ),
});

export default function EmployerOrdersPage() {
  const { orders, employer, loading, apiError, actionLoading, updateOrderStatus } =
    useEmployerOrders();
  const { imageUrl, handleImgError } = useImageUtils();

  const confirmAction = async (order, action) => {
    const customer = resolveCustomer(order);
    const start = resolveStart(order);
    const labels = {
      confirm: ["Confirmar agendamento?", `Confirmar ${customer.name} em ${fmtDateTime(start)}?`, "Sim, confirmar"],
      cancel: ["Cancelar agendamento?", `Cancelar ${customer.name} em ${fmtDateTime(start)}?`, "Sim, cancelar"],
      attended: ["Finalizar atendimento", `Confirmar que ${customer.name} foi atendido?`, "Sim, atendido"],
      not_attended: ["Finalizar atendimento", `Confirmar que ${customer.name} não compareceu?`, "Sim, não atendido"],
    };

    const config = labels[action];
    if (!config) return;

    const result = await Swal.fire({
      title: config[0],
      text: config[1],
      icon: "question",
      showCancelButton: true,
      confirmButtonText: config[2],
      cancelButtonText: "Voltar",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await updateOrderStatus(order.id, action);
      await Swal.fire({ icon: "success", title: "Atualizado", timer: 1300, showConfirmButton: false });
    } catch (error) {
      await Swal.fire({ icon: "error", title: "Erro", text: error.message });
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center" aria-live="polite">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!employer) {
    return (
      <Container className="py-4">
        <Alert variant="warning">Seu perfil de barbeiro não foi encontrado ou não está vinculado a uma barbearia.</Alert>
      </Container>
    );
  }

  const now = new Date();

  return (
    <Container className="py-4">
      <EmployerHero
        title="Meus atendimentos"
        subtitle="Agendamentos vinculados ao seu perfil de barbeiro"
        employer={employer}
      />

      {apiError && <Alert variant="danger">{apiError}</Alert>}
      {orders.length === 0 && <Alert variant="secondary">Nenhum atendimento encontrado.</Alert>}

      {orders.map((order) => {
        const customer = resolveCustomer(order);
        const startValue = resolveStart(order);
        const endValue = resolveEnd(order);
        const start = startValue ? new Date(startValue) : null;
        const end = endValue ? new Date(endValue) : null;
        const appointmentStatus = order.appointment_status || order.status || "pending";
        const isAppointment = (order.type || "appointment") === "appointment";

        const canConfirm = isAppointment && appointmentStatus === "pending" && start && now < start;
        const canFinish = isAppointment && appointmentStatus === "confirmed" && end && now >= end;
        const canCancel =
          isAppointment && ["pending", "confirmed"].includes(appointmentStatus) && start && now < start;

        const statusLabel = {
          pending: "Pendente",
          confirmed: "Confirmado",
          attended: "Atendido",
          not_attended: "Não atendido",
          cancelled: "Cancelado",
          canceled: "Cancelado",
        }[appointmentStatus] || appointmentStatus;

        const avatar = imageUrl(customer.avatar) || imageUrl(customer.images?.avatar);
        const normalizedItems = (order.items || []).map(normalizeItem);

        return (
          <Card key={order.id} className="mb-4 bg-dark text-light border-secondary">
            <Card.Body>
              <Row className="mb-3 align-items-center">
                <Col md={4}>
                  <strong>#{order.order_number || order.id}</strong>
                  <div className="small text-secondary">Criado em {fmtDateTime(order.created_at)}</div>
                </Col>
                <Col md={4}><Badge bg="secondary">{statusLabel}</Badge></Col>
                <Col md={4} className="text-md-end fw-semibold">{fmtBRL(order.total_price)}</Col>
              </Row>

              <Row className="mb-3 align-items-center g-3">
                <Col md={6} className="d-flex align-items-center gap-3">
                  {avatar && (
                    <img
                      src={avatar}
                      alt={customer.name}
                      width={48}
                      height={48}
                      loading="lazy"
                      onError={handleImgError}
                      style={{ borderRadius: "50%", objectFit: "cover" }}
                    />
                  )}
                  <div>
                    <div className="text-secondary small">Cliente</div>
                    {customer.user_name ? (
                      <Link to={`/user/${customer.user_name}`}>{customer.name}</Link>
                    ) : (
                      customer.name
                    )}
                  </div>
                </Col>

                {isAppointment && (
                  <Col md={6} className="text-secondary">
                    {fmtDateTime(startValue)} → {fmtDateTime(endValue)}
                  </Col>
                )}
              </Row>

              {normalizedItems.length > 0 && (
                <ListGroup variant="flush">
                  {normalizedItems.map((item, index) => (
                    <ListGroup.Item key={`${order.id}-${index}`} className="bg-transparent text-light border-secondary">
                      <Row>
                        <Col md={6}>{item.name}</Col>
                        <Col md={3}>{item.quantity}x {fmtBRL(item.unitPrice)}</Col>
                        <Col md={3} className="text-md-end">{fmtBRL(item.subtotal)}</Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}

              <div className="d-flex gap-2 justify-content-end mt-3 flex-wrap">
                {canConfirm && (
                  <Button size="sm" disabled={actionLoading === order.id} onClick={() => confirmAction(order, "confirm")}>Confirmar</Button>
                )}
                {canFinish && (
                  <>
                    <Button size="sm" variant="success" disabled={actionLoading === order.id} onClick={() => confirmAction(order, "attended")}>Atendido</Button>
                    <Button size="sm" variant="outline-danger" disabled={actionLoading === order.id} onClick={() => confirmAction(order, "not_attended")}>Não atendido</Button>
                  </>
                )}
                {canCancel && (
                  <Button size="sm" variant="outline-danger" disabled={actionLoading === order.id} onClick={() => confirmAction(order, "cancel")}>Cancelar</Button>
                )}
                <Button as={Link} to={`/order/view/${order.id}`} size="sm" variant="outline-primary">Ver detalhes</Button>
              </div>
            </Card.Body>
          </Card>
        );
      })}
    </Container>
  );
}
