import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import NavlogComponent from "../components/NavlogComponent";
import ProcessingIndicatorComponent from "../components/ProcessingIndicatorComponent";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../config";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [barbershops, setBarbershops] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [isLoadingBarbershops, setIsLoadingBarbershops] = useState(true);
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(true);

  useEffect(() => {
    const fetchBarbershops = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        };
        const response = await axios.get(`${apiBaseUrl}/barbershop`, {
          headers,
        });

        if (response?.data?.barbershops) {
          setBarbershops(response.data.barbershops.data);
        } else {
          setBarbershops([]);
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro ao carregar barbearias.",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
        setBarbershops([]);
      } finally {
        setIsLoadingBarbershops(false);
      }
    };

    fetchBarbershops();
  }, []);

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        };
        const response = await axios.get(`${apiBaseUrl}/barber`, { headers });

        if (response?.data?.barbers) {
          setBarbers(response.data.barbers.data);
        } else {
          setBarbers([]);
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro ao carregar barbeiros.",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
        setBarbers([]);
      } finally {
        setIsLoadingBarbers(false);
      }
    };

    fetchBarbers();
  }, []);

  const handleBarberAvatarError = (e) => {
    e.target.src = "images/user.png";
  };

  const handleBarbershopLogoError = (e) => {
    e.target.src = "images/logo.png";
  };

  return (
    <>
      <NavlogComponent />
      <Container>
        <Row className="justify-content-center mt-4">
          <Col md={12}>
            <Card>
              <p className="label-barbershop h5 text-center text-uppercase">
                Barbearias
              </p>
              <Card.Body>
                {isLoadingBarbershops ? (
                  <Col xs={12} className="text-center">
                    <ProcessingIndicatorComponent
                      messages={[
                        "Carregando as barbearias...",
                        "Estamos buscando as informações.",
                        "Quase pronto! Apenas um momento.",
                      ]}
                    />
                  </Col>
                ) : (
                  <Row>
                    <>
                      {barbershops.length > 0 ? (
                        barbershops.map((barbershop) => (
                          <Col md={4} key={barbershop.id} className="m-2 p-2">
                            <Card
                              className="card-barbershop m-2 p-2" // Borda arredondada
                            >
                              <div
                                className="background-image"
                                style={{
                                  backgroundImage: `url('${storageUrl}/${
                                    barbershop.logo || "images/logo.png"
                                  }')`,
                                }}
                              />
                              <Link
                                to={`/barbershop/view/${barbershop.slug}`}
                                style={{ textDecoration: "none" }}
                              >
                                <img
                                  src={`${storageUrl}/${
                                    barbershop.logo || "images/logo.png"
                                  }`}
                                  className="rounded-circle img-logo-barbershop-show"
                                  style={{
                                    margin: "0 auto",
                                    display: "block",
                                    width: "150px", // Define o tamanho menor para a logo
                                    height: "150px", // Define o tamanho menor para a logo
                                  }}
                                  alt={barbershop.name}
                                  onError={handleBarbershopLogoError}
                                />
                              </Link>
                              <Card.Body>
                                <Link
                                  to={`/barbershop/show/${barbershop.id}`}
                                  style={{ textDecoration: "none" }}
                                >
                                  <p className="label-barbershop h6 text-center">
                                    {barbershop.name}
                                  </p>
                                </Link>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))
                      ) : (
                        <Col xs={12} className="text-center">
                          <p className="text-muted">
                            Nenhuma barbearia encontrada.
                          </p>
                          <Link to="/barbershop/create">
                            <Button variant="primary">
                              Adicionar Nova Barbearia
                            </Button>
                          </Link>
                        </Col>
                      )}
                    </>
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Apenas exibe a seção de barbeiros se houver dados */}
        <Row className="justify-content-center mt-4">
          <Col md={12}>
            <Card>
              <p className="label-barber h6 text-center text-uppercase">
                Barbeiros
              </p>
              <Card.Body>
                {isLoadingBarbers ? (
                  <Col xs={12} className="text-center">
                    <ProcessingIndicatorComponent
                      messages={[
                        "Carregando as barbeiros...",
                        "Estamos buscando as informações.",
                        "Quase pronto! Apenas um momento.",
                      ]}
                    />
                  </Col>
                ) : (
                  <Row>
                    <>
                      {barbers.length > 0 ? (
                        barbers.map((barber) => (
                          <Col md={3} key={barber.id}>
                            <Card className="card-barber text-center d-flex flex-column justify-content-center align-items-center m-4 p-4">
                              <Card.Body>
                                <Link
                                  to={`/barber/view/${barber.user.user_name}`}
                                  style={{ textDecoration: "none" }}
                                >
                                  <img
                                    src={
                                      barber.user.avatar
                                        ? `${storageUrl}/${barber.user.avatar}`
                                        : "/images/user.png"
                                    }
                                    alt={barber.user.first_name}
                                    className="rounded-circle img-fluid m-3 img-avatar-user"
                                    onError={handleBarberAvatarError}
                                    style={{
                                      margin: "0 auto",
                                      display: "block",
                                      width: "80px", // Define o tamanho menor para a logo
                                      height: "80px", // Define o tamanho menor para a logo
                                    }}
                                  />
                                  <p className="label-barber h6  text-center">{barber.user.first_name}</p>
                                </Link>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))
                      ) : (
                        <Col xs={12} className="text-center">
                          <p className="text-muted">
                            Nenhuma barbeiro encontrado.
                          </p>
                        </Col>
                      )}
                    </>
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Dashboard;
