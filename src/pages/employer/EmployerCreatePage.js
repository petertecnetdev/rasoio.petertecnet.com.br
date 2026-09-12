// src/pages/employer/EmployerCreatePage.jsx
import React, { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Container, Row, Col, Spinner } from "react-bootstrap";

import GlobalNav from "../../components/GlobalNav";
import GlobalHeroList from "../../components/GlobalHeroList";
import GlobalButton from "../../components/GlobalButton";
import EmployerCreateForm from "../../components/employer/EmployerCreateForm";
import useImageUtils from "../../hooks/useImageUtils";
import useEmployerCreate from "../../hooks/useEmployerCreate";
import {
  getOwnerActivation,
  setOwnerActivationEmployer,
} from "../../utils/ownerActivation";
import "./EmployerCreatePage.css";

const PLACEHOLDER = "/images/logo.png";

function getStoredUser() {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export default function EmployerCreatePage() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);
  const storedActivation = useMemo(() => getOwnerActivation(slug), [slug]);
  const isOnboarding = location.state?.onboarding === true || Boolean(storedActivation);
  const currentUser = useMemo(() => getStoredUser(), []);

  const {
    establishment,
    users,
    role,
    loading,
    initialLoading,
    searching,
    errors,
    loadError,
    setRole,
    searchUsers,
    createEmployer,
    inviteEmployer,
    detachEmployer,
  } = useEmployerCreate(slug);

  const continueToAvailability = (employerId) => {
    const targetEmployerId = Number(employerId);
    if (!Number.isInteger(targetEmployerId) || targetEmployerId <= 0) return;

    setOwnerActivationEmployer(targetEmployerId);
    navigate("/employer/schedules", {
      state: {
        onboarding: true,
        establishment,
        employerId: targetEmployerId,
        nextStep: "availability",
      },
    });
  };

  const associateAndContinue = async (user) => {
    const result = await createEmployer(user);
    if (!result) return;

    const employerId = result?.employer?.id || result?.id || user?.employer?.id;
    if (isOnboarding && employerId) {
      continueToAvailability(employerId);
    }
  };

  const inviteAndContinue = async (invite) => {
    const result = await inviteEmployer(invite);
    const employerId = result?.employer?.id;

    if (isOnboarding && employerId) {
      continueToAvailability(employerId);
    }
  };

  const heroData = useMemo(() => {
    const subtitle =
      establishment?.city && establishment?.uf
        ? `${establishment.city} - ${establishment.uf}`
        : "";

    return {
      logo:
        establishment?.images?.logo ||
        establishment?.logo ||
        PLACEHOLDER,
      background:
        establishment?.images?.background ||
        establishment?.background ||
        null,
      title: isOnboarding ? "Quem vai atender os primeiros clientes?" : "Adicionar colaborador",
      description: isOnboarding
        ? "Se você também realiza atendimentos, ative seu próprio perfil profissional agora e configure seus horários. Você também pode adicionar ou convidar outra pessoa da equipe."
        : "Busque uma conta existente ou convide um novo profissional por e-mail.",
      subtitle,
      metrics: [],
    };
  }, [establishment, isOnboarding]);

  if (initialLoading) {
    return (
      <>
        <GlobalNav />
        <Container className="py-5 text-center" aria-live="polite">
          <Spinner animation="border" />
          <p className="mt-3 mb-0">Carregando estabelecimento...</p>
        </Container>
      </>
    );
  }

  if (!establishment) {
    return (
      <>
        <GlobalNav />
        <Container className="py-5">
          <Alert variant="danger">
            <Alert.Heading>Não foi possível abrir o cadastro de colaborador</Alert.Heading>
            <p className="mb-0">
              {loadError ||
                "Não foi possível identificar o estabelecimento que será gerenciado."}
            </p>
          </Alert>
          <GlobalButton
            variant="primary"
            onClick={() => navigate(`/establishment/employers/${slug}`)}
          >
            Voltar para colaboradores
          </GlobalButton>
        </Container>
      </>
    );
  }

  return (
    <>
      <GlobalNav />

      <GlobalHeroList
        logo={heroData.logo}
        background={heroData.background}
        title={heroData.title}
        subtitle={heroData.subtitle}
        description={heroData.description}
        metrics={heroData.metrics}
        imageUrl={imageUrl}
        handleImgError={handleImgError}
      />

      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={10}>
            {isOnboarding && currentUser?.id && (
              <Alert variant="info" className="mb-4">
                <Alert.Heading className="h5">Você também atende clientes?</Alert.Heading>
                <p>
                  Ative seu próprio perfil profissional para configurar a disponibilidade agora e deixar a agenda pronta para receber o primeiro agendamento.
                </p>
                <GlobalButton
                  variant="primary"
                  disabled={loading}
                  onClick={() => associateAndContinue(currentUser)}
                >
                  {loading ? "Ativando..." : "Sim, eu também atendo"}
                </GlobalButton>
              </Alert>
            )}

            <EmployerCreateForm
              users={users}
              role={role}
              loading={loading}
              searching={searching}
              errors={errors}
              imageUrl={imageUrl}
              handleImgError={handleImgError}
              onSearch={searchUsers}
              setRole={setRole}
              establishmentId={establishment.id}
              onAssociate={associateAndContinue}
              onInvite={inviteAndContinue}
              onDetach={async (employerId) => {
                await detachEmployer(employerId);
              }}
            />
          </Col>
        </Row>
      </Container>
    </>
  );
}
