// src/pages/establishment/EstablishmentEmployersPage.jsx
import React, { useMemo } from "react";
import { Container, Spinner, Alert } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import GlobalNav from "../../components/GlobalNav";
import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import GlobalCarousel from "../../components/GlobalCarousel";
import useEstablishmentEmployers from "../../hooks/useEstablishmentEmployers";
import useImageUtils from "../../hooks/useImageUtils";

const PLACEHOLDER = "/images/logo.png";

export default function EstablishmentEmployersPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { imageUrl } = useImageUtils(PLACEHOLDER);

  const { employers, establishment, loading, apiError } =
    useEstablishmentEmployers(slug);

  const mappedEmployers = useMemo(() => {
    return (employers || []).map((emp) => {
      const u = emp.user || {};
      const avatar =
        emp.images?.avatar ||
        u.avatar ||
        PLACEHOLDER;

      return {
        id: emp.id,
        type: "employer",
        name:
          `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
          "Profissional",
        slug: u.user_name,
        city: u.city,
        uf: u.uf,
        avatar,
        image: avatar,
        images: {
          avatar,
          gallery: emp.images?.gallery || [],
        },
        total_views: emp.metrics?.total_views ?? 0,
      };
    });
  }, [employers]);

  if (loading) {
    return (
      <>
        <GlobalNav />
        <Container className="py-5 text-center">
          <Spinner animation="border" />
        </Container>
      </>
    );
  }

  if (!establishment) {
    return (
      <>
        <GlobalNav />
        <Container className="py-4">
          <Alert variant="warning">Estabelecimento não encontrado.</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <GlobalNav />

      <Container className="py-4">
        <EstablishmentHero
          title="Profissionais do Estabelecimento"
          subtitle={`Equipe de ${establishment.fantasy || establishment.name}`}
          icon="bi-people-fill"
          badge="Estabelecimento"
          backTo={`/establishment/view/${establishment.slug}`}
        />

        {apiError && <Alert variant="danger">{apiError}</Alert>}

        {mappedEmployers.length === 0 ? (
          <Alert variant="secondary">
            Nenhum profissional cadastrado neste estabelecimento.
          </Alert>
        ) : (
          <GlobalCarousel
            title="Equipe"
            items={mappedEmployers}
            navigate={navigate}
            showSchedule={false}
          />
        )}
      </Container>
    </>
  );
}
