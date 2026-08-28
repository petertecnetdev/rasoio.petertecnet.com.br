// src/pages/establishment/EstablishmentEmployersPage.jsx
import React from "react";
import { Alert, Badge, Col, Container, Row, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import GlobalButton from "../../components/GlobalButton";
import useEstablishmentEmployersBySlug from "../../hooks/useEstablishmentEmployersBySlug";
import api from "../../services/api";
import { appId } from "../../config";
import { getApiErrorMessage } from "../../utils/apiError";
import "./EstablishmentEmployersPage.css";

export default function EstablishmentEmployersPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { establishment, employers, count, loading, apiError, refetch } =
    useEstablishmentEmployersBySlug(slug);

  const handleDetach = async (employer) => {
    const firstName = employer.user?.first_name || "este colaborador";
    const result = await Swal.fire({
      title: "Remover colaborador?",
      text: `Deseja remover ${firstName} desta barbearia?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remover da equipe",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await api.post("/employer/detach", {
        employer_id: employer.id,
        establishment_id: establishment.id,
        app_id: appId,
      });
      await refetch();
      await Swal.fire({
        icon: "success",
        title: "Colaborador removido",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Não foi possível remover",
        text: getApiErrorMessage(error, "Não foi possível remover o colaborador."),
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
    <main className="team-management-page">
      <EstablishmentHero
        title={`Equipe da ${establishment.fantasy || establishment.name}`}
        subtitle="Gestão de colaboradores"
        description="Adicione profissionais, confira o vínculo de cada pessoa e mantenha a equipe da barbearia organizada."
        city={establishment.city}
        uf={establishment.uf}
        logo={establishment?.images?.logo}
        background={establishment?.images?.background}
      />

      <Container className="py-4 py-lg-5">
        {apiError && <Alert variant="danger" className="mb-4">{apiError}</Alert>}

        <section className="team-management-shell">
          <header className="team-management-header">
            <div>
              <span className="team-management-kicker">Equipe ativa</span>
              <div className="team-management-title-row">
                <h2>Colaboradores</h2>
                <Badge bg="info" text="dark">{count}</Badge>
              </div>
              <p>
                Profissionais vinculados exclusivamente a esta barbearia na Rasoio.
              </p>
            </div>

            <GlobalButton
              variant="primary"
              onClick={() => navigate(`/employer/create/${establishment.slug}`)}
            >
              + Adicionar colaborador
            </GlobalButton>
          </header>

          {employers.length === 0 ? (
            <div className="team-empty-state">
              <div className="team-empty-icon" aria-hidden="true">👥</div>
              <h3>Nenhum colaborador cadastrado</h3>
              <p>Adicione o primeiro profissional para começar a organizar a agenda da equipe.</p>
              <GlobalButton
                variant="primary"
                onClick={() => navigate(`/employer/create/${establishment.slug}`)}
              >
                Adicionar primeiro colaborador
              </GlobalButton>
            </div>
          ) : (
            <Row className="g-3 g-lg-4">
              {employers.map((employer) => {
                const fullName = `${employer.user?.first_name || ""} ${employer.user?.last_name || ""}`.trim();
                const avatar =
                  employer.images?.avatar ||
                  employer.user?.images?.avatar ||
                  employer.user?.avatar ||
                  "/images/logo.png";
                const metrics = employer.metrics || {};
                const userName = employer.user?.user_name || employer.user?.username || null;

                return (
                  <Col key={employer.id} xl={4} md={6} xs={12}>
                    <article className="team-member-card">
                      <div className="team-member-top">
                        <img
                          src={avatar}
                          alt=""
                          className="team-member-avatar"
                          onError={(event) => {
                            event.currentTarget.src = "/images/logo.png";
                          }}
                        />
                        <div className="team-member-copy">
                          <span className="team-member-role">{employer.role || "colaborador"}</span>
                          <h3>{fullName || employer.user?.email || "Colaborador"}</h3>
                          <p>{userName ? `@${userName}` : "Perfil sem nome de usuário"}</p>
                        </div>
                      </div>

                      <div className="team-member-metrics">
                        <div>
                          <strong>{metrics.total_orders ?? 0}</strong>
                          <span>Atendimentos</span>
                        </div>
                        <div>
                          <strong>{metrics.completed_orders ?? 0}</strong>
                          <span>Concluídos</span>
                        </div>
                      </div>

                      <div className="team-member-actions">
                        {userName && (
                          <button
                            type="button"
                            className="team-member-secondary"
                            onClick={() => navigate(`/employer/view/${userName}`)}
                          >
                            Ver perfil
                          </button>
                        )}
                        <button
                          type="button"
                          className="team-member-danger"
                          onClick={() => handleDetach(employer)}
                        >
                          Remover
                        </button>
                      </div>
                    </article>
                  </Col>
                );
              })}
            </Row>
          )}
        </section>
      </Container>
    </main>
  );
}
