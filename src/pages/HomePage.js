// src/pages/HomePage.jsx
import React, { useMemo, useState } from "react";
import { Container, Row, Col, Spinner, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { apiBaseUrl } from "../config";
import NavlogComponent from "../components/NavlogComponent";
import GlobalCarousel from "../components/GlobalCarousel";
import CitySelectorModal from "../components/CitySelectorModal";
import useHome from "../hooks/useHome";
import "./HomePage.css";

export default function HomePage() {
  const appId = 2;
  const navigate = useNavigate();
  const { establishments, employers, items, isLoading, error, city, uf } =
    useHome(apiBaseUrl, appId);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [showCityModal, setShowCityModal] = useState(false);

  const fmtBRL = useMemo(
    () => (v) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`,
    []
  );

  const services = items.filter((i) => i.type === "service");
  const products = items.filter((i) => i.type === "product");

  if (isLoading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-black text-light">
        <Spinner animation="border" role="status" variant="light" />
      </div>
    );

  // 🔥 NÃO REESCREVE MAIS IMAGES — SOMENTE adiciona type
  const mappedEstablishments = establishments.map((e) => ({
    ...e,
    type: "establishment",
  }));

  const mappedEmployers = employers.map((e) => ({
    ...e,
    type: "employer",
    images: {
      ...e.images,
      avatar: e.images?.avatar || e.avatar || null,
    },
  }));

  const mappedServices = services.map((i) => ({
    ...i,
    type: "service",
  }));

  const mappedProducts = products.map((i) => ({
    ...i,
    type: "product",
  }));

  return (
    <div className="hp-root">
      <NavlogComponent />

      <Container fluid className="hp-container py-4">
        <Row className="gx-3 gy-4">
          <Col md={12} className="text-center mb-3">
            <h2 className="hp-title text-light">Bem-vindo ao Rasoio</h2>

            {city && uf && (
              <div className="mt-2">
                <span className="text-light">
                  Mostrando resultados para: <strong>{city} - {uf}</strong>
                </span>
                <Button
                  variant="outline-light"
                  size="sm"
                  className="ms-2"
                  onClick={() => setShowCityModal(true)}
                >
                  Alterar cidade
                </Button>
              </div>
            )}

            {(!city || !uf) && (
              <Button
                variant="outline-light"
                size="sm"
                className="mt-2"
                onClick={() => setShowCityModal(true)}
              >
                Definir cidade
              </Button>
            )}
          </Col>

          {mappedEstablishments.length > 0 && (
            <Col md={12}>
              <GlobalCarousel
                title="Barbearias"
                items={mappedEstablishments}
                fmtBRL={fmtBRL}
                navigate={navigate}
              />
            </Col>
          )}

          {mappedEmployers.length > 0 && (
            <Col md={12}>
              <GlobalCarousel
                title="Barbeiros"
                items={mappedEmployers}
                fmtBRL={fmtBRL}
                navigate={navigate}
              />
            </Col>
          )}

          {mappedServices.length > 0 && (
            <Col md={12}>
              <GlobalCarousel
                title="Serviços"
                items={mappedServices}
                fmtBRL={fmtBRL}
                navigate={navigate}
              />
            </Col>
          )}

          {mappedProducts.length > 0 && (
            <Col md={12}>
              <GlobalCarousel
                title="Produtos"
                items={mappedProducts}
                fmtBRL={fmtBRL}
                navigate={navigate}
              />
            </Col>
          )}

          {error && (
            <Col md={12} className="text-center mt-4">
              <p className="text-danger">{error}</p>
            </Col>
          )}
        </Row>
      </Container>

      <CitySelectorModal
        user={user}
        show={showCityModal}
        onClose={() => setShowCityModal(false)}
      />
    </div>
  );
}
