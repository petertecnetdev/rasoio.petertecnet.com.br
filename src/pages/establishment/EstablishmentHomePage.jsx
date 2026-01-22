// src/pages/establishment/EstablishmentHomePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiBaseUrl, appId } from "../../config";

import useEstablishmentHome from "../../hooks/useEstablishmentHome";
import useAppointment from "../../hooks/useAppointment";
import useImageUtils from "../../hooks/useImageUtils";
import useSchedulePopup from "../../hooks/useSchedulePopup";

import "../HomePage.css";

import GlobalPageHeader from "../../components/GlobalPageHeader";
import GlobalCarousel from "../../components/GlobalCarousel";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";

const PLACEHOLDER = "/images/logo.png";

export default function EstablishmentHomePage() {
  const { establishments, isLoading, error } = useEstablishmentHome(apiBaseUrl, appId);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ✅ cidade/uf vêm do localStorage (o GlobalNav altera isso)
  const [currentCity, setCurrentCity] = useState(() => localStorage.getItem("selectedCity"));
  const [currentUF, setCurrentUF] = useState(() => localStorage.getItem("selectedUF"));

  // ✅ mantém o header atualizado quando o GlobalNav mudar cidade
  useEffect(() => {
    const sync = () => {
      setCurrentCity(localStorage.getItem("selectedCity"));
      setCurrentUF(localStorage.getItem("selectedUF"));
    };

    window.addEventListener("cityChanged", sync);

    // fallback leve pra mesma aba (caso não exista cityChanged)
    const iv = setInterval(sync, 800);

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

  // mantém o padrão de navegação já usado no projeto
  const safeNavigate = useMemo(() => (path) => (window.location.href = path), []);

  const headerMeta = useMemo(() => {
    const cityLabel =
      currentCity && currentUF ? `${currentCity} - ${currentUF}` : currentCity || "";
    return [cityLabel, "Agende em poucos cliques"].filter(Boolean);
  }, [currentCity, currentUF]);

  const headerDescription = useMemo(() => {
    const cityLabel =
      currentCity && currentUF ? `${currentCity} - ${currentUF}` : currentCity || "";
    return `Encontre estabelecimentos disponíveis e agende em poucos cliques.${
      cityLabel ? ` (${cityLabel})` : ""
    }`;
  }, [currentCity, currentUF]);

  if (isLoading) {
    return (
      <div className="hp-wrapper">
        <GlobalPageHeader
          title="Estabelecimentos"
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
          title="Estabelecimentos"
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
          title="Estabelecimentos"
          variant="home"
          description={headerDescription}
          meta={headerMeta}
        />

        <GlobalCarousel
          title="Estabelecimentos"
          items={establishments}
          navigate={safeNavigate}
          openSchedulePopup={async (item) => {
            // ✅ mesmo fluxo da HomePage: agendamento pré-selecionando o estabelecimento
            await openSchedulePopup({ establishment: item });
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
