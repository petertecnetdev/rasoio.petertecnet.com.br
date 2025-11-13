// src/pages/HomePage.jsx
import React, { useMemo } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { apiBaseUrl } from "../config";
import NavlogComponent from "../components/NavlogComponent";
import GlobalCarousel from "../components/GlobalCarousel";
import useHome from "../hooks/useHome";
import "./HomePage.css";

export default function HomePage() {
  const appId = 2;
  const navigate = useNavigate();
  const { establishments, employers, items, isLoading, error } = useHome(apiBaseUrl, appId);

  const fmtBRL = useMemo(
    () => (v) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`,
    []
  );

  const services = useMemo(() => items.filter((i) => i.type === "service"), [items]);
  const products = useMemo(() => items.filter((i) => i.type === "product"), [items]);

  if (isLoading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-black text-light">
        <Spinner animation="border" role="status" variant="light" />
      </div>
    );

  const mappedEstablishments = establishments.map((e) => ({
    ...e,
    type: "establishment",
    image: e.logo || e.background || null,
    total_completed_appointments: e.total_completed_appointments,
    unique_clients_attended: e.unique_clients_attended,
  }));

  const mappedEmployers = employers.map((e) => ({
    ...e,
    type: "employer",
    image: e.user?.avatar || null,
    total_completed_appointments: e.total_completed_appointments,
    unique_clients_attended: e.unique_clients_attended,
    establishment: e.establishment,
  }));

  const mappedServices = services.map((i) => ({
    ...i,
    type: "service",
    image: i.image || null,
    total_completed_appointments: i.total_completed_appointments,
    unique_clients_attended: i.unique_clients_attended,
    top_employer: i.top_employer,
    entity: i.entity,
  }));

  const mappedProducts = products.map((i) => ({
    ...i,
    type: "product",
    image: i.image || null,
    total_completed_appointments: i.total_completed_appointments,
    unique_clients_attended: i.unique_clients_attended,
    top_employer: i.top_employer,
    entity: i.entity,
  }));

  return (
    <div className="hp-root">
      <NavlogComponent />
      <Container fluid className="hp-container py-4">
        <Row className="gx-3 gy-4">
          <Col md={12}>
            <h2 className="hp-title text-center mb-4 text-light">
              Bem-vindo ao Rasoio
            </h2>
          </Col>

          <Col md={12}>
            <GlobalCarousel
              title="Barbearias"
              items={mappedEstablishments}
              fmtBRL={fmtBRL}
              navigate={navigate}
            />
          </Col>

          <Col md={12}>
            <GlobalCarousel
              title="Barbeiros"
              items={mappedEmployers}
              fmtBRL={fmtBRL}
              navigate={navigate}
            />
          </Col>

          <Col md={12}>
            <GlobalCarousel
              title="Serviços"
              items={mappedServices}
              fmtBRL={fmtBRL}
              navigate={navigate}
            />
          </Col>

          <Col md={12}>
            <GlobalCarousel
              title="Produtos"
              items={mappedProducts}
              fmtBRL={fmtBRL}
              navigate={navigate}
            />
          </Col>

          {error && (
            <Col md={12} className="text-center mt-4">
              <p className="text-danger">{error}</p>
            </Col>
          )}
        </Row>
      </Container>
    </div>
  );
}
