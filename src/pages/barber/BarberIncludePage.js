import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button } from "react-bootstrap";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";
import Swal from "sweetalert2";
import { Link, useParams } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

const BarbershopIncludePage = () => {
  const { slug } = useParams();
  const [barbershop, setBarbershop] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Carrega os dados da barbearia
  useEffect(() => {
    const fetchBarbershop = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${apiBaseUrl}/barbershop/view/${slug}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setBarbershop(response.data.barbershop);
        setBarbers(response.data.barbers);
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
        setLoading(false);
      }
    };

    fetchBarbershop();
  }, [slug]);

  const handleBarberAvatarError = (e) => {
    e.target.src = "/images/user.png";
  };

  // Função para remover o barbeiro
  const handleRemoveBarber = async (barberId) => {
    try {
      const result = await Swal.fire({
        title: "Você tem certeza?",
        text: "Esse barbeiro será desvinculado da barbearia.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, desvincular",
        cancelButtonText: "Cancelar",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });

      if (result.isConfirmed) {
        setIsProcessing(true);

        const requestBody = {
          barber_id: barberId,
          barbershop_id: barbershop.id,
        };

        try {
          await axios.delete(`${apiBaseUrl}/barber`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            data: requestBody,
          });

          Swal.fire({
            icon: "success",
            title: "Desvinculado!",
            text: "O barbeiro foi desvinculado com sucesso.",
            customClass: {
              popup: "custom-swal",
              title: "custom-swal-title",
              content: "custom-swal-text",
            },
          });

          setBarbers((prevBarbers) =>
            prevBarbers.filter((barber) => barber.id !== barberId)
          );
        } catch (error) {
          const errorMessage =
            error.response?.data?.message || "Erro ao desvincular o barbeiro.";
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
          setIsProcessing(false);
        }
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: "Erro ao confirmar a exclusão.",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
    }
  };

  const handleAddBarber = async () => {
    const { value: email } = await Swal.fire({
      title: "Adicionar Barbeiro",
      text: "Digite o email do novo barbeiro para associar:",
      input: "email",
      inputPlaceholder: "Digite o email aqui...",
      showCancelButton: true,
      confirmButtonText: "Enviar",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "custom-swal",
        title: "custom-swal-title",
        content: "custom-swal-text",
      },
    });

    if (email) {
      setIsProcessing(true);

      const requestBody = {
        barbershop_id: barbershop?.id,
        email,
      };

      try {
        await axios.post(`${apiBaseUrl}/barber`, requestBody, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        Swal.fire({
          icon: "success",
          title: "Sucesso!",
          text: "O novo barbeiro foi associado com sucesso.",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });

        const response = await axios.get(
          `${apiBaseUrl}/barbershop/view/${slug}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setBarbers(response.data.barbers);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Erro ao associar o barbeiro.";
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
        setIsProcessing(false);
      }
    }
  };

  // Renderiza apenas o ProcessingIndicatorComponent durante as ações/processamentos
  if (isProcessing) {
    return (
      <>
        <ProcessingIndicatorComponent
          messages={[
            "Processando....",
            "Verificando lista de barbeiros...",
            "Quase pronto! Apenas um momento.",
          ]}
        />
      </>
    );
  }

  return (
    <>
      <NavlogComponent />
      {loading ? (
        <ProcessingIndicatorComponent
          messages={[
            "Carregando dados da barbearia...",
            "Verificando barbeiros...",
          ]}
        />
      ) : (
        <Container>
          {barbershop && (
            <Card>
              <Card.Body>
                <Row>
                  <Col md={12} className="text-center">
                    <p className="labeltitle h7 text-uppercase">
                      {barbershop.name}{" "}
                      <img
                        src={
                          barbershop.logo
                            ? `${storageUrl}/${barbershop.logo}`
                            : "/images/barbershoplogo.png"
                        }
                        alt={barbershop.name}
                        className="rounded-circle"
                        style={{
                          height: "50px",
                          width: "50px",
                          objectFit: "cover",
                        }}
                      />
                    </p>
                  </Col>
                  <Col md={12}>
                    <p className="labeltitle h4 text-center text-uppercase">
                      Barbeiros
                    </p>
                    {barbers.length === 0 ? (
                      <p className="text-center">Nenhum barbeiro encontrado.</p>
                    ) : (
                      <Table
                        striped
                        bordered
                        hover
                        responsive
                        className="table1"
                      >
                        <thead>
                          <tr>
                            <th>Avatar</th>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Ação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {barbers.map((barber) => (
                            <tr key={barber.id}>
                              <td className="text-center">
                                <img
                                  src={
                                    barber.avatar
                                      ? `${storageUrl}/${barber.avatar}`
                                      : "/images/user.png"
                                  }
                                  alt={barber.first_name}
                                  className="rounded-circle"
                                  style={{
                                    height: "50px",
                                    width: "50px",
                                    objectFit: "cover",
                                  }}
                                  onError={handleBarberAvatarError}
                                />
                              </td>
                              <td>
                                <Link
                                  to={`/barber/view/${barber.user_name}`}
                                  style={{ textDecoration: "none" }}
                                >
                                  {barber.first_name}
                                </Link>
                              </td>
                              <td>{barber.email}</td>
                              <td className="text-center">
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleRemoveBarber(barber.id)}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? "Processando..." : "Excluir"}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                    <div className="text-center">
                      <Button variant="success" onClick={handleAddBarber}>
                        Associar Novo Barbeiro
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Container>
      )}
    </>
  );
};

export default BarbershopIncludePage;
