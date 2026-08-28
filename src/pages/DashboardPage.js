import React, { useContext } from "react";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { AuthContext } from "../App";
import "./dashboard.css";

export default function DashboardPage() {
  const { user, isEmployer, establishments } = useContext(AuthContext);
  const name =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.name ||
    "usuário";
  const owned = Array.isArray(establishments) ? establishments : [];

  return (
    <Container className="py-4 py-lg-5">
      <div className="mb-4">
        <div className="text-secondary small">Visão geral</div>
        <h1 className="h2 mb-2">Olá, {name}</h1>
        <p className="text-secondary mb-0">
          Acesse rapidamente seus agendamentos e as áreas de trabalho disponíveis para sua conta.
        </p>
      </div>

      <Row className="g-4">
        <Col md={6} lg={4}>
          <Card className="h-100 bg-dark text-light border-secondary">
            <Card.Body className="d-flex flex-column">
              <div className="fs-2 mb-3" aria-hidden="true">📅</div>
              <Card.Title>Meus agendamentos</Card.Title>
              <Card.Text className="text-secondary flex-grow-1">
                Consulte horários marcados, status e detalhes dos seus atendimentos como cliente.
              </Card.Text>
              <Button as={Link} to="/orders/my">Abrir agendamentos</Button>
            </Card.Body>
          </Card>
        </Col>

        {isEmployer && (
          <Col md={6} lg={4}>
            <Card className="h-100 bg-dark text-light border-secondary">
              <Card.Body className="d-flex flex-column">
                <div className="fs-2 mb-3" aria-hidden="true">💈</div>
                <Card.Title>Área do barbeiro</Card.Title>
                <Card.Text className="text-secondary flex-grow-1">
                  Organize sua disponibilidade e acompanhe os atendimentos vinculados ao seu perfil.
                </Card.Text>
                <Button as={Link} to="/employer/dashboard">Abrir área do barbeiro</Button>
              </Card.Body>
            </Card>
          </Col>
        )}

        <Col md={6} lg={4}>
          <Card className="h-100 bg-dark text-light border-secondary">
            <Card.Body className="d-flex flex-column">
              <div className="fs-2 mb-3" aria-hidden="true">🏪</div>
              <Card.Title>Gestão de barbearias</Card.Title>
              <Card.Text className="text-secondary flex-grow-1">
                {owned.length > 0
                  ? `Você possui ${owned.length} barbearia${owned.length === 1 ? "" : "s"} vinculada${owned.length === 1 ? "" : "s"} à sua conta.`
                  : "Cadastre uma barbearia para gerenciar equipe, catálogo e atendimentos."}
              </Card.Text>
              <Button
                as={Link}
                to={owned.length > 0 ? "/establishment/my" : "/establishment/create"}
              >
                {owned.length > 0 ? "Gerenciar barbearias" : "Cadastrar barbearia"}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {owned.length > 0 && (
        <section className="mt-5" aria-labelledby="dashboard-barbershops-title">
          <h2 id="dashboard-barbershops-title" className="h4 mb-3">Minhas barbearias</h2>
          <Row className="g-3">
            {owned.map((establishment) => (
              <Col key={establishment.id} md={6} lg={4}>
                <Card className="h-100 bg-dark text-light border-secondary">
                  <Card.Body>
                    <Card.Title>{establishment.fantasy || establishment.name}</Card.Title>
                    <Card.Text className="text-secondary">
                      {[establishment.city, establishment.uf].filter(Boolean).join(" / ") || "Localização não informada"}
                    </Card.Text>
                    <div className="d-flex gap-2 flex-wrap">
                      {establishment.slug && (
                        <Button as={Link} to={`/establishment/view/${establishment.slug}`} size="sm" variant="outline-light">
                          Página pública
                        </Button>
                      )}
                      <Button as={Link} to={`/establishment/update/${establishment.id}`} size="sm">
                        Gerenciar
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>
      )}
    </Container>
  );
}
