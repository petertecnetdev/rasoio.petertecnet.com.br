// src/pages/establishment/EstablishmentEmployersPage.jsx
import React from "react";
import { Alert, Badge, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import GlobalButton from "../../components/GlobalButton";
import GlobalCard from "../../components/GlobalCard";
import useEstablishmentEmployersBySlug from "../../hooks/useEstablishmentEmployersBySlug";
import api from "../../services/api";

export default function EstablishmentEmployersPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { establishment, employers, count, loading, apiError, refetch } =
    useEstablishmentEmployersBySlug(slug);

  const handleDetach = async (employer) => {
    const firstName = employer.user?.first_name || "este barbeiro";
    const result = await Swal.fire({
      title: "Remover barbeiro da equipe?",
      text: `Deseja remover ${firstName} desta barbearia?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remover",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await api.post("/employer/detach", {
        employer_id: employer.id,
        establishment_id: establishment.id,
      });
      await refetch();
      await Swal.fire({
        icon: "success",
        title: "Barbeiro removido",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Erro",
        text:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Não foi possível remover o barbeiro.",
      });
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center" aria-live="polite">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!establishment) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          {apiError || "Barbearia não encontrada ou você não possui acesso a ela."}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <EstablishmentHero
        title={`Equipe da ${establishment.name}`}
        subtitle="Barbeiros e colaboradores vinculados à barbearia"
        description="Adicione profissionais, acompanhe o time e remova vínculos quando necessário."
        city={establishment.city}
        uf={establishment.uf}
        logo={establishment?.images?.logo}
        background={establishment?.images?.background}
      />

      {apiError && <Alert variant="danger" className="mt-3">{apiError}</Alert>}

      <Card className="mt-4 mb-4 bg-dark text-light border-secondary">
        <Card.Header className="d-flex justify-content-between align-items-center gap-3 flex-wrap bg-transparent">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-semibold">Equipe</span>
            <Badge bg="secondary">{count}</Badge>
          </div>
          <GlobalButton
            size="sm"
            variant="primary"
            onClick={() => navigate(`/employer/create/${establishment.slug}`)}
          >
            Adicionar barbeiro
          </GlobalButton>
        </Card.Header>

        <Card.Body>
          {employers.length === 0 ? (
            <div className="text-secondary text-center py-4">
              Nenhum barbeiro vinculado. Adicione o primeiro profissional da equipe.
            </div>
          ) : (
            <Row className="g-3">
              {employers.map((employer) => {
                const fullName = `${employer.user?.first_name || ""} ${employer.user?.last_name || ""}`.trim();
                const avatar =
                  employer.images?.avatar ||
                  employer.user?.images?.avatar ||
                  employer.user?.avatar ||
                  null;
                const metrics = employer.metrics || {};
                const userName = employer.user?.user_name || employer.user?.username || null;

                return (
                  <Col key={employer.id} xl={3} lg={4} md={6} xs={12}>
                    <GlobalCard
                      item={{
                        ...employer,
                        type: "employer",
                        name: fullName || employer.user?.email || "Barbeiro",
                        user_name: userName,
                        user: employer.user,
                        avatar,
                        images: { avatar },
                        metrics,
                        establishment,
                      }}
                      navigate={navigate}
                      actions={
                        <div className="d-flex flex-column gap-2">
                          <div className="d-flex flex-wrap gap-1">
                            <Badge bg="secondary">Atendimentos: {metrics.total_orders ?? 0}</Badge>
                            <Badge bg="success">Concluídos: {metrics.completed_orders ?? 0}</Badge>
                          </div>
                          <GlobalButton
                            size="sm"
                            variant="danger"
                            full
                            onClick={() => handleDetach(employer)}
                          >
                            Remover da equipe
                          </GlobalButton>
                        </div>
                      }
                    />
                  </Col>
                );
              })}
            </Row>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
