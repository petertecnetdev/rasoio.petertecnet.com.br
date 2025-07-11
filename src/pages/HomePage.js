import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import NavlogComponent from "../components/NavlogComponent";
import ProcessingIndicatorComponent from "../components/ProcessingIndicatorComponent";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../config";

const HomePage = () => {
  const [barbershops, setBarbershops] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [loadingBarbers, setLoadingBarbers] = useState(true);

  useEffect(() => {
    const fetchBarbershops = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${apiBaseUrl}/barbershop`, { headers });
        setBarbershops(response.data.barbershops?.data || []);
      } catch {
        Swal.fire({ icon: "error", title: "Erro", text: "Falha ao carregar barbearias." });
        setBarbershops([]);
      } finally {
        setLoadingShops(false);
      }
    };
    fetchBarbershops();
  }, []);

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${apiBaseUrl}/barber`, { headers });
        setBarbers(response.data.barbers?.data || []);
      } catch {
        Swal.fire({ icon: "error", title: "Erro", text: "Falha ao carregar barbeiros." });
        setBarbers([]);
      } finally {
        setLoadingBarbers(false);
      }
    };
    fetchBarbers();
  }, []);

  const onShopImgError = e => e.target.src = "/images/logo.png";
  const onBarberImgError = e => e.target.src = "/images/user.png";

  return (
    <>
      <NavlogComponent />
      <Container fluid className="main-container">
        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="m-2">
            <Card className="card-component shadow-sm">
              <p className="section-title text-center">Barbearias</p>
              <Card.Body>
                {loadingShops ? (
                  <ProcessingIndicatorComponent
                    messages={["Carregando barbearias...", "Aguarde um momento."]}
                  />
                ) : barbershops.length > 0 ? (
                  <Row className="inner-row">
                    {barbershops.map(shop => (
                      <Col key={shop.id} xs={12} md={6} lg={4} className="inner-col mb-4">
                        <Link to={`/barbershop/view/${shop.slug}`} className="link-component">
                          <Card className="inner-card h-100">
                            <div
                              className="card-bg"
                              style={{ backgroundImage: `url('${storageUrl}/${shop.logo || "images/logo.png"}')` }}
                            />
                            <Card.Body className="inner-card-body d-flex align-items-center justify-content-center">
                              <img
                                src={`${storageUrl}/${shop.logo || "images/logo.png"}`}
                                alt={shop.name}
                                className="img-component me-2"
                                onError={onShopImgError}
                              />
                              <span className="label-name-bg">{shop.name}</span>
                            </Card.Body>
                          </Card>
                        </Link>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <p className="empty-text text-center">Nenhuma barbearia encontrada.</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="m-2">
            <Card className="card-component shadow-sm">
              <p className="section-title text-center">Barbeiros</p>
              <Card.Body>
                {loadingBarbers ? (
                  <ProcessingIndicatorComponent
                    messages={["Carregando barbeiros...", "Aguarde um momento."]}
                  />
                ) : barbers.length > 0 ? (
                  <Row className="inner-row">
                    {barbers.map(barber => (
                      <Col key={barber.id} xs={12} md={6} lg={4} className="mb-4">
                        <Link to={`/barber/view/${barber.user.user_name}`} className="link-component">
                          <Card className="barber-card text-center">
                            <Card.Body>
                              <img
                                src={barber.user.avatar ? `${storageUrl}/${barber.user.avatar}` : "/images/user.png"}
                                alt={barber.user.first_name}
                                className="barber-avatar mb-2"
                                onError={onBarberImgError}
                              />
                              <p className="label-name">{barber.user.first_name}</p>
                            </Card.Body>
                          </Card>
                        </Link>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <p className="empty-text text-center">Nenhum barbeiro encontrado.</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default HomePage;
