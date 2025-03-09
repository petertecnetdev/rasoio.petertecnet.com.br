import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";
import Swal from "sweetalert2";
import { Link, useParams, useNavigate } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

const BarbershopViewPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [barbershop, setBarbershop] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [items, setItems] = useState([]);
  const [owner, setOwner] = useState([]);
  const [otherBarbershops, setOtherBarbershops] = useState([]);
  const [loading, setLoading] = useState(true);

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
        console.log("API Response:", response.data);
        setBarbershop(response.data.barbershop);
        setBarbers(response.data.barbers);
        setItems(response.data.items);
        setOwner(response.data.owner);
        setOtherBarbershops(response.data.otherBarbershops || []);
        window.scrollTo(0, 0);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          "Erro ao carregar informações da barbearia.";
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBarbershop();
  }, [slug]);

  const handleBarberAvatarError = (e) => {
    if (e.target.src.includes("/images/user.png")) return;
    e.target.src = "/images/user.png";
  };

  const handleBarbershopLogoError = (e) => {
    if (e.target.src.includes("/images/logo.png")) return;
    e.target.src = "/images/logo.png";
  };

  // Helper to inject dynamic background CSS without using inline styles.
  const renderBackgroundStyle = (className, imageUrl) => (
    <style>{`
      .${className} {
        background-image: url('${imageUrl}');
      }
    `}</style>
  );

  return (
    <>
      <NavlogComponent />
      {loading ? (
        <ProcessingIndicatorComponent
          messages={[
            "Carregando dados da barbearia...",
            "Verificando barbeiros...",
            "Quase pronto! Apenas um momento.",
          ]}
        />
      ) : (
        <Container className="barbershop-view-container">
          {barbershop && (
            <>
              {renderBackgroundStyle(
                `barbershop-view-bg-${barbershop.id}`,
                barbershop.logo
                  ? `${storageUrl}/${barbershop.logo}`
                  : "/images/barbershoplogo.png"
              )}
              <Card className="barbershop-view-card">
                <Card.Body className="barbershop-view-card-body">
                  <Row className="barbershop-view-row">
                    <Col md={6} className="barbershop-info-col">
                      <p className="barbershop-name">{barbershop.name}</p>
                      <img
                        src={
                          barbershop.logo
                            ? `${storageUrl}/${barbershop.logo}`
                            : "/images/barbershoplogo.png"
                        }
                        alt="Logo da Barbearia"
                        className="barbershop-logo"
                        onError={handleBarbershopLogoError}
                      />
                      <p className="barbershop-manager">
                        Gerente: <strong>{owner.first_name}</strong>{" "}
                        <img
                          src={
                            owner.avatar
                              ? `${storageUrl}/${owner.avatar}`
                              : "/images/user.png"
                          }
                          alt={owner.first_name}
                          className="barbershop-manager-avatar"
                          onError={handleBarberAvatarError}
                        />
                      </p>
                      <p className="barbershop-address">
                        Endereço: <strong>{barbershop.address}</strong>
                      </p>
                      <p className="barbershop-location">
                        <strong>
                          {barbershop.city} - {barbershop.state}
                        </strong>
                      </p>
                      <Button
                        variant="primary"
                        className="schedule-button"
                        onClick={() =>
                          navigate(`/scheduling/create/${barbershop.slug}`)
                        }
                      >
                        Realizar agendamento
                      </Button>
                      <Button
                        variant="primary"
                        className="location-button w-100 m-2"
                        onClick={() => window.open(barbershop.location, "_blank")}
                      >
                        Localização
                      </Button>
                      <Button
                        variant="primary"
                        className="instagram-button w-100 m-2"
                        onClick={() =>
                          window.open(barbershop.instagram, "_blank")
                        }
                      >
                        Instagram
                      </Button>
                      <Button
                        variant="primary"
                        className="whatsapp-button w-100 m-2"
                        onClick={() => {
                          const whatsappURL = `https://wa.me/${
                            barbershop.phone
                          }?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20os%20serviços%20da%20${encodeURIComponent(
                            barbershop.name
                          )}.`;
                          window.open(whatsappURL, "_blank");
                        }}
                      >
                        WhatsApp: {barbershop.phone}
                      </Button>
                    </Col>
                    <Col md={6} className="barbershop-description-col">
                      <Card className="barbershop-description-card">
                        <Card.Body className="barbershop-description-card-body">
                          <p className="barbershop-description">
                            {barbershop?.description}
                          </p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </>
          )}

          <Card className="barbershop-barbers-card">
            <p className="barbershop-barbers-title">
              Barbeiros da {barbershop.name}
            </p>
            <Card.Body className="barbershop-barbers-card-body">
              <Row className="barbershop-barbers-row">
                {barbers.length === 0 ? (
                  <Col xs={12} className="barbershop-no-barbers-col">
                    <p>Nenhum barbeiro encontrado.</p>
                  </Col>
                ) : (
                  barbers.map((barber) => (
                    <Col md={2} key={barber.id} className="barber-col">
                      <Card className="barber-card">
                        {renderBackgroundStyle(
                          `barber-card-bg-${barber.id}`,
                          `${storageUrl}/${barbershop.logo}`
                        )}
                        <div className={`barber-card-bg barber-card-bg-${barber.id}`}></div>
                        <Card.Body className="barber-card-body">
                          <Link
                            to={`/barber/view/${barber.user_name}`}
                            className="barber-link"
                          >
                            <img
                              src={
                                barber.avatar
                                  ? `${storageUrl}/${barber.avatar}`
                                  : "/images/user.png"
                              }
                              alt={barber.first_name}
                              className="barber-avatar"
                              onError={handleBarberAvatarError}
                            />
                            <p className="barber-name">{barber.first_name}</p>
                          </Link>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </Card.Body>
          </Card>

          <Card className="barbershop-items-card">
            <p className="barbershop-items-title">
              Items da {barbershop.name}
            </p>
            <Card.Body className="barbershop-items-card-body">
              <Row className="barbershop-items-row">
                {items.length === 0 ? (
                  <Col xs={12} className="barbershop-no-items-col">
                    <p>Nenhum item encontrado.</p>
                  </Col>
                ) : (
                  items.map((item) => (
                    <Col md={2} key={item.id} className="item-col">
                      <Card className="item-card">
                        <Card.Body className="item-card-body">
                          <Link to={`/item/view/${item.slug}`} className="item-link">
                            <img
                              src={
                                item.image
                                  ? `${storageUrl}/${item.image}`
                                  : "/images/user.png"
                              }
                              alt={item.name}
                              className="item-image"
                              onError={handleBarberAvatarError}
                            />
                            <p className="item-name">{item.name}</p>
                            <p className="item-price">R$ {item.price}</p>
                          </Link>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </Card.Body>
          </Card>

          <Card className="other-barbershops-card">
            <p className="other-barbershops-title">Outras Barbearias</p>
            <Card.Body className="other-barbershops-card-body">
              <Row className="other-barbershops-row">
                {otherBarbershops.length === 0 ? (
                  <Col xs={12} className="other-no-barbershops-col">
                    <p>Nenhuma outra barbearia encontrada.</p>
                  </Col>
                ) : (
                  otherBarbershops.map((otherBarbershop) => (
                    <Col md={3} key={otherBarbershop.id} className="other-barbershop-col">
                      <Card className="other-barbershop-card">
                        {renderBackgroundStyle(
                          `other-barbershop-card-bg-${otherBarbershop.id}`,
                          `${storageUrl}/${otherBarbershop.logo}`
                        )}
                        <div className={`other-barbershop-card-bg other-barbershop-card-bg-${otherBarbershop.id}`}></div>
                        <Link
                          to={`/barbershop/view/${otherBarbershop.slug}`}
                          className="other-barbershop-link"
                        >
                          <img
                            src={`${storageUrl}/${otherBarbershop.logo}`}
                            className="other-barbershop-logo"
                            alt={otherBarbershop.name}
                            onError={handleBarbershopLogoError}
                          />
                        </Link>
                        <Card.Body className="other-barbershop-card-body">
                          <Link
                            to={`/barbershop/show/${otherBarbershop.id}`}
                            className="other-barbershop-show-link"
                          >
                            <p className="other-barbershop-name">{otherBarbershop.name}</p>
                          </Link>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </Card.Body>
          </Card>
        </Container>
      )}
    </>
  );
};

export default BarbershopViewPage;
