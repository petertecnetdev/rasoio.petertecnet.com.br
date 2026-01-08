import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiBaseUrl, appId } from "../config";

import useHome from "../hooks/useHome";
import useAppointment from "../hooks/useAppointment";
import useImageUtils from "../hooks/useImageUtils";
import useSchedulePopup from "../hooks/useSchedulePopup";

import "./HomePage.css";

import GlobalCarousel from "../components/GlobalCarousel";
import GlobalNav from "../components/GlobalNav";
import CitySelectorModal from "../components/CitySelectorModal";
import HomeHeader from "../components/home/HomeHeader";
import AppointmentWizardModal from "../components/appointment/AppointmentWizardModal";

const PLACEHOLDER = "/images/logo.png";

export default function HomePage() {
  const {
    establishments,
    employers,
    serviceItems,
    productItems,
    stats,
    highlights,
    homePayload,
    recentOrders,
    recentInteractions,
    isLoading,
    error,
  } = useHome(apiBaseUrl, appId);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [showCityModal, setShowCityModal] = useState(false);
  const [currentCity, setCurrentCity] = useState(
    localStorage.getItem("selectedCity")
  );
  const [currentUF, setCurrentUF] = useState(
    localStorage.getItem("selectedUF")
  );

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

  const handleChangeCity = () => setShowCityModal(true);

  const handleSelectCity = ({ city, uf }) => {
    localStorage.setItem("selectedCity", city);
    localStorage.setItem("selectedUF", uf);
    setCurrentCity(city);
    setCurrentUF(uf);
    setShowCityModal(false);
  };

  if (isLoading) {
    return (
      <>
        <GlobalNav />
        <div className="hp-wrapper">
          <HomeHeader
            city={currentCity}
            uf={currentUF}
            onChangeCity={handleChangeCity}
          />
          <div className="hp-loading">Carregando…</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <GlobalNav />
        <div className="hp-wrapper">
          <div className="hp-loading">{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalNav />

      <div className="hp-wrapper">
        <HomeHeader
          city={currentCity}
          uf={currentUF}
          onChangeCity={handleChangeCity}
        />

        <GlobalCarousel
          title="Estabelecimentos"
          items={establishments}
          navigate={(path) => (window.location.href = path)}
          openSchedulePopup={async (item) => {
            const filteredEmployers = employers.filter(
              (emp) => emp.establishment_id === item.id
            );

            await openSchedulePopup({
              establishment: item,
              filteredEmployers,
            });
          }}
          showSchedule
        />

        <GlobalCarousel
          title="Profissionais"
          items={employers}
          navigate={navigate}
          openSchedulePopup={(item) =>
            openSchedulePopup({ employer: item })
          }
          showSchedule
        />

        <GlobalCarousel
          title="Serviços"
          items={serviceItems}
          navigate={(path) => (window.location.href = path)}
          openSchedulePopup={(item) =>
            openSchedulePopup({ service: item })
          }
          showSchedule
        />

        <GlobalCarousel
          title="Produtos"
          items={productItems}
          navigate={(path) => (window.location.href = path)}
          showSchedule={false}
        />

        <div className="hp-bottom-grid">
          {/* outros elementos do grid */}
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

      <CitySelectorModal
        user={JSON.parse(localStorage.getItem("user") || "{}")}
        show={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSelectCity={handleSelectCity}
      />
    </>
  );
}
