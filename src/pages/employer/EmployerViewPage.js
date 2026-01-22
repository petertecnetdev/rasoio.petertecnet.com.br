// src/pages/employer/EmployerViewPage.jsx
import React, { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import { apiBaseUrl, appId } from "../../config";

import useEmployerView from "../../hooks/useEmployerView";
import useAppointment from "../../hooks/useAppointment";
import useImageUtils from "../../hooks/useImageUtils";
import useSchedulePopup from "../../hooks/useSchedulePopup";
import useWhatsappLink from "../../hooks/useWhatsappLink";

import GlobalPageHeader from "../../components/GlobalPageHeader";
import GlobalCarousel from "../../components/GlobalCarousel";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";
import ShareButton from "../../components/ShareButton";
import GlobalMap from "../../components/GlobalMap";
import GlobalProfileHero from "../../components/GlobalProfileHero";

import "./EmployerView.css";

const PLACEHOLDER = "/images/user.png";

export default function EmployerViewPage() {
  const { user_name } = useParams(); // ✅ rota: /employer/view/:user_name
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ✅ sempre iniciar no topo ao abrir/trocar profissional
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [user_name]);

  const {
    employer,
    establishment,
    metrics,
    otherEmployers,
    otherEstablishments,
    otherItems,
    services,
    products,
    isLoading,
  } = useEmployerView(apiBaseUrl, user_name, token, navigate);

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

  const whatsappLink = useWhatsappLink(employer?.user || employer || establishment || null);

  const safeNavigate = useMemo(() => (path) => (window.location.href = path), []);

  const headerMeta = useMemo(() => {
    const cityUf =
      establishment?.city && establishment?.uf
        ? `${establishment.city} - ${establishment.uf}`
        : establishment?.city || establishment?.uf || "";

    const role = employer?.role || employer?.profession || employer?.user?.occupation || "";
    const estName = establishment?.name || "";

    return [cityUf, role, estName].filter(Boolean);
  }, [employer, establishment]);

  const ratingLabel = useMemo(() => {
    const r =
      metrics?.rating ??
      employer?.metrics?.rating ??
      employer?.avg_rating ??
      employer?.rating ??
      null;

    if (r == null) return null;
    const num = Number(r);
    if (Number.isNaN(num)) return null;
    return num.toFixed(1);
  }, [metrics, employer]);

  const toNumberOrNull = (v) => {
    if (v == null) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const fmtPercent = useCallback((v) => {
    const n = toNumberOrNull(v);
    if (n == null) return "—";
    return `${n.toFixed(0)}%`;
  }, []);

  const heroMetrics = useMemo(() => {
    const m = employer?.metrics || metrics || null;
    return {
      total_views: toNumberOrNull(m?.total_views),
      total_orders: toNumberOrNull(m?.total_orders),
      completed_orders: toNumberOrNull(m?.completed_orders),
      pending_orders: toNumberOrNull(m?.pending_orders),
      engagement_score: toNumberOrNull(m?.engagement_score),
      return_rate: toNumberOrNull(m?.return_rate),
    };
  }, [employer, metrics]);

  const heroStats = useMemo(() => {
    const m = heroMetrics;

    const base = [
      { label: "Visualizações", value: m.total_views ?? "—" },
      { label: "Pedidos", value: m.total_orders ?? "—" },
    ];

    if (m.completed_orders != null) base.push({ label: "Concluídos", value: m.completed_orders });
    if (m.pending_orders != null) base.push({ label: "Pendentes", value: m.pending_orders });
    if (m.return_rate != null) base.push({ label: "Retorno", value: fmtPercent(m.return_rate) });
    if (m.engagement_score != null) base.push({ label: "Engajamento", value: m.engagement_score });

    return base.slice(0, 8);
  }, [heroMetrics, fmtPercent]);

  // ✅ avatar correto: prioridade em employer.files -> user.files -> campos
  const heroLogo = useMemo(() => {
    const eFiles = Array.isArray(employer?.files) ? employer.files : [];
    const uFiles = Array.isArray(employer?.user?.files) ? employer.user.files : [];

    const fromEmployerFiles =
      eFiles.find((f) => f?.type === "avatar")?.public_url ??
      eFiles.find((f) => f?.type === "profile")?.public_url ??
      null;

    const fromUserFiles =
      uFiles.find((f) => f?.type === "avatar")?.public_url ??
      uFiles.find((f) => f?.type === "profile")?.public_url ??
      null;

    const candidates = [
      fromEmployerFiles,
      fromUserFiles,
      employer?.avatar,
      employer?.images?.avatar,
      employer?.images?.profile,
      employer?.user?.avatar,
      employer?.user?.images?.avatar,
      employer?.user?.images?.profile,
      employer?.user?.images?.photo,
    ].filter(Boolean);

    return candidates[0] || null;
  }, [employer]);

  const heroBg = useMemo(
    () => establishment?.images?.background || establishment?.background || null,
    [establishment]
  );

  const chips = useMemo(() => {
    const fullName =
      `${employer?.user?.first_name || ""} ${employer?.user?.last_name || ""}`.trim() || null;

    return [
      employer?.role ? { label: employer.role } : null,
      fullName ? { label: fullName } : null,
      establishment?.city || establishment?.uf
        ? {
            label: `${establishment?.city || ""}${
              establishment?.city && establishment?.uf ? " - " : ""
            }${establishment?.uf || ""}`,
          }
        : null,
      ratingLabel ? { label: `⭐ ${ratingLabel}`, variant: "rating" } : null,
    ].filter(Boolean);
  }, [employer, establishment, ratingLabel]);

  const handleOpenFromEmployer = useCallback(async () => {
    try {
      const est = establishment || employer?.establishment || null;

      await openSchedulePopup({
        establishment: est,
        employer,
        filteredEmployers: employer ? [employer] : [],
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível abrir o agendamento agora.",
      });
    }
  }, [openSchedulePopup, employer, establishment]);

  const handleOpenFromService = useCallback(
    (item) => {
      try {
        const est = establishment || employer?.establishment || null;

        openSchedulePopup({
          service: item,
          filteredEmployers: employer ? [employer] : [],
          establishment: est,
          employer,
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
    [openSchedulePopup, employer, establishment]
  );

  const handleOpenFromEstablishment = useCallback(
    async (est) => {
      try {
        await openSchedulePopup({
          establishment: est,
          filteredEmployers: [],
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
    [openSchedulePopup]
  );

  // ✅ mini profile do establishment (sem GlobalCard)
  const asideEstablishment = useMemo(() => {
    if (!establishment) return null;

    const title = establishment?.name || establishment?.fantasy || "Estabelecimento";

    const subtitle =
      establishment?.city || establishment?.uf
        ? `${establishment?.city || ""}${
            establishment?.city && establishment?.uf ? " - " : ""
          }${establishment?.uf || ""}`
        : "";

    const image = establishment?.images?.logo || establishment?.logo || null;


    const canGoDetails = !!establishment?.slug;

    return {
      title,
      subtitle,
      image,
      clickable: canGoDetails,
      onClick: () => {
        if (canGoDetails) navigate(`/establishment/view/${establishment.slug}`);
      },
    };
  }, [establishment, navigate, handleOpenFromEstablishment]);

  if (isLoading) {
    return (
      <div className="wrapper">
        <GlobalPageHeader
          title="Profissional"
          variant="employer"
          description="Carregando perfil..."
          meta={headerMeta}
          compact
        />
        <div className="loading">Carregando…</div>
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="wrapper">
        <GlobalPageHeader
          title="Profissional"
          variant="employer"
          description="Não foi possível carregar este perfil."
          meta={headerMeta}
          compact
        />
        <div className="loading">Perfil indisponível.</div>
      </div>
    );
  }

  return (
    <>
      <div className="wrapper">
        <GlobalProfileHero
          title={employer?.name || employer?.user?.user_name || "Profissional"}
          logoSrc={heroLogo}
          bgSrc={heroBg}
          imageUrl={imageUrl}
          placeholder={PLACEHOLDER}
          chips={chips}
          stats={heroStats}
          primaryAction={{
            label: "Agendar agora",
            onClick: handleOpenFromEmployer,
          }}
          secondaryAction={{
            label: "WhatsApp",
            href: whatsappLink || undefined,
            disabled: !whatsappLink,
            title: !whatsappLink ? "Telefone não informado" : undefined,
          }}
          aside={asideEstablishment}
        />

        <div className="sections">
          <GlobalCarousel
            title="Serviços"
            subtitle="Escolha um serviço e finalize em poucos cliques"
            items={Array.isArray(services) ? services : []}
            fmtBRL={(v) => v}
            navigate={safeNavigate}
            openSchedulePopup={handleOpenFromService}
            showSchedule
            showDots
          />

          <GlobalCarousel
            title="Produtos"
            subtitle="Produtos disponíveis neste estabelecimento"
            items={Array.isArray(products) ? products : []}
            fmtBRL={(v) => v}
            navigate={safeNavigate}
            showSchedule={false}
            showDots
          />

          {establishment && (
            <GlobalMap
              location={establishment?.location}
              address={establishment?.address}
              city={establishment?.city}
              uf={establishment?.uf}
            />
          )}

          {Array.isArray(otherEmployers) && otherEmployers.length > 0 && (
            <GlobalCarousel
              title="Outros profissionais"
              subtitle="Veja outros profissionais disponíveis"
              items={otherEmployers}
              fmtBRL={(v) => v}
              navigate={navigate}
              openSchedulePopup={(emp) =>
                navigate(
                  `/employer/view/${encodeURIComponent(
                    emp?.user_name || emp?.user?.user_name || emp?.id
                  )}`
                )
              }
              showSchedule={false}
              showDots
            />
          )}

          {Array.isArray(otherEstablishments) && otherEstablishments.length > 0 && (
            <GlobalCarousel
              title="Outros estabelecimentos"
              subtitle="Descubra opções próximas"
              items={otherEstablishments}
              fmtBRL={(v) => v}
              navigate={safeNavigate}
              openSchedulePopup={handleOpenFromEstablishment}
              showSchedule
              showDots
            />
          )}

          {Array.isArray(otherItems) && otherItems.length > 0 && (
            <GlobalCarousel
              title="Outros serviços"
              subtitle="Mais serviços para você"
              items={otherItems}
              fmtBRL={(v) => v}
              navigate={safeNavigate}
              openSchedulePopup={handleOpenFromService}
              showSchedule
              showDots
            />
          )}
        </div>
      </div>

      <ShareButton />

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
