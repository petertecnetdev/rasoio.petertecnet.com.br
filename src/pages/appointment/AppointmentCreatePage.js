import React, { useState, useEffect } from "react";
import { Form, Button, Container, Row, Card, Col } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl } from "../../config";

const AppointmentCreatePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [barbershop, setBarbershop] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [items, setItems] = useState([]);
  const [barbershopId, setBarbershopId] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);

  const [appointmentData, setAppointmentData] = useState({
    customer_name: "",
    customer_cpf: "",
    customer_phone: "",
    scheduled_at: "",
    provider_id: "",
    notes: "",
    service_ids: []
  });

  // 1) busca usuário autenticado
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const { data } = await axios.get(`${apiBaseUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(data.user);
          setAppointmentData(prev => ({
            ...prev,
            customer_name: data.user.first_name
          }));
        } catch {
          setUser(null);
        }
      }
      setLoadingUser(false);
    })();
  }, []);

  // 2) busca barbearia e serviços
  useEffect(() => {
    (async () => {
      setMessages(["Carregando informações da barbearia e serviços..."]);
      try {
        const { data } = await axios.get(`${apiBaseUrl}/barbershop/view/${slug}`);
        const shop = data.barbershop || data;
        setBarbershop(shop);
        setBarbershopId(shop.id);
        setItems(data.items || []);
        setBarbers(data.barbers || []);
      } catch (error) {
        Swal.fire("Erro", error.response?.data?.message || "Erro ao carregar barbearia.", "error");
      } finally {
        setMessages([]);
      }
    })();
  }, [slug]);

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
    if (!user && !appointmentData.customer_cpf.trim()) errs.push("Informe seu CPF.");
    if (!user && !appointmentData.customer_phone.trim()) errs.push("Informe seu telefone.");
    if (!appointmentData.scheduled_at) errs.push("A data e hora do agendamento é obrigatória.");
    if (!appointmentData.provider_id) errs.push("Selecione um barbeiro.");
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
    setMessages(["Aguarde enquanto realizamos seu agendamento..."]);

    const BASE_DURATION = 25;
    const totalDuration = appointmentData.service_ids.length * BASE_DURATION;
    const start = new Date(appointmentData.scheduled_at);
    const expectedEnd = new Date(start.getTime() + totalDuration * 60000);

    // determina client_id e registered_by
    let clientId = localStorage.getItem("client_id") || 1;
    if (user) clientId = user.id;

    // monta o campo notes com CPF e telefone se não autenticado
    const extraInfo = !user
      ? `Cliente ${appointmentData.customer_name} CPF: ${appointmentData.customer_cpf} Telefone: ${appointmentData.customer_phone} Observações: ${appointmentData.notes}`
      : appointmentData.notes;

    const payload = {
      customer_name: appointmentData.customer_name,
      app_id: 1,
      entity_name: "barbershop",
      entity_id: barbershopId,
      scheduled_at: appointmentData.scheduled_at,
      service_ids: appointmentData.service_ids,
      expected_end_time: expectedEnd.toISOString(),
      provider_id: appointmentData.provider_id,
      client_id: clientId,
      registered_by: clientId,
      status: "pending",
      location: "",
      duration: totalDuration,
      notes: extraInfo,
      payment_status: "pending",
      appointment_type: "presencial"
    };

    try {
      await axios.post(`${apiBaseUrl}/appointment`, payload, {
        headers: { "Content-Type": "application/json" }
      });
      Swal.fire("Sucesso!", "Agendamento criado com sucesso!", "success")
        .then(() => navigate(-1));
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

      <p className="section-title text-center">Agendar</p>
      <Container fluid className="main-container">
        <Row className="justify-content-center">
          <Col xs={12} lg={10}>
            {isProcessing ? (
              <ProcessingIndicatorComponent messages={messages} />
            ) : (
              <Card className="card-component shadow-sm">
                <Card.Body>
                  {barbershop && (
                    <p className="text-center mb-3">
                      Agendamento em: <strong>{barbershop.name}</strong>
                    </p>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Row>
                      {/* Seu nome */}
                      {!loadingUser && (
                        <Col md={12} className="mb-3">
                          <Form.Group controlId="customer_name">
                            <Form.Label>Seu nome</Form.Label>
                            <Form.Control
                              type="text"
                              name="customer_name"
                              value={appointmentData.customer_name}
                              onChange={handleInputChange}
                              placeholder="Seu nome"
                              disabled={!!user}
                              required
                            />
                          </Form.Group>
                        </Col>
                      )}

                      {/* CPF (só p/ não autenticados) */}
                      {!loadingUser && !user && (
                        <Col md={6} className="mb-3">
                          <Form.Group controlId="customer_cpf">
                            <Form.Label>CPF</Form.Label>
                            <Form.Control
                              type="text"
                              name="customer_cpf"
                              value={appointmentData.customer_cpf}
                              onChange={handleInputChange}
                              placeholder="000.000.000-00"
                              required
                            />
                          </Form.Group>
                        </Col>
                      )}

                      {/* Telefone (só p/ não autenticados) */}
                      {!loadingUser && !user && (
                        <Col md={6} className="mb-3">
                          <Form.Group controlId="customer_phone">
                            <Form.Label>Telefone</Form.Label>
                            <Form.Control
                              type="text"
                              name="customer_phone"
                              value={appointmentData.customer_phone}
                              onChange={handleInputChange}
                              placeholder="(00) 00000-0000"
                              required
                            />
                          </Form.Group>
                        </Col>
                      )}

                      {/* Serviços */}
                      <Col md={12} className="mb-4">
                        <p className="mb-2">Selecione os Serviços</p>
                        <Row>
                          {items.length === 0 ? (
                            <Col xs={12}>
                              <p>Nenhum serviço disponível.</p>
                            </Col>
                          ) : (
                            items.map(item => (
                              <Col md={4} key={item.id}>
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

                      {/* Data e hora */}
                      <Col md={3} className="mb-3">
                        <Form.Group controlId="scheduled_at">
                          <Form.Label>Data e Hora</Form.Label>
                          <Form.Control
                            type="datetime-local"
                            name="scheduled_at"
                            value={appointmentData.scheduled_at}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>

                      {/* Barbeiro */}
                      <Col md={3} className="mb-3">
                        <Form.Group controlId="provider_id">
                          <Form.Label>Barbeiro</Form.Label>
                          <Form.Control
                            as="select"
                            name="provider_id"
                            value={appointmentData.provider_id}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Selecione</option>
                            {barbers.map(b => (
                              <option key={b.user_id} value={b.user_id}>
                                {b.first_name}
                              </option>
                            ))}
                          </Form.Control>
                        </Form.Group>
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
                      <Button type="submit">Agendar</Button>
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
};

export default AppointmentCreatePage;
