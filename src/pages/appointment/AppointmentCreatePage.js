import React, { useState, useEffect } from "react";
import { Form, Button, Container, Row, Card, Col } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";

export default function AppointmentCreatePage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // obtém data e hora atuais em fuso de Brasília
  const brNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  const pad = n => String(n).padStart(2, "0");
  const ceilToHalfHour = date => {
    let h = date.getHours();
    let m = date.getMinutes();
    if (m < 30) {
      m = 30;
    } else {
      h += 1;
      m = 0;
    }
    if (h >= 24) h = 0;
    return `${pad(h)}:${pad(m)}`;
  };

  const today = brNow.toISOString().substr(0, 10);
  const nextSlot = ceilToHalfHour(brNow);

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [barbershop, setBarbershop] = useState(null);
  const [barbershopId, setBarbershopId] = useState(null);
  const [items, setItems] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);

  const [appointmentData, setAppointmentData] = useState({
    customer_name: "",
    customer_cpf: "",
    customer_phone: "",
    customer_email: "",
    scheduled_date: today,
    scheduled_time: nextSlot,
    provider_id: "",
    notes: "",
    service_ids: []
  });

  // carrega usuário autenticado
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const { data } = await axios.get(
            `${apiBaseUrl}/auth/me`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setUser(data.user);
          setAppointmentData(prev => ({
            ...prev,
            customer_name: data.user.first_name,
            customer_email: data.user.email
          }));
        } catch {
          setUser(null);
        }
      }
      setLoadingUser(false);
    })();
  }, []);

  // carrega barbearia, serviços e barbeiros
  useEffect(() => {
    (async () => {
      setMessages(["Carregando informações..."]);
      try {
        const { data } = await axios.get(
          `${apiBaseUrl}/barbershop/view/${slug}`
        );
        const shop = data.barbershop || data;
        setBarbershop(shop);
        setBarbershopId(shop.id);
        setItems(data.items || []);
        setBarbers(data.barbers || []);
      } catch (err) {
        Swal.fire(
          "Erro",
          err.response?.data?.message || "Erro ao carregar.",
          "error"
        );
      } finally {
        setMessages([]);
      }
    })();
  }, [slug]);

  // busca slots disponíveis ao mudar barbeiro ou data
  useEffect(() => {
    const { provider_id, scheduled_date } = appointmentData;
    if (!provider_id || !scheduled_date || !barbershopId) {
      setAvailableSlots([]);
      return;
    }
    axios
      .get(`${apiBaseUrl}/appointment/availability`, {
        params: {
          provider_id,
          entity_id: barbershopId,
          date: scheduled_date
        }
      })
      .then(({ data }) => {
        let slots = data.slots || [];
        // se agendamento é hoje, filtra horários menores que nextSlot
        if (scheduled_date === today) {
          slots = slots.filter(t => t >= nextSlot);
        }
        setAvailableSlots(slots);
      })
      .catch(() => setAvailableSlots([]));
  }, [appointmentData.provider_id, appointmentData.scheduled_date, barbershopId]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setAppointmentData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceSelection = e => {
    const id = parseInt(e.target.value, 10);
    setAppointmentData(prev => {
      const list = e.target.checked
        ? [...prev.service_ids, id]
        : prev.service_ids.filter(i => i !== id);
      return { ...prev, service_ids: list };
    });
  };

  const validateFields = () => {
    const errs = [];
    if (!appointmentData.customer_name.trim()) errs.push("Informe seu nome.");
    if (!user) {
      if (!appointmentData.customer_cpf.trim()) errs.push("Informe seu CPF.");
      if (!appointmentData.customer_phone.trim()) errs.push("Informe seu telefone.");
      if (!appointmentData.customer_email.trim()) errs.push("Informe seu email.");
    }
    if (!appointmentData.provider_id) errs.push("Selecione um barbeiro.");
    if (!appointmentData.scheduled_date) errs.push("Selecione um dia.");
    if (!appointmentData.scheduled_time) errs.push("Selecione um horário.");
    if (!appointmentData.service_ids.length) errs.push("Selecione ao menos um serviço.");
    if (errs.length) {
      Swal.fire("Erro de validação", errs.join("\n"), "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateFields() || !barbershopId) return;
    setIsProcessing(true);
    setMessages(["Enviando seu agendamento..."]);

    const duration = appointmentData.service_ids.length * 25;
    const scheduledAtIso = new Date(
      `${appointmentData.scheduled_date}T${appointmentData.scheduled_time}:00`
    ).toISOString();
    let clientId = localStorage.getItem("client_id") || 1;
    if (user) clientId = user.id;
    const notes = !user
      ? `Cliente: ${appointmentData.customer_name}\nCPF: ${appointmentData.customer_cpf}\nTelefone: ${appointmentData.customer_phone}\nEmail: ${appointmentData.customer_email}\nObservações: ${appointmentData.notes}`
      : appointmentData.notes;

    const payload = {
      customer_name: appointmentData.customer_name,
      app_id: 1,
      entity_name: "barbershop",
      entity_id: barbershopId,
      scheduled_at: scheduledAtIso,
      service_ids: appointmentData.service_ids,
      expected_end_time: new Date(
        new Date(scheduledAtIso).getTime() + duration * 60000
      ).toISOString(),
      provider_id: appointmentData.provider_id,
      client_id: clientId,
      registered_by: clientId,
      status: "pending",
      location: "",
      duration,
      notes,
      payment_status: "pending",
      appointment_type: "presencial"
    };

    try {
      await axios.post(`${apiBaseUrl}/appointment`, payload, {
        headers: { "Content-Type": "application/json" }
      });
      Swal.fire("Sucesso!", "Agendamento criado!", "success").then(() =>
        navigate(-1)
      );
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.entries(err.response.data.errors)
            .map(([f, m]) => `${f}: ${m.join(", ")}`)
            .join("\n")
        : "Erro ao criar o agendamento.";
      Swal.fire("Erro", msg, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <NavlogComponent />
      <Container fluid className="main-container">
        <Row className="justify-content-center">
          <Col xs={12} lg={8}>
            {isProcessing ? (
              <ProcessingIndicatorComponent messages={messages} />
            ) : (
              <Card className="card-component shadow-sm">
                <Card.Body>
                  {barbershop && (
                    <div className="text-center mb-4">
                      <img
                        src={
                          barbershop.logo
                            ? `${storageUrl}/${barbershop.logo}`
                            : "/images/logo.png"
                        }
                        alt={barbershop.name}
                        className="rounded-circle"
                        style={{ height: 80, width: 80, objectFit: "cover" }}
                        onError={e => {
                          e.target.onerror = null;
                          e.target.src = "/images/logo.png";
                        }}
                      />
                      <h5 className="mt-2">
                        Agendamento em <strong>{barbershop.name}</strong>
                      </h5>
                    </div>
                  )}
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      {/* Nome */}
                      <Col md={12} className="mb-3">
                        <Form.Group controlId="customer_name">
                          <Form.Label>Seu Nome</Form.Label>
                          <Form.Control
                            type="text"
                            name="customer_name"
                            value={appointmentData.customer_name}
                            onChange={handleInputChange}
                            disabled={!!user}
                            required
                          />
                        </Form.Group>
                      </Col>

                      {/* CPF, Telefone e Email */}
                      {!loadingUser && !user && (
                        <>
                          <Col md={4} className="mb-3">
                            <Form.Group controlId="customer_cpf">
                              <Form.Label>CPF</Form.Label>
                              <Form.Control
                                type="text"
                                name="customer_cpf"
                                value={appointmentData.customer_cpf}
                                onChange={handleInputChange}
                                required
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4} className="mb-3">
                            <Form.Group controlId="customer_phone">
                              <Form.Label>Telefone</Form.Label>
                              <Form.Control
                                type="text"
                                name="customer_phone"
                                value={appointmentData.customer_phone}
                                onChange={handleInputChange}
                                required
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4} className="mb-3">
                            <Form.Group controlId="customer_email">
                              <Form.Label>Email</Form.Label>
                              <Form.Control
                                type="email"
                                name="customer_email"
                                value={appointmentData.customer_email}
                                onChange={handleInputChange}
                                required
                              />
                            </Form.Group>
                          </Col>
                        </>
                      )}

                      {/* Barbeiro */}
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="provider_id">
                          <Form.Label>Barbeiro</Form.Label>
                          <Form.Select
                            name="provider_id"
                            value={appointmentData.provider_id}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Selecione o barbeiro</option>
                            {barbers.map(b => (
                              <option key={b.user_id} value={b.user_id}>
                                {b.first_name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      {/* Dia */}
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="scheduled_date">
                          <Form.Label>Dia</Form.Label>
                          <Form.Control
                            type="date"
                            name="scheduled_date"
                            value={appointmentData.scheduled_date}
                            onChange={handleInputChange}
                            min={today}
                            required
                          />
                        </Form.Group>
                      </Col>

                      {/* Horário */}
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="scheduled_time">
                          <Form.Label>Horário</Form.Label>
                          <Form.Select
                            name="scheduled_time"
                            value={appointmentData.scheduled_time}
                            onChange={handleInputChange}
                            disabled={!appointmentData.provider_id || availableSlots.length === 0}
                            required
                          >
                            <option value="">Selecione o horário</option>
                            {availableSlots.map(t => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </Form.Select>
                          {appointmentData.provider_id && availableSlots.length === 0 && (
                            <small className="text-danger">
                              Sem horários disponíveis
                            </small>
                          )}
                        </Form.Group>
                      </Col>

                      {/* Serviços */}
                      <Col md={12} className="mb-4">
                        <Form.Label>Serviços</Form.Label>
                        <Row>
                          {items.length === 0 ? (
                            <p>Nenhum serviço disponível.</p>
                          ) : (
                            items.map(item => (
                              <Col md={4} key={item.id} className="mb-2">
                                <Form.Check
                                  type="checkbox"
                                  id={`service-${item.id}`}
                                  label={item.name}
                                  value={item.id}
                                  checked={appointmentData.service_ids.includes(item.id)}
                                  onChange={handleServiceSelection}
                                />
                              </Col>
                            ))
                          )}
                        </Row>
                      </Col>

                      {/* Observações */}
                      <Col md={12} className="mb-3">
                        <Form.Group controlId="notes">
                          <Form.Label>Observações</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="notes"
                            value={appointmentData.notes}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="text-center">
                      <Button type="submit" variant="primary">
                        Agendar
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}
