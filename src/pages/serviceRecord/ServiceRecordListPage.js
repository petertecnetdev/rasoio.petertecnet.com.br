import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import { useParams, useNavigate, Link } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiBaseUrl } from "../../config";

// Função que retorna a classe CSS baseada no status (enum: 'pending', 'completed', 'cancelled')
const getStatusClass = (status) => {
  if (!status) return "";
  const s = status.toLowerCase();
  if (s === "pending") return "pending";
  if (s === "completed") return "completed";
  if (s === "cancelled") return "cancel";
  return "";
};

const ServiceRecordListPage = () => {
  const { slug, username } = useParams();
  const navigate = useNavigate();

  const [headerInfo, setHeaderInfo] = useState(null); // Dados da entidade ou do prestador
  const [serviceRecords, setServiceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);

  // Função para enriquecer cada atendimento com os nomes dos envolvidos
  const enrichServiceRecords = async (recordsData) => {
    const token = localStorage.getItem("token");
    const enriched = await Promise.all(
      recordsData.map(async (record) => {
        let enrichedRecord = { ...record };

        // Nome do cliente
        if (record.client_id) {
          try {
            const clientRes = await axios.get(`${apiBaseUrl}/user/show/${record.client_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            enrichedRecord.client_first_name = clientRes.data.user.first_name || "Não identificado";
          } catch (error) {
            enrichedRecord.client_first_name = "Não identificado";
          }
        } else {
          enrichedRecord.client_first_name = "Não identificado";
        }

        // Nome do prestador
        if (record.provider_id) {
          try {
            const providerRes = await axios.get(`${apiBaseUrl}/user/show/${record.provider_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            enrichedRecord.provider_first_name = providerRes.data.user.first_name || "Não identificado";
          } catch (error) {
            enrichedRecord.provider_first_name = "Não identificado";
          }
        } else {
          enrichedRecord.provider_first_name = "Não identificado";
        }

        // Nome de quem registrou o atendimento
        if (record.registered_by) {
          try {
            const registeredRes = await axios.get(`${apiBaseUrl}/user/show/${record.registered_by}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            enrichedRecord.registered_by_first_name = registeredRes.data.user.first_name || "Não identificado";
          } catch (error) {
            enrichedRecord.registered_by_first_name = "Não identificado";
          }
        } else {
          enrichedRecord.registered_by_first_name = "Não identificado";
        }

        // Enriquecer com os nomes dos serviços
        if (record.service_ids) {
          const serviceIds = typeof record.service_ids === "string"
            ? JSON.parse(record.service_ids)
            : record.service_ids;
          if (Array.isArray(serviceIds)) {
            const serviceNames = await Promise.all(
              serviceIds.map(async (id) => {
                try {
                  const res = await axios.get(`${apiBaseUrl}/item/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  return res.data.item.name;
                } catch (err) {
                  return "";
                }
              })
            );
            enrichedRecord.service_names = serviceNames.filter((name) => name !== "");
          } else {
            enrichedRecord.service_names = [];
          }
        } else {
          enrichedRecord.service_names = [];
        }

        return enrichedRecord;
      })
    );
    return enriched;
  };

  // Função para cancelar um atendimento (muda o status para "cancelled")
  const cancelServiceRecord = async (id) => {
    const token = localStorage.getItem("token");
    Swal.fire({
      title: "Confirmar cancelamento",
      text: "Deseja realmente cancelar este atendimento?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, cancelar",
      cancelButtonText: "Não, manter",
      customClass: {
        popup: "custom-swal",
        title: "custom-swal-title",
        content: "custom-swal-text",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${apiBaseUrl}/service-record/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          Swal.fire({
            title: "Cancelado",
            text: "Atendimento cancelado com sucesso.",
            icon: "success",
            customClass: {
              popup: "custom-swal",
              title: "custom-swal-title",
              content: "custom-swal-text",
            },
          });
          setServiceRecords((prev) =>
            prev.map((record) =>
              record.id === id ? { ...record, status: "cancelled" } : record
            )
          );
        } catch (error) {
          Swal.fire({
            title: "Erro",
            text:
              error.response?.data?.error ||
              "Erro ao cancelar o atendimento. Tente novamente.",
            icon: "error",
            customClass: {
              popup: "custom-swal",
              title: "custom-swal-title",
              content: "custom-swal-text",
            },
          });
        }
      }
    });
  };

  // Função para identificar se o erro é referente à ausência de atendimentos
  const isNoServiceRecordsError = (error) => {
    const status = error.response?.status;
    const errorMsg = (error.response?.data?.error || "").toLowerCase();
    const messageMsg = (error.response?.data?.message || "").toLowerCase();
    return (
      status === 404 ||
      errorMsg.includes("nenhum atendimento") ||
      messageMsg.includes("nenhum atendimento")
    );
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const sortRecords = (data) => {
      return data.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
    };

    // Rota: Atendimentos da barbearia (/service-record/listbyentity)
    const fetchBarbershopRecords = async () => {
      setMessages(["Carregando informações da barbearia..."]);
      try {
        const resBarbershop = await axios.get(
          `${apiBaseUrl}/barbershop/view/${slug}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const barbershopData =
          resBarbershop.data.barbershop || resBarbershop.data;
        setHeaderInfo(barbershopData);

        setMessages(["Carregando atendimentos..."]);
        const params = {
          entity_id: barbershopData.id,
          entity_name: "barbershop",
        };
        const resRecords = await axios.get(
          `${apiBaseUrl}/service-record/listbyentity`,
          { headers: { Authorization: `Bearer ${token}` }, params }
        );
        const sorted = sortRecords(resRecords.data.service_records || []);
        const enriched = await enrichServiceRecords(sorted);
        setServiceRecords(enriched);
      } catch (error) {
        if (isNoServiceRecordsError(error)) {
          setServiceRecords([]);
        } else {
          const errorMessage =
            error.response?.data?.message ||
            "Erro ao carregar atendimentos ou não há atendimentos para esta barbearia.";
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

    // Rota: Atendimentos do barbeiro (/service-record/listbyprovider)
    const fetchBarberRecords = async () => {
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

        setMessages(["Carregando atendimentos..."]);
        const params = {
          provider_id: barberData.user_id,
          app_id: 1,
          entity_name: "barbershop",
          entity_id: barberData.barbershops[0]?.id,
        };
        const resRecords = await axios.get(
          `${apiBaseUrl}/service-record/listbyprovider`,
          { headers: { Authorization: `Bearer ${token}` }, params }
        );
        const sorted = sortRecords(resRecords.data.service_records || []);
        const enriched = await enrichServiceRecords(sorted);
        setServiceRecords(enriched);
      } catch (error) {
        if (isNoServiceRecordsError(error)) {
          setServiceRecords([]);
        } else {
          const errorMessage =
            error.response?.data?.message || "Erro ao carregar atendimentos.";
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

    // Rota: Meus atendimentos (/service-record/listmy)
    const fetchMyRecords = async () => {
      setMessages(["Carregando seus atendimentos..."]);
      try {
        const resRecords = await axios.get(
          `${apiBaseUrl}/service-record/listmy`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const sorted = sortRecords(resRecords.data.service_records || []);
        const enriched = await enrichServiceRecords(sorted);
        setServiceRecords(enriched);
      } catch (error) {
        if (isNoServiceRecordsError(error)) {
          setServiceRecords([]);
        } else {
          const errorMessage =
            error.response?.data?.message || "Erro ao carregar atendimentos.";
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
      fetchBarbershopRecords();
    } else if (username) {
      fetchBarberRecords();
    } else {
      fetchMyRecords();
    }
  }, [slug, username, navigate]);

  let headerTitle = "";
  if (slug && headerInfo) {
    headerTitle = `Atendimentos da ${headerInfo.name}`;
  } else if (username && headerInfo) {
    headerTitle = `Atendimentos do barbeiro ${headerInfo.user.first_name}`;
  } else {
    headerTitle = "Meus Atendimentos";
  }

  return (
    <>
      <NavlogComponent />
      <p className="section-title text-center">{headerTitle}</p>
      {loading ? (
        <ProcessingIndicatorComponent messages={messages} />
      ) : (
        <Container className="main-container" fluid>
          <Row className="section-row justify-content-center">
            <Col xs={12} lg={10} className="section-col">
              {serviceRecords.length === 0 ? (
                <Row>
                  <Col className="text-center">
                    <p className="text-white">Nenhum atendimento encontrado.</p>
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
                  {serviceRecords.map((record) => (
                    <Col
                      md={12}
                      key={record.id}
                      className={`inner-col mb-3 ${getStatusClass(record.status)}`}
                    >
                      <Card
                        className={`card-component shadow-sm h-100 ${getStatusClass(
                          record.status
                        )}`}
                      >
                        <Card.Body>
                          {/* Renderização condicional com base na rota */}
                          {/* Meus atendimentos */}
                          {!slug && !username && (
                            <>
                              <Card.Title className="mb-2">
                                Criado em:{" "}
                                {new Date(record.created_at).toLocaleString("pt-BR")}
                              </Card.Title>
                              <Card.Text>
                                <strong>Serviços: </strong>
                                {record.service_names && record.service_names.length > 0
                                  ? record.service_names.join(", ")
                                  : "Não informado"}
                                <br />
                                <strong>Cliente: </strong>
                                {record.client_first_name}
                                <br />
                                <strong>Prestador: </strong>
                                {record.provider_first_name}
                                <br />
                                <strong>Registrado por: </strong>
                                {record.registered_by_first_name}
                                <br />
                                <strong>Pagamento: </strong>
                                {record.payment_method} - R$ {record.total_price}
                                <br />
                                <strong>Desconto: </strong>
                                {record.discount}
                              </Card.Text>
                            </>
                          )}
                          {/* Atendimentos da barbearia */}
                          {slug && (
                            <>
                              <Card.Title className="mb-2">
                                Criado em:{" "}
                                {new Date(record.created_at).toLocaleString("pt-BR")}
                              </Card.Title>
                              <Card.Text>
                                <strong>Cliente: </strong>
                                {record.client_first_name}
                                <br />
                                <strong>Prestador: </strong>
                                {record.provider_first_name}
                                <br />
                                <strong>Status: </strong>
                                {record.status}
                                <br />
                                <strong>Serviços: </strong>
                                {record.service_names && record.service_names.length > 0
                                  ? record.service_names.join(", ")
                                  : "Não informado"}
                                <br />
                                <strong>Registrado por: </strong>
                                {record.registered_by_first_name}
                              </Card.Text>
                            </>
                          )}
                          {/* Atendimentos do barbeiro */}
                          {username && (
                            <>
                              <Card.Title className="mb-2">
                                Criado em:{" "}
                                {new Date(record.created_at).toLocaleString("pt-BR")}
                              </Card.Title>
                              <Card.Text>
                                <strong>Cliente: </strong>
                                {record.client_first_name}
                                <br />
                                <strong>Serviços: </strong>
                                {record.service_names && record.service_names.length > 0
                                  ? record.service_names.join(", ")
                                  : "Não informado"}
                                <br />
                                <strong>Barbearia: </strong>
                                <Link to={`/barbershop/view/${record.entity_id}`}>
                                  {record.entity_name === "barbershop"
                                    ? "Ver barbearia"
                                    : "Não identificado"}
                                </Link>
                                <br />
                                <strong>Status: </strong>
                                {record.status}
                                <br />
                                <strong>Registrado por: </strong>
                                {record.registered_by_first_name}
                              </Card.Text>
                            </>
                          )}
                          <div className="d-flex gap-2">
                            {record.status.toLowerCase() !== "cancelled" && (
                              <Button
                                variant="danger"
                                className="action-button"
                                onClick={() => cancelServiceRecord(record.id)}
                              >
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </Card.Body>
                        <Card.Footer>
                          <small className="text-muted">
                            Criado em:{" "}
                            {new Date(record.created_at).toLocaleString("pt-BR")}
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

export default ServiceRecordListPage;
