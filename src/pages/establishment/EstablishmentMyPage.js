// src/pages/establishment/EstablishmentMyPage.js
import React from "react";
import { Alert, Button, Col, Container, Row, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import EstablishmentDashboard from "../../components/establishment/EstablishmentDashboard";
import useEstablishmentMy from "../../hooks/useEstablishmentMy";
import { appId } from "../../config";

export default function EstablishmentMyPage() {
  const navigate = useNavigate();
  const { establishments, isLoading, apiError } = useEstablishmentMy(appId);
  const heroEstablishment = establishments?.[0] || null;

  if (isLoading) {
    return (
      <Container className="text-center py-5" aria-live="polite">
        <Spinner animation="border" />
      </Container>
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
      {heroEstablishment ? (
        <EstablishmentHero
          title={heroEstablishment.fantasy || heroEstablishment.name}
          subtitle="Gestão das suas barbearias"
          description="Gerencie equipe, serviços, produtos, agenda e atendimentos em um só lugar."
          city={heroEstablishment.city}
          uf={heroEstablishment.uf}
          logo={heroEstablishment?.images?.logo}
          background={heroEstablishment?.images?.background}
          showBack
        />
      ) : (
        <Container className="py-5 text-center">
          <h2>Cadastre sua primeira barbearia</h2>
          <p className="text-muted">
            Depois do cadastro você poderá adicionar barbeiros, serviços e acompanhar os atendimentos.
          </p>
          <Button onClick={() => navigate("/establishment/create")}>Criar barbearia</Button>
        </Container>
      )}

      <Container fluid className="establishment-my-wrapper mt-4">
        {establishments.length === 0 ? (
          <Row>
            <Col xs={12} className="text-center text-muted">
              Nenhuma barbearia cadastrada ainda.
            </Col>
          </Row>
        ) : (
          establishments.map((establishment) => (
            <EstablishmentDashboard
              key={establishment.id}
              establishment={establishment}
              navigate={navigate}
            />
          ))
        )}
      </Container>
    </>
  );
}
