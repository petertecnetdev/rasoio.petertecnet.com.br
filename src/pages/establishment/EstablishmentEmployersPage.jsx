// src/pages/establishment/EstablishmentEmployersPage.jsx
import React, { useState } from "react";
import { Alert, Badge, Col, Container, Row, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import GlobalButton from "../../components/GlobalButton";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import useEstablishmentEmployersBySlug from "../../hooks/useEstablishmentEmployersBySlug";
import api from "../../services/api";
import { appId } from "../../config";
import { getApiErrorMessage } from "../../utils/apiError";
import "./EstablishmentEmployersPage.css";

export default function EstablishmentEmployersPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [processingMessages, setProcessingMessages] = useState(["Processando solicitação..."]);
  const { establishment, employers, count, loading, apiError, refetch } =
    useEstablishmentEmployersBySlug(slug);

  const handleDetach = async (employer) => {
    const firstName = employer.user?.first_name || "este colaborador";
    const result = await Swal.fire({
      title: "Remover colaborador?",
      text: `Deseja remover ${firstName} deste estabelecimento?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remover da equipe",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setProcessingMessages([
      `Removendo ${firstName} da equipe...`,
      "Atualizando colaboradores...",
      "Finalizando solicitação...",
    ]);
    setProcessing(true);

    try {
      await api.post("/employer/detach", {
        employer_id: employer.id,
        establishment_id: establishment.id,
        app_id: appId,
      });
      await refetch();
      setProcessing(false);
      await Swal.fire({
        icon: "success",
        title: "Colaborador removido",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (error) {
      setProcessing(false);
      await Swal.fire({
        icon: "error",
        title: "Não foi possível remover",
        text: getApiErrorMessage(error, "Não foi possível remover o colaborador."),
      });
    }
  };

  if (loading && !establishment) {
    return (
      <main className="team-management-page">
        <Container className="py-5" aria-live="polite">
          <section className="team-management-shell team-management-loading">
            <Spinner animation="border" role="status" />
            <div>
              <h2>Carregando colaboradores</h2>
              <p className="mb-0">
                Identificando o estabelecimento e preparando a gestão da equipe.
              </p>
            </div>
          </section>
        </Container>
      </main>
    );
  }

  if (!establishment) {
    return (
      <main className="team-management-page">
        <Container className="py-5">
          <section className="team-management-shell">
            <Alert variant="danger" className="mb-4">
              <Alert.Heading>Não foi possível abrir os colaboradores</Alert.Heading>
              <p className="mb-0">
                {apiError ||
                  "Não foi possível identificar este estabelecimento na sua conta."}
              </p>
            </Alert>

            <div className="d-flex flex-wrap gap-2">
              <GlobalButton variant="primary" onClick={() => refetch()}>
                Tentar novamente
              </GlobalButton>
              <GlobalButton variant="outline" onClick={() => navigate("/establishment/my")}>
                Voltar aos estabelecimentos
              </GlobalButton>
            </div>
          </section>
        </Container>
      </main>
    );
  }

  return (
    <main className="team-management-page">
      {processing && (
        <ProcessingIndicatorComponent
          messages={processingMessages}
          interval={1100}
          blocking
        />
      )}

      <EstablishmentHero
        title={`Equipe da ${establishment.fantasy || establishment.name}`}
        subtitle="Gestão de colaboradores"
        description="Adicione profissionais, confira o vínculo de cada pessoa e mantenha a equipe do estabelecimento organizada."
        city={establishment.city}
        uf={establishment.uf}
        logo={establishment?.images?.logo}
        background={establishment?.images?.background}
      />

      <Container className="py-4 py-lg-5">
        {apiError && (
          <Alert variant="warning" className="mb-4">
            <Alert.Heading>Não foi possível atualizar a lista da equipe</Alert.Heading>
            <p className="mb-2">{apiError}</p>
            <GlobalButton variant="outline" size="sm" onClick={() => refetch()}>
              Tentar carregar novamente
            </GlobalButton>
          </Alert>
        )}

        <section className="team-management-shell">
          <header className="team-management-header">
            <div>
              <span className="team-management-kicker">Equipe ativa</span>
              <div className="team-management-title-row">
                <h2>Colaboradores</h2>
                <Badge bg="info" text="dark">{count}</Badge>
              </div>
              <p>
                Profissionais vinculados a este estabelecimento na Rasoio.
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
              <p>
                Adicione o primeiro profissional para liberar os agendamentos deste estabelecimento.
              </p>
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
                          disabled={processing}
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
