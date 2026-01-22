// src/pages/service/ServiceHomePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { apiBaseUrl, appId } from "../../config";

import useItemServiceHome from "../../hooks/useItemServiceHome";
import useEmployerHome from "../../hooks/useEmployerHome";
import useAppointment from "../../hooks/useAppointment";
import useImageUtils from "../../hooks/useImageUtils";
import useSchedulePopup from "../../hooks/useSchedulePopup";

import "../HomePage.css";

import GlobalPageHeader from "../../components/GlobalPageHeader";
import GlobalCarousel from "../../components/GlobalCarousel";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";

const PLACEHOLDER = "/images/logo.png";

export default function ServiceHomePage() {
  const {
    serviceItems,
    isLoading: isLoadingSrv,
    error: errorSrv,
  } = useItemServiceHome(apiBaseUrl, appId);

  // ✅ necessário para filtrar profissionais do serviço (mesmo padrão da HomePage)
  const {
    employers,
    isLoading: isLoadingEmp,
    error: errorEmp,
  } = useEmployerHome(apiBaseUrl, appId);

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
  } = useSchedulePopup(apiBaseUrl, token);

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
    return `Escolha um serviço e agende com rapidez.${
      cityLabel ? ` (${cityLabel})` : ""
    }`;
  }, [currentCity, currentUF]);

  if (isLoadingSrv) {
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

  if (errorSrv) {
    return (
      <div className="hp-wrapper">
        <GlobalPageHeader
          title="Serviços"
          variant="home"
          description="Não foi possível carregar as informações agora."
          meta={headerMeta}
          compact
        />
        <div className="hp-loading">{errorSrv}</div>
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
          items={serviceItems}
          navigate={safeNavigate}
          openSchedulePopup={async (item) => {
            // ✅ mesmo comportamento da HomePage: filtra profissionais do estabelecimento do serviço
            if (isLoadingEmp) {
              Swal.fire({
                icon: "info",
                title: "Aguarde",
                text: "Carregando profissionais para agendamento…",
              });
              return;
            }

            if (errorEmp) {
              Swal.fire({
                icon: "error",
                title: "Erro",
                text: errorEmp,
              });
              return;
            }

            const entityId = item.establishment_id || item.entity_id || item.entityId;

            const filteredEmployers = (employers || []).filter(
              (emp) => Number(emp.establishment_id) === Number(entityId)
            );

            await openSchedulePopup({
              service: item,
              filteredEmployers,
            });
          }}
          showSchedule
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
