// src/pages/employer/EmployerHomePage.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiBaseUrl, appId } from "../../config";

import useEmployerHome from "../../hooks/useEmployerHome";
import useAppointment from "../../hooks/useAppointment";
import useImageUtils from "../../hooks/useImageUtils";
import useSchedulePopup from "../../hooks/useSchedulePopup";
import useSelectedCity from "../../hooks/useSelectedCity";

import "../homepage.css";

import GlobalPageHeader from "../../components/GlobalPageHeader";
import GlobalCarousel from "../../components/GlobalCarousel";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";

const PLACEHOLDER = "/images/logo.png";

export default function EmployerHomePage() {
  const { employers, isLoading, error } = useEmployerHome(apiBaseUrl, appId);
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
      `Encontre barbeiros disponíveis e escolha o profissional ideal.${
        cityLabel ? ` (${cityLabel})` : ""
      }`,
    [cityLabel]
  );

  if (isLoading) {
    return (
      <div className="hp-wrapper">
        <GlobalPageHeader
          title="Barbeiros"
          variant="home"
          description="Carregando barbeiros da sua região..."
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
          title="Barbeiros"
          variant="home"
          description="Não foi possível carregar os barbeiros agora."
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
          title="Barbeiros"
          variant="home"
          description={headerDescription}
          meta={headerMeta}
        />

        <GlobalCarousel
          title="Barbeiros"
          subtitle="Veja perfis, barbearias e horários disponíveis"
          items={employers}
          fmtBRL={(value) => value}
          navigate={navigate}
          openSchedulePopup={(item) => openSchedulePopup({ employer: item })}
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
