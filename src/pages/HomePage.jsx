// src/pages/HomePage.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiBaseUrl, appId } from "../config";

import useHomePage from "../hooks/useHomePage";
import useAppointment from "../hooks/useAppointment";
import useAuthPrompt from "../hooks/useAuthPrompt";

import "./HomePage.css";

import GlobalCarousel from "../components/GlobalCarousel";
import TopList from "../components/home/TopList";
import GlobalNav from "../components/GlobalNav";
import CircleGauge from "../components/home/CircleGauge";
import CitySelectorModal from "../components/CitySelectorModal";
import HomeHeader from "../components/home/HomeHeader";
import StatsQuick from "../components/home/StatsQuick";
import HighlightsSection from "../components/home/HighlightsSection";
import AppointmentWizardModal from "../components/appointment/AppointmentWizardModal";

export default function HomePage() {
  const navigate = useNavigate();

  const {
    establishments,
    employers,
    items,
    stats,
    isLoading,
    city,
    uf,
    fmtBRL,
  } = useHomePage(apiBaseUrl, appId);

  const [showCityModal, setShowCityModal] = useState(false);
  const [user] = useState(() => {
    const cached = localStorage.getItem("user");
    return cached ? JSON.parse(cached) : {};
  });

  const [showWizard, setShowWizard] = useState(false);
  const [wizardOptions, setWizardOptions] = useState({
    services: [],
    employers: [],
    preselectedService: null,
    preselectedEmployer: null,
  });
  const [selectedEstablishment, setSelectedEstablishment] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);

  useAuthPrompt();

  const { loadAvailableTimes, handleCreateAppointment } = useAppointment(
    apiBaseUrl,
    appId,
    token,
    selectedEstablishment
  );

  const handleChangeCity = () => {
    setShowCityModal(true);
  };

  const mappedEstablishments = useMemo(
    () =>
      (establishments || []).map((e) => ({
        ...e,
        type: e.type || "establishment",
      })),
    [establishments]
  );

  const mappedEmployers = useMemo(
    () =>
      (employers || []).map((emp) => ({
        ...emp,
        type: emp.type || "employer",
      })),
    [employers]
  );

  const mappedItems = useMemo(
    () =>
      (items || []).map((i) => ({
        ...i,
        type: i.type || "service",
      })),
    [items]
  );

  const resolveEstablishmentFromTarget = (target) => {
    if (!target) return null;

    if (target.type === "establishment") {
      return target;
    }

    const estId =
      target.establishment_id ||
      target.establishmentId ||
      target.establishment?.id ||
      null;

    if (!estId) return null;

    return (
      mappedEstablishments.find((e) => e.id === estId) ||
      establishments.find((e) => e.id === estId) ||
      null
    );
  };

  const openSchedulePopup = (target = {}) => {
    const establishment = resolveEstablishmentFromTarget(target);

    if (!establishment) {
      return;
    }

    setSelectedEstablishment(establishment);

    const estItems = (items || []).filter((i) => {
      const estIdItem =
        i.establishment_id ||
        i.establishmentId ||
        i.establishment?.id ||
        null;
      return estIdItem === establishment.id;
    });

    const estServices = estItems.map((i) => ({
      ...i,
      type: i.type === "product" ? "product" : "service",
    }));

    const estEmployers = (employers || [])
      .filter((emp) => {
        const estIdEmp =
          emp.establishment_id ||
          emp.establishmentId ||
          emp.establishment?.id ||
          null;
        return estIdEmp === establishment.id;
      })
      .map((emp) => ({
        ...emp,
        type: "employer",
      }));

    let preselectedService = null;
    let preselectedEmployer = null;

    if (
      target.type === "service" ||
      target.type === "product" ||
      target.price ||
      target.duration
    ) {
      preselectedService =
        estServices.find((s) => s.id === target.id) || { ...target };
    }

    if (
      target.type === "employer" ||
      target.user ||
      target.establishment_id ||
      target.establishmentId
    ) {
      preselectedEmployer =
        estEmployers.find((emp) => emp.id === target.id) || { ...target };
    }

    setWizardOptions({
      services: estServices,
      employers: estEmployers,
      preselectedService,
      preselectedEmployer,
    });

    setTimeout(() => setShowWizard(true), 50);
  };

  if (isLoading) {
    return (
      <>
        <GlobalNav />
        <div className="hp-wrapper">
          <HomeHeader city={city} uf={uf} onChangeCity={handleChangeCity} />
          <div className="hp-loading">Carregando…</div>
        </div>

        <CitySelectorModal
          user={user}
          show={showCityModal}
          onClose={() => setShowCityModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <GlobalNav />

      <div className="hp-wrapper">
        <HomeHeader city={city} uf={uf} onChangeCity={handleChangeCity} />

        <StatsQuick stats={stats} />

        <HighlightsSection highlights={stats.highlights} />

        <GlobalCarousel
          title="Estabelecimentos"
          items={mappedEstablishments}
          fmtBRL={fmtBRL}
          navigate={(path) => navigate(path)}
          openSchedulePopup={openSchedulePopup}
          showSchedule
        />

        <GlobalCarousel
          title="Profissionais"
          items={mappedEmployers}
          fmtBRL={fmtBRL}
          navigate={(path) => navigate(path)}
          openSchedulePopup={openSchedulePopup}
          showSchedule
        />

        <GlobalCarousel
          title="Serviços"
          items={mappedItems}
          fmtBRL={fmtBRL}
          navigate={(path) => navigate(path)}
          openSchedulePopup={openSchedulePopup}
          showSchedule
        />

        <div className="hp-bottom-grid">
          <TopList
            title="Top Estabelecimentos (views)"
            items={stats.top_establishments_views}
          />

          <TopList
            title="Serviços mais vendidos"
            items={stats.top_items_sold}
          />

          <div className="hp-activity">
            <h4>Atividade Global</h4>

            <CircleGauge value={stats.dau} />

            <div className="hp-activity-info">
              <div>DAU: {stats.dau}</div>
              <div>MAU: {stats.mau}</div>
              <div>DAU/MAU Ratio: {stats.dau_mau_ratio}</div>
            </div>
          </div>
        </div>
      </div>

      <CitySelectorModal
        user={user}
        show={showCityModal}
        onClose={() => setShowCityModal(false)}
      />

      <AppointmentWizardModal
        show={showWizard}
        onHide={() => setShowWizard(false)}
        employers={wizardOptions.employers}
        services={wizardOptions.services}
        loadAvailableTimes={loadAvailableTimes}
        handleCreateAppointment={handleCreateAppointment}
        imageUrl={
          selectedEstablishment?.images?.logo ||
          selectedEstablishment?.logo ||
          "/images/logo.png"
        }
        preselectedService={wizardOptions.preselectedService}
        preselectedEmployer={wizardOptions.preselectedEmployer}
      />
    </>
  );
}
