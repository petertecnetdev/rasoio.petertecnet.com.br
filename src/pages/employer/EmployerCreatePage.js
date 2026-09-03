// src/pages/employer/EmployerCreatePage.jsx
import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Container, Row, Col, Spinner } from "react-bootstrap";

import GlobalNav from "../../components/GlobalNav";
import GlobalHeroList from "../../components/GlobalHeroList";
import GlobalButton from "../../components/GlobalButton";
import EmployerCreateForm from "../../components/employer/EmployerCreateForm";
import useImageUtils from "../../hooks/useImageUtils";
import useEmployerCreate from "../../hooks/useEmployerCreate";
import "./EmployerCreatePage.css";

const PLACEHOLDER = "/images/logo.png";

export default function EmployerCreatePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);

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
    detachEmployer,
  } = useEmployerCreate(slug);

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
      title: "Adicionar colaborador",
      description: "Busque um usuário e vincule-o à equipe deste estabelecimento.",
      subtitle,
      metrics: [],
    };
  }, [establishment]);

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
              onAssociate={async (user) => {
                await createEmployer(user);
              }}
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
