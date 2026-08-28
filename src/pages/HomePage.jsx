// src/pages/HomePage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { apiBaseUrl, appId } from "../config";

import useHome from "../hooks/useHome";
import useAppointment from "../hooks/useAppointment";
import useImageUtils from "../hooks/useImageUtils";
import useSchedulePopup from "../hooks/useSchedulePopup";

import "./homepage.css";

import GlobalPageHeader from "../components/GlobalPageHeader";
import GlobalCarousel from "../components/GlobalCarousel";
import AppointmentWizardModal from "../components/appointment/AppointmentWizardModal";

const PLACEHOLDER = "/images/logo.png";

export default function HomePage() {
  const {
    establishments,
    employers,
    serviceItems,
    productItems,
    isLoading,
    error,
  } = useHome(apiBaseUrl, appId);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [currentCity, setCurrentCity] = useState(() => localStorage.getItem("selectedCity"));
  const [currentUF, setCurrentUF] = useState(() => localStorage.getItem("selectedUF"));

  useEffect(() => {
    const sync = () => {
      setCurrentCity(localStorage.getItem("selectedCity"));
      setCurrentUF(localStorage.getItem("selectedUF"));
    };

    window.addEventListener("cityChanged", sync);

    const iv = setInterval(sync, 900);

    return () => {
      window.removeEventListener("cityChanged", sync);
      clearInterval(iv);
    };
  }, []);

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

  const safeNavigate = useMemo(() => (path) => (window.location.href = path), []);

  const headerMeta = useMemo(() => {
    const cityLabel = currentCity && currentUF ? `${currentCity} - ${currentUF}` : currentCity || "";
    return [cityLabel, "Agende em poucos cliques"].filter(Boolean);
  }, [currentCity, currentUF]);

  const headerDescription = useMemo(() => {
    const cityLabel = currentCity && currentUF ? `${currentCity} - ${currentUF}` : currentCity || "";
    return `Aqui você encontra estabelecimentos, profissionais, serviços e produtos para agendar com rapidez.${
      cityLabel ? ` (${cityLabel})` : ""
    }`;
  }, [currentCity, currentUF]);

  const handleOpenFromEstablishment = useCallback(
    async (est) => {
      try {
        const filteredEmployers = (Array.isArray(employers) ? employers : []).filter(
          (emp) => Number(emp.establishment_id) === Number(est?.id)
        );

        await openSchedulePopup({
          establishment: est,
          filteredEmployers,
        });
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível abrir o agendamento agora.",
        });
      }
    },
    [employers, openSchedulePopup]
  );

  const handleOpenFromEmployer = useCallback(
    (emp) => {
      try {
        const estId =
          emp?.establishment_id ??
          emp?.establishmentId ??
          emp?.entity_id ??
          emp?.entityId ??
          emp?.establishment?.id ??
          null;

        const resolvedEstablishment = (Array.isArray(establishments) ? establishments : []).find(
          (e) => Number(e?.id) === Number(estId)
        );

        openSchedulePopup({
          employer: emp,
          establishment: resolvedEstablishment || emp?.establishment || null,
        });
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível abrir o agendamento agora.",
        });
      }
    },
    [openSchedulePopup, establishments]
  );

  const handleOpenFromItem = useCallback(
    (item) => {
      try {
        const entityId = item?.establishment_id || item?.entity_id || item?.entityId;

        const filteredEmployers = (Array.isArray(employers) ? employers : []).filter(
          (emp) => Number(emp.establishment_id) === Number(entityId)
        );

        openSchedulePopup({
          service: item,
          filteredEmployers,
        });
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível abrir o agendamento agora.",
        });
      }
    },
    [employers, openSchedulePopup]
  );

  if (isLoading) {
    return (
      <div className="hp-wrapper">
        <GlobalPageHeader
          title="Home"
          variant="home"
          description="Carregando dados da sua região..."
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
          title="Home"
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
        <GlobalPageHeader title="Home" variant="home" description={headerDescription} meta={headerMeta} />

        <div className="hp-sections">
          <GlobalCarousel
            title="Estabelecimentos"
            subtitle="Escolha um local e agende rápido"
            items={establishments}
            fmtBRL={(v) => v}
            navigate={safeNavigate}
            openSchedulePopup={handleOpenFromEstablishment}
            showSchedule
            showDots
          />

          <GlobalCarousel
            title="Profissionais"
            subtitle="Encontre o profissional ideal"
            items={employers}
            fmtBRL={(v) => v}
            navigate={navigate}
            openSchedulePopup={handleOpenFromEmployer}
            showSchedule
            showDots
          />

          <GlobalCarousel
            title="Serviços"
            subtitle="Escolha um serviço e finalize em poucos cliques"
            items={serviceItems}
            fmtBRL={(v) => v}
            navigate={safeNavigate}
            openSchedulePopup={handleOpenFromItem}
            showSchedule
            showDots
          />

          {/* ✅ Produtos: só detalhes (sem agendar) */}
          <GlobalCarousel
            title="Produtos"
            subtitle="Produtos disponíveis"
            items={productItems}
            fmtBRL={(v) => v}
            navigate={safeNavigate}
            openSchedulePopup={handleOpenFromItem}
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
