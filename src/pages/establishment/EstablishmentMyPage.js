// src/pages/establishment/EstablishmentMyPage.js
import React from "react";
import { Alert, Button, Container, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import EstablishmentDashboard from "../../components/establishment/EstablishmentDashboard";
import useEstablishmentMy from "../../hooks/useEstablishmentMy";
import "./EstablishmentMy.css";

export default function EstablishmentMyPage() {
  const navigate = useNavigate();
  const { establishments, isLoading, apiError, refetch } = useEstablishmentMy();
  const count = Array.isArray(establishments) ? establishments.length : 0;

  if (isLoading) {
    return (
      <Container className="text-center py-5" aria-live="polite">
        <Spinner animation="border" />
        <p className="mt-3 mb-0">Carregando seus estabelecimentos...</p>
      </Container>
    );
  }

  return (
    <main className="my-barbershops-page">
      <Container className="py-4 py-lg-5">
        <header className="my-barbershops-hero">
          <div className="my-barbershops-copy">
            <span className="my-barbershops-kicker">Gestão Rasoio</span>
            <h1>Meus estabelecimentos</h1>
            <p>
              Administre cada unidade separadamente. Cada estabelecimento possui sua própria
              equipe, serviços, produtos, agenda e visão operacional.
            </p>
          </div>

          <div className="my-barbershops-hero-actions">
            <div className="my-barbershops-count" aria-label={`${count} estabelecimentos cadastrados`}>
              <strong>{count}</strong>
              <span>{count === 1 ? "estabelecimento" : "estabelecimentos"}</span>
            </div>
            <Button
              className="my-barbershops-add"
              onClick={() => navigate("/establishment/create")}
            >
              + Cadastrar estabelecimento
            </Button>
          </div>
        </header>

        {apiError && (
          <Alert variant="danger" className="mb-4">
            <Alert.Heading>Não foi possível atualizar seus estabelecimentos</Alert.Heading>
            <p>{apiError}</p>
            <Button variant="outline-light" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </Alert>
        )}

        {!apiError && count === 0 ? (
          <section className="my-barbershops-empty">
            <div className="my-barbershops-empty-icon" aria-hidden="true">🏢</div>
            <span>Comece sua operação</span>
            <h2>Cadastre seu primeiro estabelecimento</h2>
            <p>
              Depois do cadastro você poderá adicionar colaboradores, serviços, produtos
              e organizar os atendimentos dessa unidade.
            </p>
            <Button onClick={() => navigate("/establishment/create")}>Criar estabelecimento</Button>
          </section>
        ) : null}

        {count > 0 && (
          <section className="my-barbershops-list" aria-label="Estabelecimentos administrados">
            <div className="my-barbershops-section-heading">
              <div>
                <span>Suas unidades</span>
                <h2>Escolha qual estabelecimento deseja gerenciar</h2>
              </div>
              <p>A visão geral e todas as ações ficam vinculadas à unidade escolhida.</p>
            </div>

            <div className="my-barbershops-grid">
              {establishments.map((establishment) => (
                <EstablishmentDashboard
                  key={establishment.id}
                  establishment={establishment}
                  navigate={navigate}
                />
              ))}
            </div>
          </section>
        )}
      </Container>
    </main>
  );
}
