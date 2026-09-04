// src/pages/HomePage.jsx
import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { apiBaseUrl, appId } from "../config";
import useHome from "../hooks/useHome";
import useAppointment from "../hooks/useAppointment";
import useImageUtils from "../hooks/useImageUtils";
import useSchedulePopup from "../hooks/useSchedulePopup";
import useSelectedCity from "../hooks/useSelectedCity";

import "./homepage.css";
import GlobalPageHeader from "../components/GlobalPageHeader";
import GlobalCarousel from "../components/GlobalCarousel";
import AppointmentWizardModal from "../components/appointment/AppointmentWizardModal";

const PLACEHOLDER = "/images/logo.png";

export default function HomePage() {
  const { establishments, employers, serviceItems, productItems, isLoading, error } =
    useHome(apiBaseUrl, appId);
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
      `Encontre estabelecimentos, profissionais, serviços e produtos para agendar com rapidez.${
        cityLabel ? ` (${cityLabel})` : ""
      }`,
    [cityLabel]
  );

  const showScheduleError = useCallback(() => {
    Swal.fire({
      icon: "error",
      title: "Não foi possível abrir a agenda",
      text: "Tente novamente em alguns instantes.",
    });
  }, []);

  const handleOpenFromEstablishment = useCallback(
    async (establishment) => {
      try {
        const filteredEmployers = employers.filter(
          (item) => Number(item.establishment_id) === Number(establishment?.id)
        );
        await openSchedulePopup({ establishment, filteredEmployers });
      } catch (error) {
        console.error(error);
        showScheduleError();
      }
    },
    [employers, openSchedulePopup, showScheduleError]
  );

  const handleOpenFromEmployer = useCallback(
    async (employer) => {
      try {
        const establishmentId =
          employer?.establishment_id ??
          employer?.establishmentId ??
          employer?.entity_id ??
          employer?.entityId ??
          employer?.establishment?.id ??
          null;

        const establishment = establishments.find(
          (item) => Number(item?.id) === Number(establishmentId)
        );

        await openSchedulePopup({
          employer,
          establishment: establishment || employer?.establishment || null,
        });
      } catch (error) {
        console.error(error);
        showScheduleError();
      }
    },
    [establishments, openSchedulePopup, showScheduleError]
  );

  const handleOpenFromItem = useCallback(
    async (item) => {
      try {
        const establishmentId =
          item?.establishment_id ?? item?.entity_id ?? item?.entityId ?? null;
        const filteredEmployers = employers.filter(
          (employer) => Number(employer.establishment_id) === Number(establishmentId)
        );
        await openSchedulePopup({ service: item, filteredEmployers });
      } catch (error) {
        console.error(error);
        showScheduleError();
      }
    },
    [employers, openSchedulePopup, showScheduleError]
  );

  if (isLoading) {
    return (
      <div className="hp-wrapper">
        <GlobalPageHeader
          title="Rasoio"
          variant="home"
          description="Carregando estabelecimentos e profissionais da sua região..."
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
          title="Rasoio"
          variant="home"
          description="Não foi possível carregar as informações agora."
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
          title="Rasoio"
          variant="home"
          description={headerDescription}
          meta={headerMeta}
        />

        <div className="hp-sections">
          <GlobalCarousel
            title="Estabelecimentos"
            subtitle="Escolha um estabelecimento e agende seu horário"
            items={establishments}
            fmtBRL={(value) => value}
            navigate={navigate}
            openSchedulePopup={handleOpenFromEstablishment}
            showSchedule
            showDots
          />

          <GlobalCarousel
            title="Profissionais"
            subtitle="Encontre o profissional ideal para você"
            items={employers}
            fmtBRL={(value) => value}
            navigate={navigate}
            openSchedulePopup={handleOpenFromEmployer}
            showSchedule
            showDots
          />

          <GlobalCarousel
            title="Serviços"
            subtitle="Escolha o serviço e agende em poucos cliques"
            items={serviceItems}
            fmtBRL={(value) => value}
            navigate={navigate}
            openSchedulePopup={handleOpenFromItem}
            showSchedule
            showDots
          />

          <GlobalCarousel
            title="Produtos"
            subtitle="Conheça os produtos dos estabelecimentos"
            items={productItems}
            fmtBRL={(value) => value}
            navigate={navigate}
            showDots
          />
        </div>
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
