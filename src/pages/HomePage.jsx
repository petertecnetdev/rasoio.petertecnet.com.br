// src/pages/HomePage.jsx
import React, { useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { apiBaseUrl, appId } from "../config";

import useHomePage from "../hooks/useHomePage";
import useAppointment from "../hooks/useAppointment";
import useImageUtils from "../hooks/useImageUtils";

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
    isLoading,
    city,
    uf,
    fmtBRL,
  } = useHomePage(apiBaseUrl, appId);

  const navigate = useNavigate();

  const token = useMemo(() => localStorage.getItem("token"), []);

  const [showCityModal, setShowCityModal] = useState(false);
  const [user] = useState(() => {
    const cached = localStorage.getItem("user");
    return cached ? JSON.parse(cached) : {};
  });

  const [showWizard, setShowWizard] = useState(false);
  const [wizardOptions, setWizardOptions] = useState({});
  const [wizardEstablishment, setWizardEstablishment] = useState(null);
  const [wizardEmployers, setWizardEmployers] = useState([]);
  const [wizardServices, setWizardServices] = useState([]);

  const { imageUrl } = useImageUtils(PLACEHOLDER);

  const { loadAvailableTimes, handleCreateAppointment } = useAppointment(
    apiBaseUrl,
    appId,
    token,
    wizardEstablishment
  );

  const handleChangeCity = () => {
    setShowCityModal(true);
  };

  const resolveEstablishmentSlugFromTarget = (target) => {
    if (!target) return null;

    if (target.type === "establishment" && target.slug) {
      return target.slug;
    }

    if (target.establishment && target.establishment.slug) {
      return target.establishment.slug;
    }

    return null;
  };

  const mapEstablishmentFromPayload = (est) => {
    if (!est) return null;

    return {
      ...est,
      images: {
        logo: est.images?.logo ?? est.logo ?? null,
        background: est.images?.background ?? est.background ?? null,
        gallery: est.images?.gallery ?? [],
        files: est.images?.files ?? [],
      },
    };
  };

  const mapItemsFromPayload = (rawItems) => {
    return (rawItems || []).map((it) => {
      const img = it.images || {};
      return {
        ...it,
        type: it.type || "item",
        slug: it.slug,
        images: {
          avatar: img.avatar ?? it.image ?? null,
          gallery: img.gallery ?? [],
          files: img.files ?? [],
        },
      };
    });
  };

  const mapEmployersFromPayload = (rawEmployers) => {
    return (rawEmployers || []).map((e) => {
      const img = e.images || {};
      const avatar =
        img.avatar ||
        e.avatar ||
        e.image ||
        e.user?.avatar ||
        PLACEHOLDER;

      return {
        ...e,
        type: "employer",
        image: avatar,
        images: {
          avatar,
          gallery: img.gallery || [],
          files: img.files || [],
        },
        user: e.user || {
          first_name: e.name || "",
          avatar,
        },
      };
    });
  };

  const openSchedulePopup = async (target = {}) => {
    if (!target) return;

    const estSlug = resolveEstablishmentSlugFromTarget(target);
    if (!estSlug) return;

    try {
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {};

      const res = await axios.get(
        `${apiBaseUrl}/establishment/view/${estSlug}`,
        { headers }
      );

      const data = res.data || {};

      const est = mapEstablishmentFromPayload(data.establishment || null);
      const mappedItems = mapItemsFromPayload(data.items || []);
      const mappedEmployers = mapEmployersFromPayload(data.employers || []);

      const servicesList = mappedItems.filter(
        (i) => (i.type || "").toLowerCase() !== "product"
      );
      const productsList = mappedItems.filter(
        (i) => (i.type || "").toLowerCase() === "product"
      );

      const hasServices = servicesList.length > 0;
      const hasProducts = productsList.length > 0;

      const genericItems =
        !hasServices && !hasProducts && mappedItems.length
          ? mappedItems.map((i) => ({
              ...i,
              type: i.type === "product" ? "product" : "service",
            }))
          : [];

      const servicesForWizard = hasServices ? servicesList : genericItems;

      let preselectedService = null;
      let preselectedEmployer = null;

      if (target.type === "employer") {
        preselectedEmployer =
          mappedEmployers.find(
            (e) => e.id === target.id || e.slug === target.slug
          ) || null;
      }

      if (
        target.type !== "establishment" &&
        (!target.type || target.type !== "employer")
      ) {
        preselectedService =
          servicesForWizard.find(
            (s) => s.id === target.id || s.slug === target.slug
          ) || null;
      }

      setWizardEstablishment(est);
      setWizardEmployers(mappedEmployers);
      setWizardServices(servicesForWizard);
      setWizardOptions({
        preselectedService,
        preselectedEmployer,
      });

      setShowWizard(true);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Erro ao carregar dados do estabelecimento.";

      Swal.fire({
        icon: "error",
        title: "Erro",
        text: msg,
      });
    }
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
          items={establishments}
          fmtBRL={fmtBRL}
          navigate={(path) => (window.location.href = path)}
          openSchedulePopup={openSchedulePopup}
          showSchedule
        />

        <GlobalCarousel
          title="Profissionais"
          items={employers}
          carouselActive
          fmtBRL={fmtBRL}
          apiBaseUrl={apiBaseUrl}
          openSchedulePopup={openSchedulePopup}
          navigate={navigate}
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
        preselectedService={wizardOptions.preselectedService || null}
        preselectedEmployer={wizardOptions.preselectedEmployer || null}
        establishment={wizardEstablishment}
      />

      <CitySelectorModal
        user={user}
        show={showCityModal}
        onClose={() => setShowCityModal(false)}
      />
    </>
  );
}
