  // src/pages/establishment/EstablishmentViewPage.jsx
  import React, { useCallback, useMemo } from "react";
  import { useNavigate, useParams } from "react-router-dom";
  import Swal from "sweetalert2";

  import { apiBaseUrl, appId } from "../../config";

  import useEstablishmentView from "../../hooks/useEstablishmentView";
  import useAppointment from "../../hooks/useAppointment";
  import useImageUtils from "../../hooks/useImageUtils";
  import useSchedulePopup from "../../hooks/useSchedulePopup";
  import useWhatsappLink from "../../hooks/useWhatsappLink";

  import GlobalPageHeader from "../../components/GlobalPageHeader";
  import GlobalCarousel from "../../components/GlobalCarousel";
  import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";
  import ShareButton from "../../components/ShareButton";
  import GlobalWhatsappButton from "../../components/GlobalWhatsappButton";
  import GlobalMap from "../../components/GlobalMap";
  import GlobalProfileHero from "../../components/GlobalProfileHero";

  import "./EstablishmentView.css";

  const PLACEHOLDER = "/images/logo.png";

  export default function EstablishmentViewPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const {
      establishment,
      metrics,
      otherEstablishments,
      otherEmployers,
      otherItems,
      services,
      products,
      employers,
      isLoading,
    } = useEstablishmentView(apiBaseUrl, slug, token, navigate);

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

    const whatsappLink = useWhatsappLink(establishment);
    const whatsappMessage = useMemo(
      () =>
        `Olá! Encontrei ${
          establishment?.name || "a barbearia"
        } pelo Rasoio e gostaria de mais informações.`,
      [establishment]
    );

    const safeNavigate = useMemo(() => (path) => (window.location.href = path), []);

    const headerMeta = useMemo(() => {
      const cityUf =
        establishment?.city && establishment?.uf
          ? `${establishment.city} - ${establishment.uf}`
          : establishment?.city || establishment?.uf || "";

      const category =
        establishment?.category?.name ||
        establishment?.segment?.name ||
        establishment?.category ||
        "";

      return [cityUf, category].filter(Boolean);
    }, [establishment]);

    const heroLogo = useMemo(
      () => establishment?.images?.logo || establishment?.logo || null,
      [establishment]
    );

    const heroBg = useMemo(
      () => establishment?.images?.background || establishment?.background || null,
      [establishment]
    );

    const ratingLabel = useMemo(() => {
      const r =
        metrics?.rating ??
        establishment?.metrics?.rating ??
        metrics?.avg_rating ??
        establishment?.avg_rating ??
        establishment?.rating ??
        null;

      if (r == null) return null;
      const num = Number(r);
      if (Number.isNaN(num)) return null;
      return num.toFixed(1);
    }, [metrics, establishment]);

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
      const m = establishment?.metrics || metrics || null;
      return {
        total_views: toNumberOrNull(m?.total_views),
        total_orders: toNumberOrNull(m?.total_orders),
        completed_orders: toNumberOrNull(m?.completed_orders),
        pending_orders: toNumberOrNull(m?.pending_orders),
        engagement_score: toNumberOrNull(m?.engagement_score),
        return_rate: toNumberOrNull(m?.return_rate),
      };
    }, [establishment, metrics]);

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

    const handleOpenFromEstablishment = useCallback(
      async (est) => {
        try {
          const estId = est?.id ?? establishment?.id ?? null;

          const filteredEmployers = (Array.isArray(employers) ? employers : []).filter(
            (emp) => Number(emp?.establishment_id) === Number(estId)
          );

          await openSchedulePopup({
            establishment: est || establishment,
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
      [openSchedulePopup, employers, establishment]
    );

    const handleOpenFromEmployer = useCallback(
      (emp) => {
        try {
          openSchedulePopup({
            employer: emp,
            establishment: establishment || emp?.establishment || null,
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
      [openSchedulePopup, establishment]
    );

    const handleOpenFromService = useCallback(
      (item) => {
        try {
          const estId =
            item?.establishment_id ||
            item?.entity_id ||
            item?.entityId ||
            establishment?.id ||
            null;

          const filteredEmployers = (Array.isArray(employers) ? employers : []).filter(
            (emp) => Number(emp?.establishment_id) === Number(estId)
          );

          openSchedulePopup({
            service: item,
            filteredEmployers,
            establishment,
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
      [openSchedulePopup, employers, establishment]
    );

    if (isLoading) {
      return (
        <div className="wrapper">
          <GlobalPageHeader
            title="Estabelecimento"
            variant="establishment"
            description="Carregando perfil..."
            meta={headerMeta}
            compact
          />
          <div className="loading">Carregando…</div>
        </div>
      );
    }

    if (!establishment) {
      return (
        <div className="wrapper">
          <GlobalPageHeader
            title="Estabelecimento"
            variant="establishment"
            description="Não foi possível carregar este perfil."
            meta={headerMeta}
            compact
          />
          <div className="loading">Perfil indisponível.</div>
        </div>
      );
    }

    const chips = [
      establishment?.address ? { label: establishment.address } : null,
      establishment?.city || establishment?.uf
        ? {
            label: `${establishment?.city || ""}${
              establishment?.city && establishment?.uf ? " - " : ""
            }${establishment?.uf || ""}`,
          }
        : null,
      ratingLabel ? { label: `⭐ ${ratingLabel}`, variant: "rating" } : null,
    ].filter(Boolean);

    return (
      <>
        <div className="wrapper">
          <GlobalProfileHero
            title={establishment?.name || "Estabelecimento"}
            logoSrc={heroLogo}
            bgSrc={heroBg}
            imageUrl={imageUrl}
            placeholder={PLACEHOLDER}
            chips={chips}
            stats={heroStats}
            primaryAction={{
              label: "Agendar agora",
              onClick: () => handleOpenFromEstablishment(establishment),
            }}
            secondaryAction={{
              label: "WhatsApp",
              href: whatsappLink || undefined,
              disabled: !whatsappLink,
              title: !whatsappLink ? "Telefone não informado" : undefined,
            }}
          />

          {Array.isArray(establishment?.images?.gallery) &&
            establishment.images.gallery.length > 0 && (
              <section className="gallery">
                <div className="galleryHeader">
                  <h2 className="sectionTitle">Galeria</h2>
                  <p className="sectionSub">Alguns registros do estabelecimento</p>
                </div>

                <div className="galleryGrid">
                  {establishment.images.gallery.slice(0, 12).map((src, idx) => (
                    <button
                      key={`${src}-${idx}`}
                      className="galleryItem"
                      type="button"
                      onClick={() => {
                        Swal.fire({
                          imageUrl: imageUrl(src),
                          imageAlt: "Imagem da galeria",
                          showConfirmButton: false,
                          showCloseButton: true,
                          background: "#0b1220",
                        });
                      }}
                    >
                      <img
                        src={imageUrl(src)}
                        alt={`Galeria ${idx + 1}`}
                        draggable={false}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}

          <div className="sections">
            <GlobalCarousel
              title="Profissionais"
              subtitle="Escolha com quem você quer agendar"
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
              items={services}
              fmtBRL={(v) => v}
              navigate={safeNavigate}
              openSchedulePopup={handleOpenFromService}
              showSchedule
              showDots
            />

            <GlobalCarousel
              title="Produtos"
              subtitle="Produtos disponíveis neste estabelecimento"
              items={products}
              fmtBRL={(v) => v}
              navigate={safeNavigate}
              showSchedule={false}
              showDots
            />

            <GlobalMap
              location={establishment?.location}
              address={establishment?.address}
              city={establishment?.city}
              uf={establishment?.uf}
            />

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

            {Array.isArray(otherEmployers) && otherEmployers.length > 0 && (
              <GlobalCarousel
                title="Outros profissionais"
                subtitle="Veja outros profissionais disponíveis"
                items={otherEmployers}
                fmtBRL={(v) => v}
                navigate={navigate}
                openSchedulePopup={handleOpenFromEmployer}
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
        <GlobalWhatsappButton link={whatsappLink} message={whatsappMessage} />

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
