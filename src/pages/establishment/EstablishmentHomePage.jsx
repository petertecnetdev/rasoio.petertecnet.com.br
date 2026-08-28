// src/pages/establishment/EstablishmentHomePage.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiBaseUrl, appId } from "../../config";

import useEstablishmentHome from "../../hooks/useEstablishmentHome";
import useAppointment from "../../hooks/useAppointment";
import useImageUtils from "../../hooks/useImageUtils";
import useSchedulePopup from "../../hooks/useSchedulePopup";
import useSelectedCity from "../../hooks/useSelectedCity";

import "../homepage.css";

import GlobalPageHeader from "../../components/GlobalPageHeader";
import GlobalCarousel from "../../components/GlobalCarousel";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";

const PLACEHOLDER = "/images/logo.png";

export default function EstablishmentHomePage() {
  const { establishments, isLoading, error } = useEstablishmentHome(apiBaseUrl, appId);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { cityLabel } = useSelectedCity();
  const { imageUrl } = useImageUtils(PLACEHOLDER);

  const {
    showWizard,
    setShowWizard,
    wizardEstablishment,
    wizardEmployers,
    wizardServices,
    preselectedEmployer,
    preselectedServiceId,
    openSchedulePopup,
  } = useSchedulePopup(apiBaseUrl, token, appId);

  const { loadAvailableTimes, handleCreateAppointment } = useAppointment(
    apiBaseUrl,
    appId,
    token,
    wizardEstablishment
  );

  const headerMeta = useMemo(
    () => [cityLabel, "Agende em poucos cliques"].filter(Boolean),
    [cityLabel]
  );

  const headerDescription = useMemo(
    () =>
      `Encontre barbearias, conheça a equipe e escolha o melhor horário.${
        cityLabel ? ` (${cityLabel})` : ""
      }`,
    [cityLabel]
  );

  if (isLoading) {
    return (
      <div className="hp-wrapper">
        <GlobalPageHeader
          title="Barbearias"
          variant="home"
          description="Carregando barbearias da sua região..."
          meta={headerMeta}
          compact
        />
        <div className="hp-loading">Carregando…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hp-wrapper">
        <GlobalPageHeader
          title="Barbearias"
          variant="home"
          description="Não foi possível carregar as barbearias agora."
          meta={headerMeta}
          compact
        />
        <div className="hp-loading">{error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="hp-wrapper">
        <GlobalPageHeader
          title="Barbearias"
          variant="home"
          description={headerDescription}
          meta={headerMeta}
        />

        <GlobalCarousel
          title="Barbearias"
          subtitle="Conheça a estrutura, os barbeiros e os serviços"
          items={establishments}
          fmtBRL={(value) => value}
          navigate={navigate}
          openSchedulePopup={(item) => openSchedulePopup({ establishment: item })}
          showSchedule
          showDots
        />
      </div>

      <AppointmentWizardModal
        show={showWizard}
        onHide={() => setShowWizard(false)}
        employers={wizardEmployers}
        services={wizardServices}
        loadAvailableTimes={loadAvailableTimes}
        handleCreateAppointment={handleCreateAppointment}
        imageUrl={imageUrl}
        preselectedServiceId={preselectedServiceId}
        preselectedEmployer={preselectedEmployer}
        establishment={wizardEstablishment}
      />
    </>
  );
}
