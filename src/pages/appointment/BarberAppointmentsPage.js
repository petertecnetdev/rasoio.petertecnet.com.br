import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Button,
  Form,
  Card,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiBaseUrl } from "../../config";

const statusLabels = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Finalizado",
};

const paymentLabels = {
  pending: "Pendente",
  confirmed: "Confirmado",
};

const rowClasses = {
  pending: "table-warning",
  confirmed: "table-success",
  cancelled: "table-danger",
  completed: "table-secondary",
};

const cardVariants = {
  pending: { bg: "warning", text: "dark" },
  confirmed: { bg: "success", text: "white" },
  cancelled: { bg: "danger", text: "white" },
  completed: { bg: "secondary", text: "white" },
};

export default function BarberAppointmentsPage() {
  const brNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  const today = brNow.toISOString().slice(0, 10);

  const [appointments, setAppointments] = useState([]);
  const [providers, setProviders] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterProvider, setFilterProvider] = useState("");
  const [filterShop, setFilterShop] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMessages(["Carregando agendamentos..."]);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${apiBaseUrl}/appointment/listbyprovider`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const list = (res.data.appointments || []).map((a) => {
          let infoObj = {};
          if (a.info) {
            try {
              infoObj = typeof a.info === "string" ? JSON.parse(a.info) : a.info;
            } catch {
              infoObj = {};
            }
          }

          const clientName =
            infoObj.name && infoObj.name.trim()
              ? infoObj.name
              : a.client?.first_name || "Cliente não informado";

          const clientPhone =
            infoObj.phone && infoObj.phone.trim()
              ? infoObj.phone
              : a.client?.phone || "Telefone não informado";

          return {
            ...a,
            provider_id: a.provider?.id ?? null,
            provider_name: a.provider?.first_name ?? "—",
            provider_slug: a.provider?.slug ?? "",
            entity_id: a.entity?.id ?? null,
            shop_name: a.entity?.name ?? "—",
            shop_slug: a.entity?.slug ?? "",
            client_name: clientName,
            client_phone: clientPhone,
          };
        });

        setAppointments(list);

        const provs = [];
        const shopList = [];
        list.forEach((a) => {
          if (a.provider_id && !provs.some((p) => p.id === a.provider_id)) {
            provs.push({
              id: a.provider_id,
              name: a.provider_name,
              slug: a.provider_slug,
            });
          }
          if (a.entity_id && !shopList.some((s) => s.id === a.entity_id)) {
            shopList.push({
              id: a.entity_id,
              name: a.shop_name,
              slug: a.shop_slug,
            });
          }
        });
        setProviders(provs);
        setShops(shopList);
      } catch (err) {
        if (err.response?.status !== 404) {
          Swal.fire("Erro", "Falha ao carregar agendamentos.", "error");
        }
        setAppointments([]);
      } finally {
        setLoading(false);
        setMessages([]);
      }
    })();
  }, []);

  const cancelAppointment = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Cancelar?",
      text: "Deseja cancelar este agendamento?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim",
      cancelButtonText: "Não",
    });
    if (!isConfirmed) return;
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${apiBaseUrl}/appointment/${id}/status`,
        { status: "cancelled" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire("Cancelado", "Agendamento cancelado.", "success");
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
      );
    } catch {
      Swal.fire("Erro", "Falha ao cancelar. Tente novamente.", "error");
    }
  };

  const filtered = appointments.filter((a) => {
    if (filterStatus && a.status !== filterStatus) return false;
    if (filterProvider && a.provider_id !== +filterProvider) return false;
    if (filterShop && a.entity_id !== +filterShop) return false;
    if (filterDate && a.scheduled_at.slice(0, 10) !== filterDate) return false;
    return true;
  });

  return (
    <>
      <NavlogComponent />
      <Container fluid className="main-container">
        <Row className="my-3 align-items-center g-2">
          <Col>
            <h3>Meus Agendamentos</h3>
          </Col>

          <Col md="auto">
            <Form.Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Situação</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col md="auto">
            <Form.Select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
            >
              <option value="">Todos Barbeiros</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col md="auto">
            <Form.Select
              value={filterShop}
              onChange={(e) => setFilterShop(e.target.value)}
            >
              <option value="">Todas barbearias</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col md="auto">
            <Form.Control
              type="date"
              value={filterDate}
              min={today}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </Col>
        </Row>

        {loading ? (
          <ProcessingIndicatorComponent messages={messages} />
        ) : (
          <>
            {/* DESKTOP */}
            <div className="d-none d-md-block">
              <Table bordered hover>
                <thead>
                  <tr>
                    <th>Agendado em</th>
                    <th>Solicitado em</th>
                    <th>Cliente</th>
                    <th>Telefone</th>
                    <th>Entidade</th>
                    <th>Serviços</th>
                    <th>Situação</th>
                    <th>Pagamento</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center">
                        Nenhum agendamento encontrado.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a) => (
                      <tr key={a.id} className={rowClasses[a.status] || ""}>
                        <td>{new Date(a.scheduled_at).toLocaleString("pt-BR")}</td>
                        <td>{new Date(a.created_at).toLocaleString("pt-BR")}</td>
                        <td>{a.client_name}</td>
                        <td>{a.client_phone}</td>
                        <td>
                          {a.shop_slug ? (
                            <Link to={`/barbershop/view/${a.shop_slug}`}>
                              {a.shop_name}
                            </Link>
                          ) : (
                            a.shop_name
                          )}
                        </td>
                        <td>{a.service_names.join(", ") || "—"}</td>
                        <td>{statusLabels[a.status]}</td>
                        <td>{paymentLabels[a.payment_status] || "—"}</td>
                        <td>
                          {["pending", "confirmed"].includes(a.status) && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => cancelAppointment(a.id)}
                            >
                              Cancelar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>

            {/* MOBILE */}
            <div className="d-block d-md-none">
              <Row>
                {filtered.length === 0 && (
                  <Col>
                    <p className="text-center">Nenhum agendamento encontrado.</p>
                  </Col>
                )}
                {filtered.map((a) => {
                  const variant = cardVariants[a.status] || {
                    bg: "light",
                    text: "dark",
                  };
                  return (
                    <Col xs={12} key={a.id} className="mb-3">
                      <Card bg={variant.bg} text={variant.text}>
                        <Card.Body>
                          <Card.Title>
                            Agendado: {new Date(a.scheduled_at).toLocaleString("pt-BR")}
                          </Card.Title>
                          <Card.Text>
                            <strong>Solicitado em:</strong>{" "}
                            {new Date(a.created_at).toLocaleString("pt-BR")}
                            <br />
                            <strong>Cliente:</strong> {a.client_name}
                            <br />
                            <strong>Telefone:</strong> {a.client_phone}
                            <br />
                            <strong>Serviços:</strong>{" "}
                            {a.service_names.join(", ") || "—"}
                            <br />
                            <strong>Status:</strong> {statusLabels[a.status]}
                            <br />
                            <strong>Pagamento:</strong>{" "}
                            {paymentLabels[a.payment_status] || "—"}
                          </Card.Text>
                          {["pending", "confirmed"].includes(a.status) && (
                            <Button
                              variant="light"
                              size="sm"
                              onClick={() => cancelAppointment(a.id)}
                            >
                              Cancelar
                            </Button>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </>
        )}
      </Container>
    </>
  );
}
