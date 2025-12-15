// src/pages/establishment/EstablishmentMyPage.jsx
import React from "react";
import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import GlobalHeroList from "../../components/GlobalHeroList";
import EstablishmentDashboard from "../../components/establishment/EstablishmentDashboard";
import useEstablishmentMy from "../../hooks/useEstablishmentMy";
import useImageUtils from "../../hooks/useImageUtils";
import { appId } from "../../config";

const PLACEHOLDER = "/images/logo.png";

export default function EstablishmentMyPage() {
  const navigate = useNavigate();
  const { establishments, isLoading, apiError } = useEstablishmentMy(appId);
  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);

  if (isLoading) {
    return (
      <>
        <NavlogComponent />
        <Container className="text-center mt-5">
          <Spinner animation="border" />
        </Container>
      </>
    );
  }

  if (apiError) {
    return (
      <>
        <NavlogComponent />
        <Container className="mt-4">
          <Alert variant="danger">{apiError}</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <NavlogComponent />

      <GlobalHeroList
        title="Meus Estabelecimentos"
        subtitle="Gerencie seus estabelecimentos"
        metrics={[{ label: "Total", value: establishments.length }]}
        imageUrl={imageUrl}
        handleImgError={handleImgError}
      />

      <Container fluid className="establishment-my-wrapper mt-4">
        {establishments.length === 0 && (
          <Row>
            <Col xs={12} className="text-center text-muted">
              Nenhum estabelecimento encontrado.
            </Col>
          </Row>
        )}

        {establishments.map((est) => (
          <EstablishmentDashboard
            key={est.id}
            establishment={est}
            navigate={navigate}
          />
        ))}
      </Container>
    </>
  );
}
