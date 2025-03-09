// SchedulingListPage.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import { useParams, useNavigate } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiBaseUrl } from "../../config";

const SchedulingListPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [barbershop, setBarbershop] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);

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
        const params = {
          entity_id: barbershopId,
          entity_name: "barbershop",
        };

        const response = await axios.get(`${apiBaseUrl}/appointment/listbyentity`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          params,
        });

        let appointmentsData = response.data.appointments || [];
        appointmentsData.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
        setAppointments(appointmentsData);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        const errorMessage =
          error.response?.data?.message || "Erro ao carregar agendamentos.";
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
      
      <p className="section-title text-center">Agendamentos</p>
      {loading ? (
        <ProcessingIndicatorComponent messages={messages} />
      ) : (
        <Container className="main-container" fluid>
          <Row className="section-row justify-content-center">
            <Col xs={12} lg={10} className="section-col">
              {barbershop && (
                <Row className="mb-3">
                  <Col>
                  </Col>
                </Row>
              )}

              {appointments.length === 0 ? (
                <Row>
                  <Col className="text-center">
                    <p>Nenhum agendamento encontrado.</p>
                    <Button
                      variant="primary"
                      className="action-button"
                      onClick={() => navigate(-1)}
                    >
                      Voltar
                    </Button>
                  </Col>
                </Row>
              ) : (
                <Row className="inner-row">
                  {appointments.map((appointment) => (
                    <Col
                      md={12}
                      key={appointment.id}
                      className="inner-col mb-3"
                    >
                      <Card className="card-component shadow-sm h-100">
                        <Card.Body>
                          <Card.Title className="mb-2">
                            {appointment.appointment_type.toUpperCase()}
                          </Card.Title>
                          <Card.Subtitle className="mb-3 text-muted">
                            {new Date(appointment.scheduled_at).toLocaleString("pt-BR")}
                          </Card.Subtitle>
                          <Card.Text>
                            <strong>Status:</strong> {appointment.status} <br />
                            <strong>Duração:</strong> {appointment.duration} minutos <br />
                            <strong>Barbeiro (ID):</strong> {appointment.provider_id} <br />
                            <strong>Observações:</strong>{" "}
                            {appointment.notes || "Nenhuma"}
                          </Card.Text>
                          <Button
                            variant="primary"
                            className="action-button"
                            onClick={() =>
                              navigate(`/appointment/view/${appointment.id}`)
                            }
                          >
                            Ver Detalhes
                          </Button>
                        </Card.Body>
                        <Card.Footer>
                          <small className="text-muted">
                            Criado em:{" "}
                            {new Date(appointment.created_at).toLocaleString(
                              "pt-BR"
                            )}
                          </small>
                        </Card.Footer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Col>
          </Row>
        </Container>
      )}
    </>
  );
};

export default SchedulingListPage;
