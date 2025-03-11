import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import { useParams, useNavigate, Link } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiBaseUrl } from "../../config";

// Retorna a classe CSS baseada no status
const getStatusClass = (status) => {
  if (!status) return "";
  const s = status.toLowerCase();
  if (s === "pending") return "pending";
  if (s === "confirmed") return "confirm";
  if (s === "cancelled") return "cancel";
  if (s === "completed") return "completed";
  return "";
};

// Retorna o nome do status para exibição no card-title
const getStatusName = (status) => {
  if (!status) return "";
  const s = status.toLowerCase();
  if (s === "pending") return "Pendente";
  if (s === "confirmed") return "Confirmado";
  if (s === "cancelled") return "Cancelado";
  if (s === "completed") return "Finalizado";
  return "";
};

// Retorna o texto do status em português para os filtros
const getStatusText = (status) => {
  if (!status) return "";
  const s = status.toLowerCase();
  if (s === "pending") return "Pendentes";
  if (s === "confirmed") return "Confirmados";
  if (s === "cancelled") return "Cancelados";
  if (s === "completed") return "Finalizados";
  return status;
};

const AppointmentListPage = () => {
  // Pode vir "slug" (barbearia), "username" (barbeiro) ou nenhum (meus agendamentos)
  const { slug, username } = useParams();
  const navigate = useNavigate();

  const [headerInfo, setHeaderInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  // Estado para filtro de status; por padrão, mostra "confirmed"
  const [filterStatus, setFilterStatus] = useState("confirmed");

  // Enriquecer agendamentos com nomes dos envolvidos
  const enrichAppointments = async (appointmentsData) => {
    const token = localStorage.getItem("token");
    const enriched = await Promise.all(
      appointmentsData.map(async (appointment) => {
        let enrichedAppointment = { ...appointment };

        // Cliente
        if (appointment.client_id) {
          try {
            const clientRes = await axios.get(
              `${apiBaseUrl}/user/show/${appointment.client_id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            enrichedAppointment.client_first_name =
              clientRes.data.user.first_name || "Não identificado";
          } catch (error) {
            enrichedAppointment.client_first_name = "Não identificado";
          }
        } else {
          enrichedAppointment.client_first_name = "Não identificado";
        }

        // Barbeiro (provider)
        if (appointment.provider_id) {
          try {
            const providerRes = await axios.get(
              `${apiBaseUrl}/user/show/${appointment.provider_id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            enrichedAppointment.provider_first_name =
              providerRes.data.user.first_name || "Não identificado";
          } catch (error) {
            enrichedAppointment.provider_first_name = "Não identificado";
          }
        } else {
          enrichedAppointment.provider_first_name = "Não identificado";
        }

        // Quem registrou o agendamento
        if (appointment.registered_by) {
          try {
            const registeredRes = await axios.get(
              `${apiBaseUrl}/user/show/${appointment.registered_by}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            enrichedAppointment.registered_by_first_name =
              registeredRes.data.user.first_name || "Não identificado";
          } catch (error) {
            enrichedAppointment.registered_by_first_name = "Não identificado";
          }
        } else {
          enrichedAppointment.registered_by_first_name = "Não identificado";
        }

        return enrichedAppointment;
      })
    );
    return enriched;
  };

  // Cancelar agendamento
  const cancelAppointment = async (id) => {
    const token = localStorage.getItem("token");
    Swal.fire({
      title: "Confirmar cancelamento",
      text: "Deseja realmente cancelar este agendamento?",
      icon: "warning",
      showCancelButton: true,
      customClass: {
        popup: "custom-swal",
        title: "custom-swal-title",
        content: "custom-swal-text",
      },
      confirmButtonText: "Sim, cancelar",
      cancelButtonText: "Não, manter",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${apiBaseUrl}/appointment/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          Swal.fire({
            title: "Cancelado",
            text: "Agendamento cancelado com sucesso.",
            customClass: {
              popup: "custom-swal",
              title: "custom-swal-title",
              content: "custom-swal-text",
            },
            icon: "success",
          });
          // Atualiza o status para "cancelled"
          setAppointments((prev) =>
            prev.map((appointment) =>
              appointment.id === id
                ? { ...appointment, status: "cancelled" }
                : appointment
            )
          );
        } catch (error) {
          Swal.fire({
            title: "Erro",
            text:
              error.response?.data?.error ||
              "Erro ao cancelar o agendamento. Tente novamente.",
            customClass: {
              popup: "custom-swal",
              title: "custom-swal-title",
              content: "custom-swal-text",
            },
            icon: "error",
          });
        }
      }
    });
  };

  // Verifica se o erro indica ausência de agendamentos
  const isNoAppointmentsError = (error) => {
    const status = error.response?.status;
    const errorMsg = (error.response?.data?.error || "").toLowerCase();
    const messageMsg = (error.response?.data?.message || "").toLowerCase();
    return (
      status === 404 ||
      errorMsg.includes("nenhum agendamento") ||
      messageMsg.includes("nenhum agendamento")
    );
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const sortAppointments = (data) => {
      return data.sort(
        (a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)
      );
    };

    // Agendamentos da barbearia
    const fetchBarbershopAppointments = async () => {
      setMessages(["Carregando informações da barbearia..."]);
      try {
        const resBarbershop = await axios.get(
          `${apiBaseUrl}/barbershop/view/${slug}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const barbershopData =
          resBarbershop.data.barbershop || resBarbershop.data;
        setHeaderInfo(barbershopData);

        setMessages(["Carregando agendamentos..."]);
        const params = {
          entity_id: barbershopData.id,
          entity_name: "barbershop",
        };
        const resAppointments = await axios.get(
          `${apiBaseUrl}/appointment/listbyentity`,
          { headers: { Authorization: `Bearer ${token}` }, params }
        );
        const sorted = sortAppointments(
          resAppointments.data.appointments || []
        );
        const enriched = await enrichAppointments(sorted);
        setAppointments(enriched);
      } catch (error) {
        if (isNoAppointmentsError(error)) {
          setAppointments([]);
        } else {
          const errorMessage =
            error.response?.data?.message ||
            "Erro ao carregar agendamentos ou ainda não existe agendamentos para esta barbearia.";
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
        }
      } finally {
        setMessages([]);
        setLoading(false);
      }
    };

    // Agendamentos do barbeiro
    const fetchBarberAppointments = async () => {
      setMessages(["Carregando informações do barbeiro..."]);
      try {
        const resBarber = await axios.get(
          `${apiBaseUrl}/barber/view/${username}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const barberData = resBarber.data.barbershop
          ? resBarber.data
          : resBarber.data;
        setHeaderInfo(barberData);

        setMessages(["Carregando agendamentos..."]);
        const params = {
          provider_id: barberData.user_id,
          app_id: 1,
          entity_name: "barbershop",
          entity_id: barberData.barbershops[0]?.id,
        };
        const resAppointments = await axios.get(
          `${apiBaseUrl}/appointment/listbyprovider`,
          { headers: { Authorization: `Bearer ${token}` }, params }
        );
        const sorted = sortAppointments(
          resAppointments.data.appointments || []
        );
        const enriched = await enrichAppointments(sorted);
        setAppointments(enriched);
      } catch (error) {
        if (isNoAppointmentsError(error)) {
          setAppointments([]);
        } else {
          const errorMessage =
            error.response?.data?.message || "Erro ao carregar agendamentos.";
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
        }
      } finally {
        setMessages([]);
        setLoading(false);
      }
    };

    // Meus agendamentos
    const fetchMyAppointments = async () => {
      setMessages(["Carregando seus agendamentos..."]);
      try {
        const resAppointments = await axios.get(
          `${apiBaseUrl}/appointment/listmy`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const sorted = sortAppointments(
          resAppointments.data.appointments || []
        );
        const enriched = await enrichAppointments(sorted);
        setAppointments(enriched);
      } catch (error) {
        if (isNoAppointmentsError(error)) {
          setAppointments([]);
        } else {
          const errorMessage =
            error.response?.data?.message || "Erro ao carregar agendamentos.";
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
        }
      } finally {
        setMessages([]);
        setLoading(false);
      }
    };

    if (slug) {
      fetchBarbershopAppointments();
    } else if (username) {
      fetchBarberAppointments();
    } else {
      fetchMyAppointments();
    }
  }, [slug, username, navigate]);

  // Define o título do cabeçalho
  let headerTitle = "";
  if (slug && headerInfo) {
    headerTitle = `Agendamentos da ${headerInfo.name}`;
  } else if (username && headerInfo) {
    headerTitle = `Agendamentos do barbeiro ${headerInfo.user.first_name}`;
  } else {
    headerTitle = "Meus Agendamentos";
  }

  // Filtra os agendamentos de acordo com o status selecionado
  const filteredAppointments = appointments.filter(
    (appointment) =>
      appointment.status &&
      appointment.status.toLowerCase() === filterStatus.toLowerCase()
  );

  return (
    <>
      <NavlogComponent />
      <p className="section-title text-center">{headerTitle}</p>
      <Container className="main-container" fluid>
        {/* Botões de filtro de status */}
        <Row className="mb-3 justify-content-center">
          <Col xs="auto">
            <Button
              variant={
                filterStatus === "confirmed" ? "primary" : "outline-primary"
              }
              onClick={() => setFilterStatus("confirmed")}
              className="action-button br-confirmed"
            >
              Confirmados
            </Button>
          </Col>
          <Col xs="auto">
            <Button
              variant={
                filterStatus === "pending" ? "primary" : "outline-primary"
              }
              onClick={() => setFilterStatus("pending")}
              className="action-button br-pending"
            >
              Pendentes
            </Button>
          </Col>
          <Col xs="auto">
            <Button
              variant={
                filterStatus === "completed" ? "primary" : "outline-primary"
              }
              onClick={() => setFilterStatus("completed")}
              className="action-button br-completed"
            >
              Finalizados
            </Button>
          </Col>
          <Col xs="auto">
            <Button
              variant={
                filterStatus === "cancelled" ? "primary" : "outline-primary"
              }
              onClick={() => setFilterStatus("cancelled")}
              className="action-button br-cancelled"
            >
              Cancelados
            </Button>
          </Col>
        </Row>
        {loading ? (
          <ProcessingIndicatorComponent messages={messages} />
        ) : (
          <Row className="section-row justify-content-center">
            <Col xs={12} lg={10} className="section-col">
              {filteredAppointments.length === 0 ? (
                <Row>
                  <Col className="text-center">
                    <p className="text-white">
                      Nenhum agendamento encontrado para o status selecionado.
                    </p>
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
                  {filteredAppointments.map((appointment) => (
                    <Col md={4} key={appointment.id} className="inner-col mb-3">
                      <Card
                        className={`card-component shadow-sm h-100 ${getStatusClass(
                          appointment.status
                        )}`}
                      >
                        <p
  className={`text-center  br-${appointment.status}`}
>
  {getStatusName(appointment.status)}
</p>


                        <Card.Body>
                          {/* Renderização condicional com base na rota */}
                          {!slug && !username && (
                            <>
                              <Card.Title className="mb-2">
                                Horário:{" "}
                                {new Date(
                                  appointment.scheduled_at
                                ).toLocaleString("pt-BR")}
                              </Card.Title>
                              <Card.Text>
                                <strong>Barbearia: </strong>
                                <Link
                                  to={`/barbershop/view/${appointment.entity_id}`}
                                >
                                  {appointment.entity_name === "barbershop"
                                    ? "Ver barbearia"
                                    : "Não identificado"}
                                </Link>
                                <br />
                                <strong>Serviços: </strong>
                                {appointment.service_names &&
                                appointment.service_names.length > 0
                                  ? appointment.service_names.join(", ")
                                  : "Não informado"}
                                <br />
                                <strong>Barbeiro: </strong>
                                {appointment.provider_first_name}
                                <br />
                                <strong>Registrado por: </strong>
                                {appointment.registered_by_first_name}
                              </Card.Text>
                            </>
                          )}
                          {slug && (
                            <>
                              <Card.Title className="mb-2">
                                Horário:{" "}
                                {new Date(
                                  appointment.scheduled_at
                                ).toLocaleString("pt-BR")}
                              </Card.Title>
                              <Card.Text>
                                <strong>Cliente: </strong>
                                {appointment.client_first_name}
                                <br />
                                <strong>Barbeiro: </strong>
                                {appointment.provider_first_name}
                                <br />
                                <strong>Status: </strong>
                                {getStatusText(appointment.status)}{" "}
                                {appointment.payment_status &&
                                  `(${appointment.payment_status})`}
                                <br />
                                <strong>Serviços: </strong>
                                {appointment.service_names &&
                                appointment.service_names.length > 0
                                  ? appointment.service_names.join(", ")
                                  : "Não informado"}
                                <br />
                                <strong>Registrado por: </strong>
                                {appointment.registered_by_first_name}
                              </Card.Text>
                            </>
                          )}
                          {username && (
                            <>
                              <Card.Title className="mb-2">
                                Horário:{" "}
                                {new Date(
                                  appointment.scheduled_at
                                ).toLocaleString("pt-BR")}
                              </Card.Title>
                              <Card.Text>
                                <strong>Cliente: </strong>
                                {appointment.client_first_name}
                                <br />
                                <strong>Serviço: </strong>
                                {appointment.service_names &&
                                appointment.service_names.length > 0
                                  ? appointment.service_names.join(", ")
                                  : "Não informado"}
                                <br />
                                <strong>Barbearia: </strong>
                                <Link
                                  to={`/barbershop/view/${appointment.entity_id}`}
                                >
                                  {appointment.entity_name === "barbershop"
                                    ? "Ver barbearia"
                                    : "Não identificado"}
                                </Link>
                                <br />
                                <strong>Status: </strong>
                                {getStatusText(appointment.status)}{" "}
                                {appointment.payment_status &&
                                  `(${appointment.payment_status})`}
                                <br />
                                <strong>Registrado por: </strong>
                                {appointment.registered_by_first_name}
                              </Card.Text>
                            </>
                          )}
                          <div className="d-flex gap-2">
                            {appointment.status.toLowerCase() !==
                              "cancelled" && (
                              <Button
                                variant="danger"
                                className="action-button"
                                onClick={() =>
                                  cancelAppointment(appointment.id)
                                }
                              >
                                Cancelar
                              </Button>
                            )}
                          </div>
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
        )}
      </Container>
    </>
  );
};

export default AppointmentListPage;
