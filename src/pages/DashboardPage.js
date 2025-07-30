// src/pages/DashboardPage.js
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import NavlogComponent from "../components/NavlogComponent";
import ProcessingIndicatorComponent from "../components/ProcessingIndicatorComponent";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../config";
import { Link } from "react-router-dom";
import "./dashboard.css";

const DashboardPage = () => {
  const [barbershops, setBarbershops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBarbershops = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${apiBaseUrl}/establishment/category/barbershop`
        );
        if (response?.data?.establishments?.data) {
          setBarbershops(response.data.establishments.data);
        } else {
          setBarbershops([]);
        }
      } catch {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro ao carregar as barbearias.",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
        setBarbershops([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBarbershops();
  }, []);

  const handleBarbershopLogoError = (e) => {
    e.target.src = "/images/logo.png";
  };

  return (
    <>
      <NavlogComponent />
      <Container className="main-container" fluid>
        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="m-2">
            <Card className="card-component shadow-sm">
              <p className="section-title text-center">Barbearias</p>
              <Card.Body className="card-body">
                {isLoading ? (
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
                          <Col
                            key={barbershop.id}
                            xs={12}
                            md={6}
                            lg={4}
                            className="inner-col mb-4"
                          >
                            <Card className="inner-card h-100">
                              <div
                                className="card-bg"
                                style={{
                                  backgroundImage: `url('${storageUrl}/${barbershop.background || "images/logo.png"}')`,
                                }}
                              />
                              <Card.Body className="inner-card-body card-content d-flex flex-column justify-content-center">
                                <Link
                                  to={`/establishment/view/${barbershop.slug}`}
                                  className="link-component"
                                >
                                  <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center text-center text-sm-start">
                                    <img
                                      src={`${storageUrl}/${barbershop.logo || "images/logo.png"}`}
                                      className="img-component"
                                      alt={barbershop.name}
                                      onError={handleBarbershopLogoError}
                                    />
                                    <p className="label-name-bg m-2">{barbershop.name}</p>
                                  </div>
                                </Link>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <Col xs={12} className="empty-section text-center">
                        <p className="empty-text">Nenhuma barbearia encontrada.</p>
                        <Link to="/establishment/create" className="link-component">
                          <Button className="action-button">
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
      </Container>
    </>
  );
};

export default DashboardPage;
