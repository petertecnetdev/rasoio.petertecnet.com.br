// src/pages/establishment/EstablishmentEmployersPage.jsx
import React, { useMemo, useState } from "react";
import { Alert, Badge, Col, Container, Row, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import GlobalButton from "../../components/GlobalButton";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import useEstablishmentEmployersBySlug from "../../hooks/useEstablishmentEmployersBySlug";
import { removeTeamMember } from "../../services/platformManagementApi";
import { getApiErrorMessage } from "../../utils/apiError";
import "./EstablishmentEmployersPage.css";

const FALLBACK_AVATAR = "/images/logo.png";

export default function EstablishmentEmployersPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [processingMessages, setProcessingMessages] = useState(["Processando solicitação..."]);
  const { establishment, employers, loading, apiError, refetch } =
    useEstablishmentEmployersBySlug(slug);

  const safeEmployers = useMemo(
    () =>
      Array.isArray(employers)
        ? employers.filter((member) => member && typeof member === "object")
        : [],
    [employers]
  );

  const handleDetach = async (employer) => {
    if (!employer?.id) {
      await Swal.fire({
        icon: "error",
        title: "Colaborador inválido",
        text: "Não foi possível identificar o vínculo deste colaborador.",
      });
      return;
    }

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
      await removeTeamMember(employer.id);
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

  const establishmentName =
    establishment.fantasy || establishment.name || "Estabelecimento";

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
        title={`Equipe da ${establishmentName}`}
        subtitle="Gestão de colaboradores"
        description="Adicione profissionais, confira o vínculo de cada pessoa e mantenha a equipe do estabelecimento organizada."
        city={establishment.city}
        uf={establishment.uf}
        logo={establishment?.images?.logo || establishment?.logo || null}
        background={
          establishment?.images?.background || establishment?.background || null
        }
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
                <Badge bg="info" text="dark">{safeEmployers.length}</Badge>
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

          {safeEmployers.length === 0 ? (
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
              {safeEmployers.map((employer) => {
                const user = employer.user || {};
                const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
                const avatar =
                  employer.images?.avatar ||
                  user.images?.avatar ||
                  user.avatar ||
                  FALLBACK_AVATAR;
                const metrics = employer.metrics || {};
                const userName = user.user_name || user.username || null;

                return (
                  <Col key={employer.id || `${user.id || "member"}-${user.email || fullName}`} xl={4} md={6} xs={12}>
                    <article className="team-member-card">
                      <div className="team-member-top">
                        <img
                          src={avatar}
                          alt=""
                          className="team-member-avatar"
                          onError={(event) => {
                            if (event.currentTarget.src.endsWith(FALLBACK_AVATAR)) return;
                            event.currentTarget.src = FALLBACK_AVATAR;
                          }}
                        />
                        <div className="team-member-copy">
                          <span className="team-member-role">{employer.role || "colaborador"}</span>
                          <h3>{fullName || user.email || "Colaborador"}</h3>
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
                          disabled={processing || !employer.id}
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
