// src/pages/item/ItemServiceHomePage.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { apiBaseUrl, appId } from "../../config";

import useItemServiceHome from "../../hooks/useItemServiceHome";
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

export default function ItemServiceHomePage() {
  const { serviceItems, isLoading: isLoadingServices, error: serviceError } =
    useItemServiceHome(apiBaseUrl, appId);
  const { employers, isLoading: isLoadingEmployers, error: employerError } =
    useEmployerHome(apiBaseUrl, appId);

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
    () => [cityLabel, "Serviços de barbearia"].filter(Boolean),
    [cityLabel]
  );

  const headerDescription = useMemo(
    () =>
      `Escolha o serviço, veja os barbeiros disponíveis e agende seu horário.${
        cityLabel ? ` (${cityLabel})` : ""
      }`,
    [cityLabel]
  );

  if (isLoadingServices) {
    return (
      <div className="hp-wrapper">
        <GlobalPageHeader
          title="Serviços"
          variant="home"
          description="Carregando serviços da sua região..."
          meta={headerMeta}
          compact
        />
        <div className="hp-loading">Carregando…</div>
      </div>
    );
  }

  if (serviceError) {
    return (
      <div className="hp-wrapper">
        <GlobalPageHeader
          title="Serviços"
          variant="home"
          description="Não foi possível carregar os serviços agora."
          meta={headerMeta}
          compact
        />
        <div className="hp-loading">{serviceError}</div>
      </div>
    );
  }

  return (
    <>
      <div className="hp-wrapper">
        <GlobalPageHeader
          title="Serviços"
          variant="home"
          description={headerDescription}
          meta={headerMeta}
        />

        <GlobalCarousel
          title="Serviços"
          subtitle="Cortes, barba e outros serviços disponíveis nas barbearias"
          items={serviceItems}
          fmtBRL={(value) => value}
          navigate={navigate}
          openSchedulePopup={async (item) => {
            if (isLoadingEmployers) {
              await Swal.fire({
                icon: "info",
                title: "Carregando barbeiros",
                text: "Aguarde um instante para abrir os horários disponíveis.",
              });
              return;
            }

            if (employerError) {
              await Swal.fire({ icon: "error", title: "Erro", text: employerError });
              return;
            }

            const establishmentId =
              item.establishment_id ?? item.entity_id ?? item.entityId ?? null;
            const filteredEmployers = employers.filter(
              (employer) => Number(employer.establishment_id) === Number(establishmentId)
            );

            await openSchedulePopup({ service: item, filteredEmployers });
          }}
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
