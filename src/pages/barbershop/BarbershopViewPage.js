// BarbershopViewPage.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";
import Swal from "sweetalert2";
import { useParams, useNavigate, Link } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

const BarbershopViewPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();

  const [barbershop, setBarbershop] = useState(null);
  const [owner, setOwner] = useState({});
  const [items, setItems] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBarbershopData = async () => {
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

        setBarbershop(response.data.barbershop || {});
        setOwner(response.data.owner || {});
        setItems(response.data.items || []);
        setBarbers(response.data.barbers || []);

        window.scrollTo(0, 0);
      } catch (error) {
        // Caso venham erros de validação da API, exibimos o campo e mensagem no SweetAlert
        if (error.response?.data?.errors) {
          const errorMessages = Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          Swal.fire({
            icon: "error",
            title: "Erro!",
            text: errorMessages,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Erro!",
            text:
              error.response?.data?.message || "Erro ao carregar a barbearia.",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBarbershopData();
    }
  }, [slug]);

  const handleBarbershopLogoError = (e) => {
    if (e.target.src.includes("/images/logo.png")) return;
    e.target.src = "/images/logo.png";
  };

  const handleBarberAvatarError = (e) => {
    if (e.target.src.includes("/images/user.png")) return;
    e.target.src = "/images/user.png";
  };

  // Filtra apenas os itens que são do tipo "Serviço"
  const services = items.filter(
    (item) => item.type?.toLowerCase() === "serviço"
  );

  return (
    <>
      <NavlogComponent />

      {loading ? (
        <ProcessingIndicatorComponent
          messages={[
            "Carregando dados da barbearia...",
            "Verificando barbeiros...",
            "Quase pronto!",
          ]}
        />
      ) : (
        <Container className="main-container" fluid>
          {barbershop && (
            <Card className="barbershop-card">
              <Card.Body className="barbershop-body">
                <Row className="barbershop-row">
                  <Col md={6} className="barbershop-info">
                    <p className="barbershop-name">{barbershop.name}</p>
                    <img
                      src={
                        barbershop.logo
                          ? `${storageUrl}/${barbershop.logo}`
                          : "/images/logo.png"
                      }
                      className="img-component"
                      alt={barbershop.name}
                      onError={handleBarbershopLogoError}
                    />
                    <p className="barbershop-manager">
                      <strong>
                        {owner.first_name}{" "}
                        <img
                          src={
                            owner.avatar
                              ? `${storageUrl}/${owner.avatar}`
                              : "/images/user.png"
                          }
                          className="manager-avatar"
                          onError={handleBarberAvatarError}
                          alt={owner.first_name || "Gerente"}
                          style={{ margin: "0 auto", display: "block" }}
                        />
                      </strong>
                    </p>
                    <p className="barbershop-address">
                      {barbershop.address}, {barbershop.city} -{" "}
                      {barbershop.state}
                    </p>
                    <div className="barbershop-actions">
                      <Button
                        variant="primary"
                        onClick={() =>
                          navigate(`/scheduling/create/${barbershop.slug}`)
                        }
                      >
                        Agendar
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() =>
                          window.open(barbershop.location, "_blank")
                        }
                      >
                        Localização
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() =>
                          window.open(barbershop.instagram, "_blank")
                        }
                      >
                        Instagram
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() =>
                          window.open(
                            `https://wa.me/${barbershop.phone}?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20os%20serviços%20da%20${barbershop.name}.`,
                            "_blank"
                          )
                        }
                      >
                        WhatsApp: {barbershop.phone}
                      </Button>
                    </div>
                  </Col>
                  <Col md={6} className="barbershop-description-container">
                    <Card className="barbershop-description-card">
                      <Card.Body>
                        <p className="barbershop-description">
                          {barbershop.description}
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Linha que divide tabela de preços e barbeiros */}
          <Row className="mt-4">
            {/* Coluna Tabela de Preços (Serviços) */}
            <Col md={6}>
              {services.length === 0 ? (
                <Card className="card-component service-banner shadow-sm mb-4">
                  <Card.Body className="service-banner-body text-center">
                    <p className="service-banner-title">
                      Tabela de Preços (Serviços)
                    </p>
                    <p className="empty-text">Nenhum serviço encontrado.</p>
                  </Card.Body>
                </Card>
              ) : (
                <Card className="card-component service-banner shadow-sm mb-4">
                  <Card.Body className="service-banner-body text-center">
                    <p className="service-banner-title">Tabela de Preços</p>
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="service-banner-item d-flex align-items-center p-2"
                      >
                        <span className="service-banner-name">
                          {service.name}
                        </span>
                        <span className="service-dots flex-grow-1" />
                        <span className="service-banner-price">
                          R${service.price}
                        </span>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              )}
            </Col>

            {/* Coluna Barbeiros */}
            <Col md={6}>
              <Card className="card-component shadow-sm">
                <p className="section-title text-center mt-3">Barbeiros</p>
                <Card.Body>
                  {barbers.length > 0 ? (
                    <Row>
                      {barbers.map((barber) => (
                        <Col key={barber.id} md={6} className="">
                          <Link
                            to={`/barber/view/${barber.user_name}`}
                            className="link-component"
                          >
                            <div className="">
                              <p className="barber-name barber-label text-center ">
                                {barber.first_name}
                              </p>
                            </div>
                          </Link>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <Col xs={12} className="empty-section text-center">
                      <p className="empty-text">Nenhum barbeiro encontrado.</p>
                    </Col>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      )}
    </>
  );
};

export default BarbershopViewPage;
