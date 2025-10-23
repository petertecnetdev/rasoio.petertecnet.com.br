// src/pages/employer/EmployerDashboardPage.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Spinner,
  Form,
} from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./EmployerDashboard.css";

export default function EmployerDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [employer, setEmployer] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [finishedOrders, setFinishedOrders] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [newSchedules, setNewSchedules] = useState([]);
  const [summary, setSummary] = useState({ total: 0, value: 0 });
  const [daysOfWeek] = useState([
    { value: "monday", label: "Segunda" },
    { value: "tuesday", label: "Terça" },
    { value: "wednesday", label: "Quarta" },
    { value: "thursday", label: "Quinta" },
    { value: "friday", label: "Sexta" },
    { value: "saturday", label: "Sábado" },
    { value: "sunday", label: "Domingo" },
  ]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const { data: me } = await axios.get(`${apiBaseUrl}/auth/me`);
        const emp = me.employer;
        if (!emp) {
          Swal.fire(
            "Acesso restrito",
            "Você não é um colaborador vinculado a nenhum estabelecimento.",
            "warning"
          );
          setIsLoading(false);
          return;
        }

        setEmployer(emp);

        const { data: ordersRes } = await axios.get(
          `${apiBaseUrl}/order/listbyemployer`,
          {
            params: {
              employer_id: emp.id,
              app_id: 2,
            },
          }
        );

        const allOrders = Array.isArray(ordersRes.orders)
          ? ordersRes.orders
          : [];

        const activeAppointments = allOrders.filter(
          (o) =>
            o.type === "appointment" &&
            ["pending", "confirmed"].includes(o.appointment_status)
        );

        const finished = allOrders.filter(
          (o) => o.status === "completed" || o.payment_status === "paid"
        );

        const totalValue = finished.reduce(
          (acc, o) => acc + parseFloat(o.total_price || 0),
          0
        );

        setAppointments(activeAppointments);
        setFinishedOrders(finished);
        setSummary({
          total: finished.length + activeAppointments.length,
          value: totalValue,
        });

        const { data: schRes } = await axios.get(
          `${apiBaseUrl}/employer-schedule`,
          {
            params: { employer_id: emp.id },
          }
        );
        setSchedules(schRes);
      } catch (err) {
        Swal.fire(
          "Erro",
          err.response?.data?.error ||
            "Falha ao carregar os dados do colaborador.",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleAddSchedule = () => {
    setNewSchedules([
      ...newSchedules,
      { day_of_week: "monday", start_time: "", end_time: "" },
    ]);
  };

  const handleChangeNew = (index, field, value) => {
    const updated = [...newSchedules];
    updated[index][field] = value;
    setNewSchedules(updated);
  };

  const handleRemoveNew = (index) => {
    setNewSchedules(newSchedules.filter((_, i) => i !== index));
  };

  const handleSaveSchedules = async () => {
    if (!employer) return;
    const filtered = newSchedules.filter(
      (s) => s.day_of_week && s.start_time && s.end_time
    );
    if (filtered.length === 0) {
      Swal.fire("Aviso", "Preencha pelo menos um horário válido.", "warning");
      return;
    }
    try {
      await axios.post(`${apiBaseUrl}/employer-schedule`, {
        employer_id: employer.id,
        schedules: filtered,
      });
      Swal.fire("Sucesso", "Horários salvos com sucesso.", "success");
      setNewSchedules([]);
      const { data } = await axios.get(`${apiBaseUrl}/employer-schedule`, {
        params: { employer_id: employer.id },
      });
      setSchedules(data);
    } catch (err) {
      Swal.fire("Erro", "Falha ao salvar os horários.", "error");
    }
  };

  const handleDeleteSchedule = async (id) => {
    Swal.fire({
      title: "Remover horário?",
      text: "Essa ação não poderá ser desfeita.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remover",
      cancelButtonText: "Cancelar",
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          await axios.delete(`${apiBaseUrl}/employer-schedule/${id}`);
          Swal.fire("Removido", "Horário excluído com sucesso.", "success");
          setSchedules((prev) => prev.filter((s) => s.id !== id));
        } catch {
          Swal.fire("Erro", "Falha ao remover horário.", "error");
        }
      }
    });
  };

  if (isLoading)
    return (
      <Container className="order-list__container text-center mt-5">
        <Spinner animation="border" className="order-list__spinner" />
      </Container>
    );

  return (
    <>
      <NavlogComponent />
      <Container className="order-list__container">
        {/* HEADER */}
        <div className="order-list__header">
          <img
            src={
              employer?.user?.avatar
                ? `${storageUrl}/${employer.user.avatar}`
                : "/images/user.png"
            }
            alt="Colaborador"
            className="order-list__logo"
          />
          <div className="order-list__establishment-name">
            <strong>
              {employer?.user?.first_name} {employer?.user?.last_name}
            </strong>
            <div className="text-muted small">
              {employer?.role || "Colaborador"}
            </div>
          </div>
        </div>

        {/* RESUMO */}
        <Row className="mb-4 gx-3 gy-2 order-lines__block">
          <Col xs={6} md={4}>
            <Card bg="dark" text="light" className="text-center h-100">
              <Card.Body className="p-2">
                <Card.Title className="fs-6">Total de Atendimentos</Card.Title>
                <Card.Text className="fs-5 fw-bold">{summary.total}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={4}>
            <Card bg="dark" text="light" className="text-center h-100">
              <Card.Body className="p-2">
                <Card.Title className="fs-6">Valor Total</Card.Title>
                <Card.Text className="fs-5 fw-bold">
                  R${summary.value.toFixed(2).replace(".", ",")}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} md={4}>
            <Card bg="dark" text="light" className="text-center h-100">
              <Card.Body className="p-2">
                <Card.Title className="fs-6">Horários Cadastrados</Card.Title>
                <Card.Text className="fs-5 fw-bold">{schedules.length}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* AGENDAMENTOS ATIVOS */}
        <Card className="bg-dark text-light order-lines__block mb-4">
          <Card.Header className="order-lines__title">
            <strong>Agendamentos Ativos</strong>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="order-list__table-responsive">
              <Table striped hover variant="dark" responsive className="order-table mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cliente</th>
                    <th>Data / Hora</th>
                    <th>Status</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        Nenhum agendamento ativo encontrado.
                      </td>
                    </tr>
                  ) : (
                    appointments.map((a) => (
                      <tr key={a.id}>
                        <td>{a.order_number}</td>
                        <td>{a.customer_name}</td>
                        <td>
                          {new Date(a.order_datetime).toLocaleString("pt-BR")}
                        </td>
                        <td>
                          <Badge
                            bg={
                              a.appointment_status === "confirmed"
                                ? "success"
                                : "warning"
                            }
                          >
                            {a.appointment_status}
                          </Badge>
                        </td>
                        <td>R${parseFloat(a.total_price).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* ATENDIMENTOS FINALIZADOS */}
        <Card className="bg-dark text-light order-lines__block mb-4">
          <Card.Header className="order-lines__title">
            <strong>Atendimentos Finalizados</strong>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="order-list__table-responsive">
              <Table striped hover variant="dark" responsive className="order-table mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cliente</th>
                    <th>Data / Hora</th>
                    <th>Status</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {finishedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        Nenhum atendimento finalizado.
                      </td>
                    </tr>
                  ) : (
                    finishedOrders.map((f) => (
                      <tr key={f.id}>
                        <td>{f.order_number}</td>
                        <td>{f.customer_name}</td>
                        <td>
                          {new Date(f.order_datetime).toLocaleString("pt-BR")}
                        </td>
                        <td>
                          <Badge bg="success">Concluído</Badge>
                        </td>
                        <td>R${parseFloat(f.total_price).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* HORÁRIOS DE ATENDIMENTO */}
        <Card className="bg-dark text-light order-lines__block">
          <Card.Header className="order-lines__title">
            <strong>Gerenciar Horários de Atendimento</strong>
          </Card.Header>
          <Card.Body>
            <div className="order-list__table-responsive mb-3">
              <Table striped hover variant="dark" responsive className="order-table mb-0">
                <thead>
                  <tr>
                    <th>Dia</th>
                    <th>Início</th>
                    <th>Término</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        Nenhum horário cadastrado.
                      </td>
                    </tr>
                  ) : (
                    schedules.map((s) => (
                      <tr key={s.id}>
                        <td>
                          {daysOfWeek.find((d) => d.value === s.day_of_week)?.label}
                        </td>
                        <td>{s.start_time}</td>
                        <td>{s.end_time}</td>
                        <td>
                          <Badge bg={s.is_active ? "success" : "secondary"}>
                            {s.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDeleteSchedule(s.id)}
                          >
                            Remover
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>

            {newSchedules.map((s, i) => (
              <Row key={i} className="align-items-center mb-3 gx-2">
                <Col xs={12} md={3}>
                  <Form.Select
                    value={s.day_of_week}
                    onChange={(e) =>
                      handleChangeNew(i, "day_of_week", e.target.value)
                    }
                  >
                    {daysOfWeek.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col xs={5} md={3}>
                  <Form.Control
                    type="time"
                    value={s.start_time}
                    onChange={(e) =>
                      handleChangeNew(i, "start_time", e.target.value)
                    }
                  />
                </Col>
                <Col xs={5} md={3}>
                  <Form.Control
                    type="time"
                    value={s.end_time}
                    onChange={(e) =>
                      handleChangeNew(i, "end_time", e.target.value)
                    }
                  />
                </Col>
                <Col xs={2} md={3} className="text-end">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleRemoveNew(i)}
                  >
                    Remover
                  </Button>
                </Col>
              </Row>
            ))}

            <div className="d-flex justify-content-between mt-3">
              <Button variant="outline-info" onClick={handleAddSchedule}>
                Adicionar Horário
              </Button>
              {newSchedules.length > 0 && (
                <Button variant="success" onClick={handleSaveSchedules}>
                  Salvar Alterações
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
}
