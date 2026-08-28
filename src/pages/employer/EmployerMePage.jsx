// src/pages/employer/EmployerMePage.jsx
import React from "react";
import { Alert, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaCalendarCheck, FaClock, FaChartLine } from "react-icons/fa";
import EmployerHero from "../../components/employer/EmployerHero";
import useEmployerMe from "../../hooks/useEmployerMe";
import useImageUtils from "../../hooks/useImageUtils";
import "./EmployerMePage.css";

const PLACEHOLDER = "/images/logo.png";

export default function EmployerMePage() {
  const navigate = useNavigate();
  const { employer, isLoading, apiError } = useEmployerMe();
  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center py-5" aria-live="polite">
        <Spinner animation="border" />
      </div>
    );
  }

  if (apiError) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{apiError}</Alert>
      </Container>
    );
  }

  return (
    <>
      <EmployerHero
        title="Área do Barbeiro"
        subtitle="Gerencie sua agenda, disponibilidade e atendimentos"
        employer={employer}
        imageUrl={imageUrl}
        handleImgError={handleImgError}
      />

      <Container className="py-4">
        <Row className="g-4">
          <Col md={6} lg={4}>
            <Card className="ema-card" onClick={() => navigate("/employer/schedules")} role="button">
              <Card.Body>
                <div className="ema-icon primary"><FaClock /></div>
                <h5>Meus horários</h5>
                <p>Configure sua disponibilidade semanal de atendimento.</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={4}>
            <Card className="ema-card" onClick={() => navigate("/employer/orders")} role="button">
              <Card.Body>
                <div className="ema-icon success"><FaCalendarCheck /></div>
                <h5>Meus atendimentos</h5>
                <p>Acompanhe os agendamentos vinculados ao seu perfil.</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={4}>
            <Card className="ema-card" onClick={() => navigate("/dashboard")} role="button">
              <Card.Body>
                <div className="ema-icon warning"><FaChartLine /></div>
                <h5>Visão geral</h5>
                <p>Acesse indicadores e informações gerais da sua operação.</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
