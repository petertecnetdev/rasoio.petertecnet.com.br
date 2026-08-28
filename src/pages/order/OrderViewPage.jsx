import React, { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Card, Col, Container, ListGroup, Row, Spinner } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";

const money = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const dateTime = (value) =>
  value ? new Date(value).toLocaleString("pt-BR") : "-";

const statusText = (value) =>
  ({
    pending: "Pendente",
    confirmed: "Confirmado",
    attended: "Atendido",
    not_attended: "Não atendido",
    cancelled: "Cancelado",
    canceled: "Cancelado",
  })[value] || value || "-";

export default function OrderViewPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/order/view/${id}`, { signal: controller.signal });
        setOrder(data?.order || data || null);
      } catch (requestError) {
        if (requestError?.code !== "ERR_CANCELED") {
          setError(requestError?.response?.data?.message || requestError?.response?.data?.error || "Não foi possível carregar o atendimento.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    if (id) load();
    return () => controller.abort();
  }, [id]);

  const customer = useMemo(() => {
    const source = order?.customer || order?.client || {};
    const name =
      source.name ||
      `${source.first_name || ""} ${source.last_name || ""}`.trim() ||
      order?.customer_name ||
      "Cliente";
    return { ...source, name };
  }, [order]);

  if (loading) {
    return (
      <Container className="py-5 text-center" aria-live="polite">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error || "Atendimento não encontrado."}</Alert>
      </Container>
    );
  }

  const appointmentStatus = order.appointment_status || order.status;
  const start = order.scheduled_start || order.order_datetime;
  const totalDuration = Number(order.total_duration || 0);
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
        <div>
          <div className="text-secondary small">Atendimento</div>
          <h1 className="h3 mb-1">#{order.order_number || order.id}</h1>
          <div className="text-secondary">{dateTime(start)}</div>
        </div>
        <Badge bg="secondary" className="px-3 py-2">{statusText(appointmentStatus)}</Badge>
      </div>

      <Row className="g-4">
        <Col lg={7}>
          <Card className="bg-dark text-light border-secondary h-100">
            <Card.Body>
              <h2 className="h5">Serviços e produtos</h2>
              {items.length === 0 ? (
                <div className="text-secondary">Nenhum item informado.</div>
              ) : (
                <ListGroup variant="flush">
                  {items.map((row, index) => {
                    const item = row.item || row;
                    const quantity = Number(row.quantity || row.pivot?.quantity || 1);
                    const unitPrice = Number(row.unit_price || row.pivot?.unit_price || item.price || 0);
                    const subtotal = Number(row.subtotal || row.pivot?.subtotal || quantity * unitPrice);
                    return (
                      <ListGroup.Item key={row.id || item.id || index} className="bg-transparent text-light border-secondary px-0">
                        <div className="d-flex justify-content-between gap-3">
                          <div>
                            <div className="fw-semibold">{item.name || "Item"}</div>
                            <div className="text-secondary small">{quantity} × {money(unitPrice)}</div>
                          </div>
                          <div className="fw-semibold">{money(subtotal)}</div>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="bg-dark text-light border-secondary mb-4">
            <Card.Body>
              <h2 className="h5">Cliente</h2>
              <div className="fw-semibold">{customer.name}</div>
              {customer.email && <div className="text-secondary">{customer.email}</div>}
              {(customer.user_name || customer.username) && (
                <Link to={`/user/${customer.user_name || customer.username}`}>Ver perfil</Link>
              )}
            </Card.Body>
          </Card>

          <Card className="bg-dark text-light border-secondary">
            <Card.Body>
              <h2 className="h5">Resumo</h2>
              <div className="d-flex justify-content-between mb-2"><span className="text-secondary">Valor</span><strong>{money(order.total_price)}</strong></div>
              <div className="d-flex justify-content-between mb-2"><span className="text-secondary">Duração</span><strong>{totalDuration ? `${totalDuration} min` : "-"}</strong></div>
              <div className="d-flex justify-content-between mb-2"><span className="text-secondary">Pagamento</span><strong>{order.payment_status || "-"}</strong></div>
              {order.notes && <div className="mt-3"><div className="text-secondary small">Observações</div><div>{order.notes}</div></div>}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
