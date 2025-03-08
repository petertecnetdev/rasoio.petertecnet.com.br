import React, { useState, useEffect } from "react";
import { Form, Button, Container, Row, Card, Col } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl } from "../../config";

const SchedulingCreatePage = () => {
  const { slug } = useParams(); // O slug da barbearia é passado na URL
  const navigate = useNavigate();

  const [barbershop, setBarbershop] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [items, setItems] = useState([]);
  const [barbershopId, setBarbershopId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);

  // Dados do agendamento visíveis para o usuário
  // Os campos do formulário são:
  // - Data e Hora do Agendamento
  // - Seleção de Barbeiro
  // - Tipo do Agendamento (select)
  // - Observações
  // - Seleção dos Serviços
  const [schedulingData, setSchedulingData] = useState({
    scheduled_at: "",
    provider_id: "",
    appointment_type: "",
    notes: "",
    service_ids: []
  });

  // Busca os dados da barbearia, barbeiros e serviços
  useEffect(() => {
    const fetchBarbershop = async () => {
      setMessages(["Carregando informações da barbearia e serviços..."]);
      try {
        const response = await axios.get(`${apiBaseUrl}/barbershop/view/${slug}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const barbershopData = response.data.barbershop || response.data;
        setBarbershop(barbershopData);
        setBarbershopId(barbershopData.id);
        setItems(response.data.items || []);
        setBarbers(response.data.barbers || []);
        window.scrollTo(0, 0);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          "Erro ao carregar informações da barbearia.";
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: errorMessage,
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      } finally {
        setMessages([]);
      }
    };

    if (slug) {
      fetchBarbershop();
    }
  }, [slug]);

  // Atualiza os campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSchedulingData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Atualiza os serviços selecionados
  const handleServiceSelection = (e, itemId) => {
    const checked = e.target.checked;
    setSchedulingData((prevData) => {
      let updatedServices = [...prevData.service_ids];
      if (checked) {
        updatedServices.push(itemId);
      } else {
        updatedServices = updatedServices.filter((id) => id !== itemId);
      }
      return { ...prevData, service_ids: updatedServices };
    });
  };

  // Valida os campos obrigatórios
  const validateFields = () => {
    const errors = [];
    if (!schedulingData.scheduled_at) {
      errors.push("A data e hora do agendamento é obrigatória.");
    }
    if (!schedulingData.appointment_type) {
      errors.push("O tipo do agendamento é obrigatório.");
    }
    if (!schedulingData.provider_id) {
      errors.push("Selecione um barbeiro para ser o prestador.");
    }
    if (schedulingData.service_ids.length === 0) {
      errors.push("Selecione ao menos um serviço.");
    }

    if (errors.length > 0) {
      Swal.fire({
        title: "Erro de validação",
        text: errors.join("\n"),
        icon: "error",
        confirmButtonText: "OK",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
      return false;
    }
    return true;
  };

  // Submete o formulário para criar o agendamento
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateFields()) return;

    if (!barbershopId) {
      Swal.fire({
        title: "Erro",
        text: "Não foi possível obter o ID da barbearia.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    setIsProcessing(true);
    setMessages(["Aguarde enquanto criamos o agendamento..."]);

    // Cada serviço tem uma duração média de 25 minutos
    const BASE_DURATION = 25; // minutos
    const totalDuration = schedulingData.service_ids.length * BASE_DURATION;

    // Calcula o expected_end_time baseado na data de agendamento e na duração total
    const scheduledAtDate = new Date(schedulingData.scheduled_at);
    const expectedEndTimeDate = new Date(scheduledAtDate.getTime() + totalDuration * 60000);

    // Recupera os dados do usuário autenticado para obter o client_id
    let clientId = localStorage.getItem("client_id");
    try {
      const authResponse = await axios.get(`${apiBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      clientId = authResponse.data.user.id;
    } catch (error) {
      // Se não conseguir obter o usuário, usa o valor padrão ou exibe um erro
      clientId = localStorage.getItem("client_id") || 1;
    }

    // Monta o payload de envio conforme a model do Appointment
    const payload = {
      app_id: 1,
      entity_name: "barbershop",
      entity_id: barbershopId,
      scheduled_at: schedulingData.scheduled_at,
      service_ids: schedulingData.service_ids,
      expected_end_time: expectedEndTimeDate.toISOString(),
      provider_id: schedulingData.provider_id,
      description: "", // Não exibido no formulário; pode ser preenchido depois
      client_id: clientId,
      registered_by: clientId,
      status: "pendente",
      location: "", // Permite campo nulo
      duration: totalDuration,
      notes: schedulingData.notes,
      payment_status: "pendente",
      appointment_type: schedulingData.appointment_type,
    };

    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      };

      await axios.post(`${apiBaseUrl}/appointment`, payload, { headers });

      Swal.fire({
        title: "Sucesso!",
        text: "Agendamento criado com sucesso!",
        icon: "success",
        confirmButtonText: "OK",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          navigate(-1);
        }
      });
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      if (error.response && error.response.status === 422) {
        const validationErrors = error.response.data.errors;
        let errorMessage = "Os seguintes campos têm erros:\n";
        for (const field in validationErrors) {
          errorMessage += `${field}: ${validationErrors[field].join(", ")}\n`;
        }
        Swal.fire({
          title: "Validação Falhou",
          text: errorMessage,
          icon: "error",
          confirmButtonText: "OK",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      } else {
        Swal.fire({
          title: "Erro",
          text: "Ocorreu um erro ao tentar criar o agendamento. Tente novamente mais tarde.",
          icon: "error",
          confirmButtonText: "OK",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Container>
      <NavlogComponent />
      <Row className="justify-content-center">
        <Col md={12}>
          {isProcessing ? (
            <ProcessingIndicatorComponent messages={messages} />
          ) : (
            <Card>
              <Card.Body>
                <p className="labeltitle h4 text-center text-uppercase">
                  Agendar
                </p>
                {barbershop && (
                  <p className="text-center mb-3">
                    Agendamento em: <strong>{barbershop.name}</strong>
                  </p>
                )}
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={12}>
                      <p className="h6 text-uppercase">
                        Selecione os Serviços que deseja agendar
                      </p>
                      <Row className="m-4">
                        {items.length === 0 ? (
                          <Col xs={12} className="text-center">
                            <p>Nenhum serviço disponível.</p>
                          </Col>
                        ) : (
                          items.map((item) => (
                            <Col md={4} key={item.id} className="m-1">
                              <Form.Check
                                type="checkbox"
                                id={`service-${item.id}`}
                                label={item.name}
                                onChange={(e) => handleServiceSelection(e, item.id)}
                              />
                            </Col>
                          ))
                        )}
                      </Row>
                    </Col>
                    <Col md={3}>
                      <Form.Group controlId="scheduled_at">
                        <Form.Label>Data e Hora</Form.Label>
                        <Form.Control
                          type="datetime-local"
                          name="scheduled_at"
                          value={schedulingData.scheduled_at}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group controlId="provider_id">
                        <Form.Label>Barbeiro</Form.Label>
                        <Form.Control
                          as="select"
                          name="provider_id"
                          value={schedulingData.provider_id}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Selecione</option>
                          {barbers.map((barber) => (
                            <option key={barber.user_id} value={barber.user_id}>
                              {barber.first_name}
                            </option>
                          ))}
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group controlId="appointment_type">
                        <Form.Label>Tipo</Form.Label>
                        <Form.Control
                          as="select"
                          name="appointment_type"
                          value={schedulingData.appointment_type}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Selecione</option>
                          <option value="presencial">Presencial</option>
                          <option value="domiciliar">Domiciliar</option>
                          <option value="online">Online</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col md={12} className="mt-3">
                      <Form.Group controlId="notes">
                        <Form.Label>Observações</Form.Label>
                        <Form.Control
                          as="textarea"
                          name="notes"
                          value={schedulingData.notes}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Button variant="primary" type="submit" disabled={isProcessing} className="mt-3">
                    {isProcessing ? "Criando..." : "Criar Agendamento"}
                  </Button>
                  {messages.length > 0 && (
                    <div className="mt-3">
                      {messages.map((message, index) => (
                        <div key={index} className="alert alert-info">
                          {message}
                        </div>
                      ))}
                    </div>
                  )}
                </Form>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default SchedulingCreatePage;
