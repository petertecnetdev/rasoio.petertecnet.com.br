// src/pages/HomePage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiBaseUrl, appId } from "../config";

import useHome from "../hooks/useHome";
import useAppointment from "../hooks/useAppointment";
import useImageUtils from "../hooks/useImageUtils";
import useSchedulePopup from "../hooks/useSchedulePopup";

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

const PLACEHOLDER = "/images/logo.png";

export default function HomePage() {
  const {
    establishments,
    employers,
    items,
    stats,
    highlights,
    isLoading,
    city,
    uf,
    fmtBRL,
  } = useHome(apiBaseUrl, appId);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [showCityModal, setShowCityModal] = useState(false);
  const [currentCity, setCurrentCity] = useState(city);
  const [currentUF, setCurrentUF] = useState(uf);

  const { imageUrl } = useImageUtils(PLACEHOLDER);

  const {
    showWizard,
    setShowWizard,
    wizardEstablishment,
    wizardEmployers,
    wizardServices,
    preselectedEmployer,
    preselectedService,
    openSchedulePopup,
  } = useSchedulePopup(apiBaseUrl, token, PLACEHOLDER);

  const { loadAvailableTimes, handleCreateAppointment } = useAppointment(
    apiBaseUrl,
    appId,
    token,
    wizardEstablishment
  );

  const handleChangeCity = () => setShowCityModal(true);

  const handleSelectCity = ({ city, uf }) => {
    setCurrentCity(city);
    setCurrentUF(uf);
    setShowCityModal(false);
  };

  if (isLoading) {
    return (
      <>
        <GlobalNav />
        <div className="hp-wrapper">
          <HomeHeader city={currentCity} uf={currentUF} onChangeCity={handleChangeCity} />
          <div className="hp-loading">Carregando…</div>
        </div>
        <CitySelectorModal
          user={JSON.parse(localStorage.getItem("user") || "{}")}
          show={showCityModal}
          onClose={() => setShowCityModal(false)}
          onSelectCity={handleSelectCity}
        />
      </>
    );
  }

  return (
    <>
      <GlobalNav />

      <div className="hp-wrapper">
        <HomeHeader city={currentCity} uf={currentUF} onChangeCity={handleChangeCity} />
        <StatsQuick stats={stats} />
        <HighlightsSection highlights={highlights} />

   <GlobalCarousel
  title="Estabelecimentos"
  items={establishments}
  fmtBRL={fmtBRL}
  navigate={(path) => (window.location.href = path)}
  openSchedulePopup={async (item) => {
    // Filtra os employers deste estabelecimento
    const filteredEmployers = employers.filter(
      (emp) => emp.establishment_id === item.id
    );

    await openSchedulePopup({
      establishment: item,
      employer: null, // sem preselected
      service: null,
      filteredEmployers, // novo parâmetro
    });
  }}
  showSchedule
/>
 

<GlobalCarousel
  title="Profissionais"
  items={employers}
  fmtBRL={fmtBRL}
  navigate={navigate}
  openSchedulePopup={(item) =>
    openSchedulePopup({ employer: item })
  }
  showSchedule
/>


        <GlobalCarousel
          title="Serviços"
          items={items}
          fmtBRL={fmtBRL}
          navigate={(path) => (window.location.href = path)}
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

      <AppointmentWizardModal
        show={showWizard}
        onHide={() => setShowWizard(false)}
        employers={wizardEmployers}
        services={wizardServices}
        loadAvailableTimes={loadAvailableTimes}
        handleCreateAppointment={handleCreateAppointment}
        imageUrl={imageUrl}
        preselectedService={preselectedService}
        preselectedEmployer={preselectedEmployer}
        establishment={wizardEstablishment}
      />

      <CitySelectorModal
        user={JSON.parse(localStorage.getItem("user") || "{}")}
        show={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSelectCity={handleSelectCity}
      />
    </>
  );
}
