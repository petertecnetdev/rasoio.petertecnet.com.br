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
import { canScheduleItem } from "../../utils/schedulingCapabilities";

import "../homepage.css";
import GlobalPageHeader from "../../components/GlobalPageHeader";
import GlobalCarousel from "../../components/GlobalCarousel";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";

const PLACEHOLDER = "/images/logo.png";

const establishmentIdOf = (entity) =>
  entity?.establishment_id ??
  entity?.establishmentId ??
  entity?.entity_id ??
  entity?.entityId ??
  entity?.establishment?.id ??
  null;

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

  const visibleServiceItems = useMemo(
    () =>
      (Array.isArray(serviceItems) ? serviceItems : []).map((item) => {
        const establishmentId = establishmentIdOf(item);
        const establishment = item?.establishment || (establishmentId != null ? { id: establishmentId } : null);
        return {
          ...item,
          can_schedule: canScheduleItem({
            item,
            establishment,
            employers: Array.isArray(employers) ? employers : [],
            services: Array.isArray(serviceItems) ? serviceItems : [],
          }),
        };
      }),
    [serviceItems, employers]
  );

  const headerMeta = useMemo(
    () => [cityLabel, "Serviços com agendamento online"].filter(Boolean),
    [cityLabel]
  );

  const headerDescription = useMemo(
    () =>
      `Escolha o serviço, veja os profissionais disponíveis e agende seu horário.${
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
        <div className="hp-loading" aria-live="polite">Carregando…</div>
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
        <div className="hp-loading" role="alert">{serviceError}</div>
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
          subtitle="Encontre serviços disponíveis nos estabelecimentos da sua região"
          items={visibleServiceItems}
          fmtBRL={(value) => value}
          navigate={navigate}
          openSchedulePopup={async (item) => {
            if (!item?.can_schedule) return;

            if (isLoadingEmployers) {
              await Swal.fire({
                icon: "info",
                title: "Carregando profissionais",
                text: "Aguarde um instante para abrir os horários disponíveis.",
              });
              return;
            }

            if (employerError) {
              await Swal.fire({ icon: "error", title: "Erro", text: employerError });
              return;
            }

            const establishmentId = establishmentIdOf(item);
            const filteredEmployers = (Array.isArray(employers) ? employers : []).filter(
              (employer) => Number(establishmentIdOf(employer)) === Number(establishmentId)
            );

            if (!filteredEmployers.length) return;
            await openSchedulePopup({
              service: item,
              establishment: item?.establishment || (establishmentId != null ? { id: establishmentId } : null),
              filteredEmployers,
            });
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
