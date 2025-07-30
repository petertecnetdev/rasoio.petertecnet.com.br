// src/pages/BarberViewPage.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import "./Barber.css"; 

const BarberViewPage = () => {
  const { username } = useParams();
  const [barber, setBarber] = useState(null);
  const [user, setUser] = useState(null);
  const [barbershops, setBarbershops] = useState([]);
  const [otherBarbers, setOtherBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBarberData = async () => {
      if (!username) {
        Swal.fire("Erro", "O username não foi encontrado na URL.", "error");
        return;
      }

      try {
        // 1) Carrega dados do barbeiro
        const resp = await axios.get(`${apiBaseUrl}/barber/${username}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const { barber: bar, user: usr } = resp.data;
        setBarber(bar || {});
        setUser(usr || {});
        setBarbershops(bar?.barbershops || []);

        // 2) Carrega todos os barbeiros e filtra pelo username atual
        const allResp = await axios.get(`${apiBaseUrl}/barber`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const all = allResp.data.barbers?.data || [];
        const filtered = all.filter((b) => b.user.user_name !== username);
        setOtherBarbers(filtered);
      } catch (error) {
        console.error(error.response?.data);
        Swal.fire(
          "Erro",
          error.response?.data?.error || "Erro ao carregar os dados.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBarberData();
  }, [username]);

  const handleBarberAvatarError = (e) => {
    if (!e.target.src.includes("/images/user.png")) {
      e.target.src = "/images/user.png";
    }
  };

  const handleBarbershopLogoError = (e) => {
    if (!e.target.src.includes("/images/logo.png")) {
      e.target.src = "/images/logo.png";
    }
  };

  if (loading) {
    return (
      <>
        <NavlogComponent />
        <ProcessingIndicatorComponent
          messages={[
            "Carregando os dados do barbeiro...",
            "Organizando as informações.",
            "Quase finalizando! Espere só um pouco.",
          ]}
        />
      </>
    );
  }

  return (
    <>
      <NavlogComponent />
      <Container className="main-container" fluid>
        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="section-col">
            {barber && user && (
              <>
                {/* --- Informações do Barbeiro --- */}
                <Row className="barber-info-row">
                  <Col md={12} className="barber-info-col">
                    <Card className="card-component barber-info-card shadow-sm">
                      <Card.Body className="card-body barber-info-card-body">
                        <Row className="barber-details-row">
                          <Col md={3} className="barber-avatar-col text-center">
                            <img
                              src={
                                user.avatar
                                  ? `${storageUrl}/${user.avatar}`
                                  : "/images/user.png"
                              }
                              alt={user.first_name || "Avatar"}
                              className="img-component barber-avatar"
                              onError={handleBarberAvatarError}
                              style={{
                                width: 100,
                                height: 100,
                                objectFit: "cover",
                                borderRadius: "50%",
                              }}
                            />
                            <p className="barber-name mt-2 h4">
                              {user.first_name}
                            </p>
                            <p className="barber-name m-2 text-warning h6">
                              @{user.user_name}
                            </p>
                            <p className="barber-location">
                              {user.city} - {user.uf}
                            </p>
                          </Col>

                          <Col md={3} />

                          <Col md={3} className="barber-contact-col">
                            <Button
                              variant="primary"
                              className="action-button w-100 mt-2"
                              disabled={!user.phone}
                              onClick={() => {
                                if (user.phone) {
                                  window.open(
                                    `https://wa.me/${user.phone}?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20seus%20serviços.`,
                                    "_blank"
                                  );
                                }
                              }}
                            >
                              {user.phone
                                ? `WhatsApp: ${user.phone}`
                                : "WhatsApp não cadastrado"}
                            </Button>
                            <p className="barber-email">Email: {user.email}</p>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Descrição do barbeiro */}
                  {barber.description && (
                    <Col md={6} className="barber-description-col mt-4">
                      <Card className="card-component barber-description-card shadow-sm">
                        <Card.Body className="card-body barber-description-card-body">
                          <p className="barber-description-text">
                            {barber.description}
                          </p>
                        </Card.Body>
                      </Card>
                    </Col>
                  )}
                </Row>

                {/* --- Barbearias Associadas --- */}
                <Row className="barbershops-row mt-4">
                  <Col md={12} className="barbershops-col">
                    <Card className="card-component barbershops-card shadow-sm">
                      <Card.Body className="card-body barbershops-card-body">
                        <p className="barbershops-title">
                          Barbearias que {user.first_name} está associado
                        </p>
                        <Row className="barbershops-list-row">
                          {barbershops.map((shop) => (
                            <Col
                              md={12}
                              key={shop.id}
                              className="barbershop-card-col m-2"
                            >
                              <Card className="inner-card">
                                <div
                                  className="card-bg"
                                  style={{
                                    backgroundImage: `url('${
                                      shop.logo
                                        ? `${storageUrl}/${shop.logo}`
                                        : "/images/logo.png"
                                    }')`,
                                  }}
                                />
                                <Card.Body className="inner-card-body card-content d-flex flex-column justify-content-center">
                                  <Link
                                    to={`/barbershop/view/${shop.slug}`}
                                    className="link-component"
                                  >
                                    <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center text-center text-sm-start">
                                      <img
                                        src={
                                          shop.logo
                                            ? `${storageUrl}/${shop.logo}`
                                            : "/images/logo.png"
                                        }
                                        className="img-component"
                                        alt={shop.name}
                                        onError={handleBarbershopLogoError}
                                      />
                                      <p className="item-title mt-2 mt-sm-0 ms-sm-2">
                                        {shop.name}
                                      </p>
                                    </div>
                                  </Link>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* --- Outros Barbeiros --- */}
                <Row className="barbers-row mt-4">
                  <Col md={12} className="barbers-col">
                    <Card className="card-component other-barbers-card shadow-sm">
                      <Card.Body className="card-body other-barbers-card-body">
                        <p className="other-barbers-title">Outros Barbeiros</p>
                        <Row className="other-barbers-list-row">
                          {otherBarbers.length > 0 ? (
                            otherBarbers.map((b) => (
                              <Col
                                xs={12}
                                sm={6}
                                md={4}
                                lg={3}
                                key={b.user.user_name}
                                className="barber-card-col mb-4"
                              >
                                <Card className="inner-card h-100">
                                  <Card.Body className="inner-card-body d-flex flex-column align-items-center">
                                    <Link
                                      to={`/barber/view/${b.user.user_name}`}
                                      className="d-flex flex-column align-items-center text-decoration-none w-100"
                                    >
                                      <img
                                        src={
                                          b.user.avatar
                                            ? `${storageUrl}/${b.user.avatar}`
                                            : "/images/user.png"
                                        }
                                        alt={b.user.first_name}
                                        style={{
                                          width: 80,
                                          height: 80,
                                          objectFit: "cover",
                                          borderRadius: "50%",
                                        }}
                                        onError={handleBarberAvatarError}
                                      />
                                      <p className="mt-2 item-title text-center">
                                        {b.user.first_name}
                                      </p>
                                    </Link>
                                  </Card.Body>
                                </Card>
                              </Col>
                            ))
                          ) : (
                            <Col>
                              <p className="text-muted">
                                Nenhum outro barbeiro encontrado.
                              </p>
                            </Col>
                          )}
                        </Row>     {/* botão flutuante WhatsApp */}

                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
          

              </>
            )}
          </Col>
        </Row>
       
      </Container>
       {user?.phone && (
  <a
    href={`https://wa.me/${user.phone}?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20seus%20serviços.`}
    className="whatsapp-float"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img src="/images/whatsapp-icon.png" alt="WhatsApp" />
  </a>
)}
    </>
  );
};

export default BarberViewPage;
