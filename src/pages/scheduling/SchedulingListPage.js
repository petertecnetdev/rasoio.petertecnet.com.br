import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import { useParams, useNavigate } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiBaseUrl } from "../../config";

const SchedulingListPage = () => {
  const { slug } = useParams(); // Recebemos o slug da barbearia
  const navigate = useNavigate();
  const [barbershop, setBarbershop] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);

  // Busca os dados da barbearia para obter o ID e, em seguida, os agendamentos
  useEffect(() => {
    const fetchBarbershop = async () => {
      setMessages(["Carregando informações da barbearia..."]);
      try {
        const response = await axios.get(`${apiBaseUrl}/barbershop/view/${slug}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const barbershopData = response.data.barbershop || response.data;
        setBarbershop(barbershopData);
        fetchAppointments(barbershopData.id);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        const errorMessage =
          error.response?.data?.message ||
          "Erro ao carregar informações da barbearia.";
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: errorMessage,
        });
      }
    };

    const fetchAppointments = async (barbershopId) => {
      try {
        setMessages(["Carregando agendamentos..."]);
        // Monta os parâmetros conforme o esperado pela API
        const params = {
          entity_id: barbershopId,
          entity_name: "barbershop",
        };

        // Como o endpoint é GET, os parâmetros são enviados via query string
        const response = await axios.get(`${apiBaseUrl}/appointment/listbyentity`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          params,
        });

        let appointmentsData = response.data.appointments || [];
        // Ordena os agendamentos em ordem cronológica (mais cedo primeiro)
        appointmentsData.sort(
          (a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)
        );
        setAppointments(appointmentsData);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        const errorMessage =
          error.response?.data?.message ||
          "Erro ao carregar agendamentos.";
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: errorMessage,
        });
      } finally {
        setMessages([]);
        setLoading(false);
      }
    };

    if (slug) {
      fetchBarbershop();
    }
  }, [slug, navigate]);

  return (
    <>
      <NavlogComponent />
      {loading ? (
        <ProcessingIndicatorComponent messages={messages} />
      ) : (
        <Container className="mt-4">
          {barbershop && (
            <Row className="mb-4">
              <Col>
                <h3 className="text-center">
                  Agendamentos de {barbershop.name}
                </h3>
              </Col>
            </Row>
          )}
          {appointments.length === 0 ? (
            <Row>
              <Col className="text-center">
                <p>Nenhum agendamento encontrado.</p>
                <Button variant="primary" onClick={() => navigate(-1)}>
                  Voltar
                </Button>
              </Col>
            </Row>
          ) : (
            <Row>
              {appointments.map((appointment) => (
                <Col md={12} key={appointment.id} className="mb-4">
                  <Card>
                    <Card.Body>
                      <Card.Title>
                        {appointment.appointment_type.toUpperCase()}
                      </Card.Title>
                      <Card.Subtitle className="mb-2 text-muted">
                        {new Date(appointment.scheduled_at).toLocaleString("pt-BR")}
                      </Card.Subtitle>
                      <Card.Text>
                        <strong>Status:</strong> {appointment.status} <br />
                        <strong>Duração:</strong> {appointment.duration} minutos <br />
                        <strong>Barbeiro:</strong> {appointment.provider_id} <br />
                        <strong>Observações:</strong> {appointment.notes || "Nenhuma"}
                      </Card.Text>
                      <Button variant="primary" onClick={() => navigate(`/appointment/view/${appointment.id}`)}>
                        Ver Detalhes
                      </Button>
                    </Card.Body>
                    <Card.Footer>
                      <small className="text-muted">
                        Criado em: {new Date(appointment.created_at).toLocaleString("pt-BR")}
                      </small>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      )}
    </>
  );
};

export default SchedulingListPage;
