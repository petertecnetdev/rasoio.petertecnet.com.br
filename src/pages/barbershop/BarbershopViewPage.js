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

        console.log("API Response:", response.data); // Verificar a resposta
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
    e.target.src = "images/user.png";
  };

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
        <Container>
          {barbershop && (
            <Card>
              <Card.Body>
                <Row>
                  <Col md={6} className="text-center">
                    <p className="labeltitle h7 text-uppercase">
                      {barbershop.name}
                    </p>
                    <img
                      src={
                        barbershop.logo
                          ? `${storageUrl}/${barbershop.logo}`
                          : "/images/barbershoplogo.png"
                      }
                      alt="Logo da Barbearia"
                      className="img-fluid rounded-circle mx-2 img-logo-barbershop"
                    />
                    <p className="m-2">
                      {" "}
                      Endereço: <strong>{barbershop.address}</strong>{" "}
                    </p>
                    <p className="m-2">
                      {" "}
                      <strong>
                        {barbershop.city} - {barbershop.state}
                      </strong>{" "}
                    </p>
                  </Col>

                  <Col md={6}>
                    <Button
                      variant="primary w-100 m-2"
                      onClick={() => window.open(barbershop.location, "_blank")}
                    >
                      Localização
                    </Button>

                    <Button
                      variant="primary w-100 m-2"
                      onClick={() =>
                        window.open(barbershop.instagram, "_blank")
                      }
                    >
                      Instagram
                    </Button>

                    <Button
                      variant="primary w-100 m-2"
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
                </Row>
                <Row className="mt-4">
                  <Col md={6} className="text-center">
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/scheduling`)}
                    >
                      Realizar teste um agendamento
                    </Button>
                  </Col>
                  <Col md={6} className="text-center">
                    Gerente: <string>{owner.first_name}</string>
                    <img
                      src={
                        owner.avatar
                          ? `${storageUrl}/${owner.avatar}`
                          : "/images/user.png"
                      }
                      alt={owner.first_name}
                      className="rounded-circle m-2 img-avatar-owner"
                    />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
          <Card className="mt-4">
            <Card.Body>
              <p className="text-center">{barbershop?.description}</p>
            </Card.Body>
          </Card>

          <Card>
            {" "}
            <p className="labeltitle h6 text-center text-uppercase">
              Barbeiros da {barbershop.name}
            </p>
            <Card.Body>
              <Row>
                {barbers.length === 0 ? (
                  <Col xs={12} className="text-center mb-3">
                    <p>Nenhum barbeiro encontrado.</p>
                  </Col>
                ) : (
                  barbers.map((barber) => (
                    <Col md={2} key={barber.id}>
                      <Card className="card-barber-show text-center d-flex flex-column justify-content-center align-items-center">
                        <div
                          className="background-image mb-3"
                          style={{
                            backgroundImage: `url('${storageUrl}/${
                              barber.avatar || "/images/user.png"
                            }')`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            height: "150px",
                            width: "150px",
                            borderRadius: "50%",
                          }}
                        />
                        <Card.Body>
                          <Link
                            to={`/barber/view/${barber.user_name}`}
                            style={{ textDecoration: "none" }}
                          >
                            <img
                              src={
                                barber.avatar
                                  ? `${storageUrl}/${barber.avatar}`
                                  : "/images/user.png"
                              }
                              alt={barber.first_name}
                              className="rounded-circle m-2 img-avatar-user"
                              style={{
                                height: "100px",
                                width: "100px",
                                objectFit: "cover",
                              }}
                              onError={handleBarberAvatarError}
                            />
                            <p>{barber.first_name}</p>
                          </Link>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </Card.Body>
          </Card>


          <Card>
            {" "}
            <p className="labeltitle h6 text-center text-uppercase">
              Items da {barbershop.name}
            </p>
            <Card.Body>
              <Row>
                {items.length === 0 ? (
                  <Col xs={12} className="text-center mb-3">
                    <p>Nenhum item encontrado.</p>
                  </Col>
                ) : (
                  items.map((item) => (
                    <Col md={2} key={items.id}>
                      <Card className="card-barber-show text-center d-flex flex-column justify-content-center align-items-center">
                        <div
                          className="background-image mb-3"
                          style={{
                            backgroundImage: `url('${storageUrl}/${
                              item.image || "/images/user.png"
                            }')`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            height: "150px",
                            width: "150px",
                            borderRadius: "50%",
                          }}
                        />
                        <Card.Body>
                          <Link
                            to={`/item/view/${item.slug}`}
                            style={{ textDecoration: "none" }}
                          >
                            <img
                              src={
                                item.image
                                  ? `${storageUrl}/${item.image}`
                                  : "/images/user.png"
                              }
                              alt={item.name}
                              className="rounded-circle m-2 img-avatar-user"
                              style={{
                                height: "100px",
                                width: "100px",
                                objectFit: "cover",
                              }}
                              onError={handleBarberAvatarError}
                            />
                            <p>{item.name}</p>
                          </Link>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </Card.Body>
          </Card>


          <Card>
            <p className="labeltitle h6 text-center text-uppercase">
              Outras Barbearias
            </p>
            <Card.Body>
              <Row>
                {otherBarbershops.length === 0 ? (
                  <Col xs={12} className="text-center mb-3">
                    <p>Nenhuma outra barbearia encontrada.</p>
                  </Col>
                ) : (
                  otherBarbershops.map((otherBarbershop) => (
                    <Col md={3} key={otherBarbershop.id} className="mb-3">
                      <Card className="card-barbershop-show">
                        <div
                          className="background-image"
                          style={{
                            backgroundImage: `url('${storageUrl}/${otherBarbershop.logo}')`,
                          }}
                        />
                        <Link
                          to={`/barbershop/view/${otherBarbershop.slug}`}
                          style={{ textDecoration: "none" }}
                        >
                          <img
                            src={`${storageUrl}/${otherBarbershop.logo}`}
                            className="rounded-circle img-logo-barbershop-show"
                            style={{ margin: "0 auto", display: "block" }}
                            alt={otherBarbershop.name}
                          />
                        </Link>
                        <Card.Body>
                          <Link
                            to={`/barbershop/show/${otherBarbershop.id}`}
                            style={{ textDecoration: "none" }}
                          >
                            <p className="labeltitle h6 text-center text-uppercase">
                              {otherBarbershop.name}
                            </p>
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
