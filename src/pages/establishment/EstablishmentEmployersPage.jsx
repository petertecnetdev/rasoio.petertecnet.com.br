// src/pages/establishment/EstablishmentEmployersPage.jsx
import React, { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import GlobalButton from "../../components/GlobalButton";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import useEstablishmentEmployersBySlug from "../../hooks/useEstablishmentEmployersBySlug";
import {
  addTeamMember,
  removeTeamMember,
  searchTeamMemberCandidates,
} from "../../services/platformManagementApi";
import { getApiErrorMessage } from "../../utils/apiError";
import "./EstablishmentEmployersPage.css";

const FALLBACK_AVATAR = "/images/logo.png";

function candidateName(candidate) {
  const fullName = `${candidate?.first_name || ""} ${candidate?.last_name || ""}`.trim();
  return fullName || candidate?.email || candidate?.user_name || "Usuário";
}

export default function EstablishmentEmployersPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [processingMessages, setProcessingMessages] = useState(["Processando solicitação..."]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("profissional");
  const [candidates, setCandidates] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState(null);

  const { establishment, employers, loading, apiError, refetch } =
    useEstablishmentEmployersBySlug(slug);

  const safeEmployers = useMemo(
    () =>
      Array.isArray(employers)
        ? employers.filter((member) => member && typeof member === "object")
        : [],
    [employers]
  );

  const establishmentName =
    establishment?.fantasy || establishment?.name || "Estabelecimento";

  const handleSearch = async (event) => {
    event.preventDefault();
    const term = query.trim();
    setSearched(true);
    setCandidates([]);

    if (!establishment?.id) {
      await Swal.fire({
        icon: "error",
        title: "Estabelecimento indisponível",
        text: "Não foi possível identificar o estabelecimento para pesquisar colaboradores.",
      });
      return;
    }

    if (term.length < 2) {
      await Swal.fire({
        icon: "warning",
        title: "Informe quem você procura",
        text: "Digite pelo menos 2 caracteres do nome, e-mail, telefone, CPF ou @usuário.",
      });
      return;
    }

    try {
      setSearching(true);
      const results = await searchTeamMemberCandidates(establishment.id, term);
      setCandidates(Array.isArray(results) ? results : []);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Não foi possível pesquisar",
        text: getApiErrorMessage(error, "Não foi possível pesquisar usuários para a equipe."),
      });
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (candidate) => {
    if (!establishment?.id || !candidate?.id) return;

    try {
      setAddingUserId(candidate.id);
      const result = await addTeamMember({
        userId: candidate.id,
        establishmentId: establishment.id,
        role,
        permissions: [],
      });

      await refetch();
      setCandidates((current) =>
        current.map((item) =>
          Number(item?.id) === Number(candidate.id)
            ? {
                ...item,
                is_team_member: true,
                team_member: result?.employer || item?.team_member || null,
              }
            : item
        )
      );

      await Swal.fire({
        icon: "success",
        title: "Colaborador adicionado",
        text: result?.message || `${candidateName(candidate)} agora faz parte desta equipe.`,
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Não foi possível adicionar",
        text: getApiErrorMessage(error, "Não foi possível adicionar o colaborador à equipe."),
      });
    } finally {
      setAddingUserId(null);
    }
  };

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
      setCandidates((current) =>
        current.map((candidate) =>
          Number(candidate?.team_member?.id) === Number(employer.id)
            ? { ...candidate, is_team_member: false, team_member: null }
            : candidate
        )
      );
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

  return (
    <main className="team-management-page" data-page="establishment-team-management-v2">
      {processing && (
        <ProcessingIndicatorComponent
          messages={processingMessages}
          interval={1100}
          blocking
        />
      )}

      <Container className="py-4 py-lg-5">
        <section className="team-management-shell team-management-intro mb-4">
          <div>
            <span className="team-management-kicker">Gestão da equipe</span>
            <h1 className="team-management-page-title">
              Colaboradores {establishment ? `da ${establishmentName}` : "do estabelecimento"}
            </h1>
            <p className="mb-0">
              Consulte os profissionais vinculados e adicione novas pessoas à equipe sem sair desta tela.
            </p>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <GlobalButton variant="outline" onClick={() => navigate("/establishment/my")}>
              Voltar aos estabelecimentos
            </GlobalButton>
            <GlobalButton variant="primary" onClick={() => document.getElementById("team-add-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              + Adicionar colaborador
            </GlobalButton>
          </div>
        </section>

        {loading && !establishment && (
          <section className="team-management-shell team-management-loading mb-4" aria-live="polite">
            <Spinner animation="border" role="status" />
            <div>
              <h2>Carregando equipe</h2>
              <p className="mb-0">Identificando o estabelecimento e seus colaboradores.</p>
            </div>
          </section>
        )}

        {!loading && !establishment && (
          <section className="team-management-shell mb-4">
            <Alert variant="danger" className="mb-3">
              <Alert.Heading>Não foi possível carregar o estabelecimento</Alert.Heading>
              <p className="mb-0">
                {apiError || "O estabelecimento não foi encontrado entre os que você administra."}
              </p>
            </Alert>
            <GlobalButton variant="primary" onClick={() => refetch()}>
              Tentar novamente
            </GlobalButton>
          </section>
        )}

        {establishment && (
          <>
            <section id="team-add-panel" className="team-management-shell team-add-panel mb-4">
              <header className="team-add-header">
                <div>
                  <span className="team-management-kicker">Novo vínculo</span>
                  <h2>Adicionar colaborador</h2>
                  <p>
                    Pesquise uma conta Peter Tecnet e vincule essa pessoa somente a este estabelecimento.
                  </p>
                </div>
              </header>

              <Form onSubmit={handleSearch}>
                <Row className="g-3 align-items-end">
                  <Col lg={8} xs={12}>
                    <Form.Group controlId="team-candidate-search">
                      <Form.Label>Nome, e-mail, CPF, telefone ou @usuário</Form.Label>
                      <Form.Control
                        value={query}
                        onChange={(event) => {
                          setQuery(event.target.value);
                          setSearched(false);
                        }}
                        placeholder="Digite quem você quer adicionar"
                        autoComplete="off"
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={4} xs={12}>
                    <Form.Group controlId="team-candidate-role">
                      <Form.Label>Função no estabelecimento</Form.Label>
                      <Form.Control
                        value={role}
                        onChange={(event) => setRole(event.target.value)}
                        placeholder="Ex.: profissional"
                        maxLength={255}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <GlobalButton type="submit" variant="primary" disabled={searching || query.trim().length < 2}>
                      {searching ? "Buscando..." : "Buscar pessoa"}
                    </GlobalButton>
                  </Col>
                </Row>
              </Form>

              {searched && !searching && candidates.length === 0 && (
                <Alert variant="info" className="mt-4 mb-0">
                  Nenhum usuário encontrado. O colaborador precisa ter uma conta Peter Tecnet para ser vinculado.
                </Alert>
              )}

              {candidates.length > 0 && (
                <div className="team-candidate-list mt-4">
                  {candidates.map((candidate) => {
                    const linkedMember = candidate?.team_member || null;
                    const isLinked = Boolean(candidate?.is_team_member && linkedMember?.id);
                    const isAdding = Number(addingUserId) === Number(candidate?.id);

                    return (
                      <article key={candidate.id} className="team-candidate-row">
                        <div className="team-candidate-person">
                          <img
                            src={candidate.avatar || FALLBACK_AVATAR}
                            alt=""
                            onError={(event) => {
                              if (!event.currentTarget.src.endsWith(FALLBACK_AVATAR)) {
                                event.currentTarget.src = FALLBACK_AVATAR;
                              }
                            }}
                          />
                          <div>
                            <strong>{candidateName(candidate)}</strong>
                            <span>{candidate.email || candidate.phone || (candidate.user_name ? `@${candidate.user_name}` : "Conta Peter Tecnet")}</span>
                          </div>
                        </div>

                        <div className="team-candidate-actions">
                          {isLinked ? (
                            <>
                              <Badge bg="info" text="dark">Já faz parte da equipe</Badge>
                              <GlobalButton
                                size="sm"
                                variant="danger"
                                disabled={processing}
                                onClick={() => handleDetach({ ...linkedMember, user: candidate })}
                              >
                                Remover
                              </GlobalButton>
                            </>
                          ) : (
                            <GlobalButton
                              size="sm"
                              variant="success"
                              disabled={isAdding || !role.trim()}
                              onClick={() => handleAdd(candidate)}
                            >
                              {isAdding ? "Adicionando..." : "Adicionar à equipe"}
                            </GlobalButton>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {apiError && (
              <Alert variant="warning" className="mb-4">
                <Alert.Heading>A lista da equipe não pôde ser atualizada</Alert.Heading>
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
                    <h2>Colaboradores vinculados</h2>
                    <Badge bg="info" text="dark">{safeEmployers.length}</Badge>
                  </div>
                  <p>Profissionais que atualmente fazem parte deste estabelecimento.</p>
                </div>

                <GlobalButton variant="outline" onClick={() => refetch()} disabled={loading}>
                  {loading ? "Atualizando..." : "Atualizar lista"}
                </GlobalButton>
              </header>

              {safeEmployers.length === 0 ? (
                <div className="team-empty-state">
                  <div className="team-empty-icon" aria-hidden="true">👥</div>
                  <h3>Nenhum colaborador vinculado</h3>
                  <p>Use o formulário acima para adicionar o primeiro profissional desta equipe.</p>
                  <GlobalButton
                    variant="primary"
                    onClick={() => document.getElementById("team-add-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}
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
                                if (!event.currentTarget.src.endsWith(FALLBACK_AVATAR)) {
                                  event.currentTarget.src = FALLBACK_AVATAR;
                                }
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
          </>
        )}
      </Container>
    </main>
  );
}
