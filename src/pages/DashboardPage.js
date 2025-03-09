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
        const response = await axios.get(`${apiBaseUrl}/barbershop`, { headers });
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
      <Container className="main-container" fluid>
        {/* Seção de Barbearias */}
        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="section-col">
            <Card className="card-component shadow-sm">
              <p className="section-title text-center">Barbearias</p>
              <Card.Body className="card-body">
                {isLoadingBarbershops ? (
                  <Col xs={12} className="loading-section">
                    <ProcessingIndicatorComponent
                      messages={[
                        "Carregando as barbearias...",
                        "Estamos buscando as informações.",
                        "Quase pronto! Apenas um momento.",
                      ]}
                    />
                  </Col>
                ) : (
                  <>
                    {barbershops.length > 0 ? (
                      <Row className="inner-row">
                        {barbershops.map((barbershop) => (
                          <Col key={barbershop.id} xs={12} md={6} lg={4} className="inner-col mb-4">
                            <Card className="inner-card h-100">
                              {/* Background with logo and blur */}
                              <div
                                className="card-bg"
                                style={{
                                  backgroundImage: `url('${storageUrl}/${barbershop.logo || "images/logo.png"}')`
                                }}
                              />
                              {/* Card content overlay */}
                              <Card.Body className="inner-card-body card-content d-flex flex-column justify-content-center">
                                <Link
                                  to={`/barbershop/view/${barbershop.slug}`}
                                  className="link-component text-center"
                                >
                                  <img
                                    src={`${storageUrl}/${barbershop.logo || "images/logo.png"}`}
                                    className="img-component mb-3"
                                    alt={barbershop.name}
                                    onError={handleBarbershopLogoError}
                                  />
                                  <p className="item-title">{barbershop.name}</p>
                                </Link>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <Col xs={12} className="empty-section text-center">
                        <p className="empty-text">Nenhuma barbearia encontrada.</p>
                        <Link to="/barbershop/create" className="link-component">
                          <Button variant="primary" className="action-button">
                            Adicionar Nova Barbearia
                          </Button>
                        </Link>
                      </Col>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Seção de Barbeiros */}
        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="section-col">
            <Card className="card-component shadow-sm">
              <p className="section-title text-center">Barbeiros</p>
              <Card.Body className="card-body">
                {isLoadingBarbers ? (
                  <Col xs={12} className="loading-section">
                    <ProcessingIndicatorComponent
                      messages={[
                        "Carregando os barbeiros...",
                        "Estamos buscando as informações.",
                        "Quase pronto! Apenas um momento.",
                      ]}
                    />
                  </Col>
                ) : (
                  <>
                    {barbers.length > 0 ? (
                      <Row className="inner-row">
                        {barbers.map((barber) => (
                          <Col key={barber.id} xs={12} sm={6} md={4} lg={3} className="inner-col mb-4">
                            <Card className="inner-card h-100">
                              <Card.Body className="inner-card-body d-flex flex-column justify-content-center">
                                <Link
                                  to={`/barber/view/${barber.user.user_name}`}
                                  className="link-component text-center"
                                >
                                  <img
                                    src={
                                      barber.user.avatar
                                        ? `${storageUrl}/${barber.user.avatar}`
                                        : "/images/user.png"
                                    }
                                    alt={barber.user.first_name}
                                    className="img-component mb-3"
                                    onError={handleBarberAvatarError}
                                  />
                                  <p className="item-title">{barber.user.first_name}</p>
                                </Link>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <Col xs={12} className="empty-section text-center">
                        <p className="empty-text">Nenhum barbeiro encontrado.</p>
                      </Col>
                    )}
                  </>
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
