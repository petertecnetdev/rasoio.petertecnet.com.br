// BarbershopViewPage.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";
import Swal from "sweetalert2";
import { useParams, useNavigate } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

const BarbershopViewPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [barbershop, setBarbershop] = useState(null);
  const [owner, setOwner] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBarbershop = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiBaseUrl}/barbershop/view/${slug}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setBarbershop(response.data.barbershop);
        setOwner(response.data.owner);
        window.scrollTo(0, 0);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text:
            error.response?.data?.message ||
            "Erro ao carregar informações da barbearia.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBarbershop();
  }, [slug]);

  const handleBarbershopLogoError = (e) => {
    if (e.target.src.includes("/images/logo.png")) return;
    e.target.src = "/images/logo.png";
  };

  const handleBarberAvatarError = (e) => {
    if (e.target.src.includes("/images/user.png")) return;
    e.target.src = "/images/user.png";
  };

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
                      // Se barbershop.logo não existir, usamos /images/logo.png
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
                      Gerente: <strong>{owner.first_name}</strong>
                      <img
                        src={
                          owner.avatar
                            ? `${storageUrl}/${owner.avatar}`
                            : "/images/user.png"
                        }
                        className="barber-avatar"
                        onError={handleBarberAvatarError}
                        alt={owner.first_name}
                        style={{ margin: "0 auto", display: "block" }}
                      />
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
                        onClick={() => window.open(barbershop.location, "_blank")}
                      >
                        Localização
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => window.open(barbershop.instagram, "_blank")}
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
        </Container>
      )}
    </>
  );
};

export default BarbershopViewPage;
