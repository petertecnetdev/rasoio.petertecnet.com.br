// src/pages/establishment/EstablishmentMyPage.jsx
import React, { useMemo } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import GlobalHero from "../../components/GlobalHero";
import EstablishmentMyCard from "../../components/establishment/EstablishmentMyCard";
import useEstablishmentMy from "../../hooks/useEstablishmentMy";
import useImageUtils from "../../hooks/useImageUtils";
import { apiBaseUrl } from "../../config";
import "./EstablishmentMy.css";

export default function EstablishmentMyPage() {
  const { establishments, metrics, isLoading } = useEstablishmentMy(apiBaseUrl);
  const { imageUrl, handleImgError } = useImageUtils();

  const heroData = useMemo(() => {
    const first = establishments?.[0] || null;
    return {
      background: first?.background || null,
      logo: first?.logo || null,
    };
  }, [establishments]);

  if (isLoading) {
    return <Container className="text-center mt-5"></Container>;
  }

  return (
    <div className="dashboard-root">
      <NavlogComponent />

      <GlobalHero
        entity="list"
        title="Meus Estabelecimentos"
        description="Gerencie seus estabelecimentos, acompanhe métricas e edite informações."
        background={heroData.background}
        logo={heroData.logo}
        imageUrl={imageUrl}
        handleImgError={handleImgError}
        overlay
      >
        <Button
          as={Link}
          to="/establishment/create"
          size="sm"
          className="dashboard-establishment-btn bg-black"
        >
          Criar meu estabelecimento
        </Button>
      </GlobalHero>

      <Container fluid className="dashboard-main">
        <div className="dashboard-section">
          <Row className="dashboard-establishments-list gx-3 gy-4">
            {establishments.length === 0 && (
              <Col md={12}>
                <Card className="dashboard-empty-card">
                  <Card.Body className="text-center">
                    <div className="dashboard-empty mb-3">
                      Nenhum estabelecimento encontrado.
                    </div>
                    <Button
                      as={Link}
                      to="/establishment/create"
                      size="sm"
                      className="dashboard-establishment-btn bg-black"
                    >
                      Criar meu estabelecimento
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            )}

            {establishments.map((est) => (
              <Col key={est.id} md={12}>
                <EstablishmentMyCard
                  establishment={est}
                  metrics={metrics[est.id]}
                />
              </Col>
            ))}
          </Row>
        </div>
      </Container>
    </div>
  );
}
