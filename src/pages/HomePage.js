import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../config";
import NavlogComponent from "../components/NavlogComponent";
import ProcessingIndicatorComponent from "../components/ProcessingIndicatorComponent";

const HomePage = () => {
  const [barbershops, setBarbershops] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [loadingBarbers, setLoadingBarbers] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const { data } = await axios.get(`${apiBaseUrl}/barbershop`, { headers });
        setBarbershops(data.barbershops?.data || []);
      } catch {
        Swal.fire("Erro", "Não foi possível carregar as barbearias.", "error");
        setBarbershops([]);
      } finally {
        setLoadingShops(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const { data } = await axios.get(`${apiBaseUrl}/barber`, { headers });
        setBarbers(data.barbers?.data || []);
      } catch {
        Swal.fire("Erro", "Não foi possível carregar os barbeiros.", "error");
        setBarbers([]);
      } finally {
        setLoadingBarbers(false);
      }
    })();
  }, []);

  const onShopError = e => { e.target.src = "/images/logo.png"; };
  const onBarberError = e => { e.target.src = "/images/user.png"; };

  return (
    <>
      <NavlogComponent />
      <Container fluid className="main-container">
        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="m-2">
            <Card className="card-component shadow-sm">
              <p className="section-title text-center">Barbearias</p>
              <Card.Body className="card-body">
                {loadingShops ? (
                  <ProcessingIndicatorComponent
                    messages={[
                      "Carregando barbearias...",
                      "Aguarde um momento...",
                    ]}
                  />
                ) : barbershops.length > 0 ? (
                  <Row className="inner-row">
                    {barbershops.map(shop => (
                      <Col key={shop.id} xs={12} md={6} lg={4} className="inner-col mb-4">
                        <Card className="inner-card h-100">
                          <div
                            className="card-bg"
                            style={{
                              backgroundImage: `url('${storageUrl}/${shop.logo || "images/logo.png"}')`,
                            }}
                          />
                          <Card.Body className="inner-card-body d-flex align-items-center justify-content-center">
                            <Link to={`/barbershop/view/${shop.slug}`} className="link-component">
                              <img
                                src={`${storageUrl}/${shop.logo || "images/logo.png"}`}
                                alt={shop.name}
                                className="img-component me-2"
                                onError={onShopError}
                              />
                              <span className="label-name-bg">{shop.name}</span>
                            </Link>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div className="empty-section text-center">
                    <p className="empty-text">Nenhuma barbearia encontrada.</p>
                    <Link to="/barbershop/create" className="link-component">
                      <Button variant="primary">Adicionar Barbearia</Button>
                    </Link>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="m-2">
            <Card className="card-component shadow-sm">
              <p className="section-title text-center">Barbeiros</p>
              <Card.Body className="card-body">
                {loadingBarbers ? (
                  <ProcessingIndicatorComponent
                    messages={[
                      "Carregando barbeiros...",
                      "Aguarde um momento...",
                    ]}
                  />
                ) : barbers.length > 0 ? (
                  <Row className="inner-row">
                    {barbers.map(b => (
                      <Col key={b.id} xs={12} md={6} lg={4} className="inner-col mb-4 text-center">
                        <Link to={`/barber/view/${b.user.user_name}`} className="link-component">
                          <Card className="barber-card">
                            <Card.Body>
                              <img
                                src={b.user.avatar ? `${storageUrl}/${b.user.avatar}` : "/images/user.png"}
                                alt={b.user.first_name}
                                className="barber-avatar mb-2"
                                onError={onBarberError}
                              />
                              <p className="label-name">{b.user.first_name}</p>
                            </Card.Body>
                          </Card>
                        </Link>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div className="empty-section text-center">
                    <p className="empty-text">Nenhum barbeiro encontrado.</p>
                  </div>
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
