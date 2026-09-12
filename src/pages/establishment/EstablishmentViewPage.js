import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { FaCalendarAlt, FaMapMarkerAlt, FaWhatsapp, FaStar, FaStore, FaUsers } from "react-icons/fa";

import { apiBaseUrl, appId } from "../../config";
import useEstablishmentView from "../../hooks/useEstablishmentView";
import useAppointment from "../../hooks/useAppointment";
import useImageUtils from "../../hooks/useImageUtils";
import usePublicEntitySeo from "../../hooks/usePublicEntitySeo";
import useSchedulePopup from "../../hooks/useSchedulePopup";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import { isSchedulableEstablishment } from "../../utils/schedulingCapabilities";

import GlobalCarousel from "../../components/GlobalCarousel";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";
import ShareButton from "../../components/ShareButton";
import GlobalMap from "../../components/GlobalMap";
import "./EstablishmentView.css";

const PLACEHOLDER = "/images/logo.png";

export default function EstablishmentViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const resumeAppointmentHandledRef = useRef(false);
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
  const safeNavigate = useMemo(() => (path) => (window.location.href = path), []);
  const canSchedule = isSchedulableEstablishment({ establishment, employers, services });
  const growthUrl = `/planos?source=powered-by-rasoio${slug ? `&ref=${encodeURIComponent(slug)}` : ""}&utm_source=public_agenda&utm_medium=product_badge&utm_campaign=powered_by_rasoio`;

  const heroLogo = establishment?.images?.logo || establishment?.logo || null;
  const heroBg = establishment?.images?.background || establishment?.background || null;
  const gallery = Array.isArray(establishment?.images?.gallery) ? establishment.images.gallery : [];
  const description =
    establishment?.description ||
    establishment?.about ||
    establishment?.bio ||
    "Atendimento profissional em um espaço preparado para receber você.";
  const cityLabel = [establishment?.city, establishment?.uf].filter(Boolean).join(" - ");
  const rating =
    metrics?.rating ??
    establishment?.metrics?.rating ??
    metrics?.avg_rating ??
    establishment?.avg_rating ??
    establishment?.rating;
  const ratingLabel = rating != null && !Number.isNaN(Number(rating)) ? Number(rating).toFixed(1) : null;

  usePublicEntitySeo({
    title: establishment?.name,
    description,
    canonicalPath: slug ? `/establishment/view/${encodeURIComponent(slug)}` : null,
    image: heroLogo || heroBg || undefined,
  });

  const requireSchedulingAuth = useCallback(() => {
    if (localStorage.getItem("token")) return true;

    const returnPath = `${location.pathname}${location.search || ""}${location.hash || ""}`;
    navigate("/login", {
      state: {
        from: returnPath,
        resumeAppointment: true,
      },
    });
    return false;
  }, [location.hash, location.pathname, location.search, navigate]);

  const handleOpenFromEstablishment = useCallback(
    async (est) => {
      if (!requireSchedulingAuth()) return;

      try {
        const estId = est?.id ?? establishment?.id ?? null;
        const filteredEmployers = (Array.isArray(employers) ? employers : []).filter(
          (emp) => Number(emp?.establishment_id) === Number(estId)
        );
        if (!filteredEmployers.length || !canSchedule) return;
        await openSchedulePopup({ establishment: est || establishment, filteredEmployers });
      } catch (error) {
        console.error(error);
        Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível abrir o agendamento agora." });
      }
    },
    [requireSchedulingAuth, openSchedulePopup, employers, establishment, canSchedule]
  );

  const handleOpenFromEmployer = useCallback(
    (employer) => {
      if (!canSchedule || !requireSchedulingAuth()) return;
      try {
        openSchedulePopup({ employer, establishment: establishment || employer?.establishment || null });
      } catch (error) {
        console.error(error);
        Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível abrir o agendamento agora." });
      }
    },
    [requireSchedulingAuth, openSchedulePopup, establishment, canSchedule]
  );

  const handleOpenFromService = useCallback(
    (item) => {
      if (!canSchedule || !requireSchedulingAuth()) return;
      try {
        const estId = item?.establishment_id || item?.entity_id || item?.entityId || establishment?.id || null;
        const filteredEmployers = (Array.isArray(employers) ? employers : []).filter(
          (employer) => Number(employer?.establishment_id) === Number(estId)
        );
        if (!filteredEmployers.length) return;
        openSchedulePopup({ service: item, filteredEmployers, establishment });
      } catch (error) {
        console.error(error);
        Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível abrir o agendamento agora." });
      }
    },
    [requireSchedulingAuth, openSchedulePopup, employers, establishment, canSchedule]
  );

  useEffect(() => {
    if (
      resumeAppointmentHandledRef.current ||
      !location.state?.resumeAppointment ||
      !localStorage.getItem("token") ||
      isLoading ||
      !establishment ||
      !canSchedule
    ) {
      return;
    }

    const filteredEmployers = (Array.isArray(employers) ? employers : []).filter(
      (employer) => Number(employer?.establishment_id) === Number(establishment.id)
    );
    if (!filteredEmployers.length) return;

    resumeAppointmentHandledRef.current = true;
    navigate(`${location.pathname}${location.search || ""}${location.hash || ""}`, {
      replace: true,
      state: null,
    });

    Promise.resolve(
      openSchedulePopup({ establishment, filteredEmployers })
    ).catch((error) => {
      console.error(error);
      Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível retomar o agendamento agora." });
    });
  }, [
    location.hash,
    location.pathname,
    location.search,
    location.state,
    navigate,
    openSchedulePopup,
    employers,
    establishment,
    canSchedule,
    isLoading,
  ]);

  if (isLoading) return <div className="ev-state">Carregando estabelecimento…</div>;
  if (!establishment) return <div className="ev-state">Este estabelecimento não está disponível.</div>;

  return (
    <>
      <main className="ev-page">
        <section
          className="ev-hero"
          style={
            heroBg
              ? {
                  backgroundImage: `linear-gradient(90deg, rgba(3,9,18,.96) 0%, rgba(3,9,18,.78) 46%, rgba(3,9,18,.30) 100%), url(${imageUrl(heroBg)})`,
                }
              : undefined
          }
        >
          <div className="ev-heroGlow" />
          <div className="ev-shell ev-heroInner">
            <div className="ev-identity">
              <div className="ev-logo">
                <img src={imageUrl(heroLogo || PLACEHOLDER)} alt={establishment.name} />
              </div>
              <div className="ev-eyebrow"><FaStore /> ESTABELECIMENTO</div>
              <h1>{establishment.name}</h1>
              <p>{description}</p>
              <div className="ev-meta">
                {cityLabel && <span><FaMapMarkerAlt /> {cityLabel}</span>}
                {ratingLabel && <span className="ev-rating"><FaStar /> {ratingLabel}</span>}
                <span><FaUsers /> {employers?.length || 0} profissionais</span>
              </div>
              <div className="ev-actions">
                {canSchedule && (
                  <button type="button" className="ev-primary" onClick={() => handleOpenFromEstablishment(establishment)}>
                    <FaCalendarAlt /> Agendar horário
                  </button>
                )}
                {whatsappLink && <a className="ev-secondary" href={whatsappLink} target="_blank" rel="noreferrer"><FaWhatsapp /> WhatsApp</a>}
              </div>
            </div>
          </div>
        </section>

        <div className="ev-shell">
          <section className="ev-quickbar">
            <div><strong>{services?.length || 0}</strong><span>serviços disponíveis</span></div>
            <div><strong>{employers?.length || 0}</strong><span>profissionais na equipe</span></div>
            <div><strong>{ratingLabel || "—"}</strong><span>avaliação do estabelecimento</span></div>
            {canSchedule && <button type="button" onClick={() => handleOpenFromEstablishment(establishment)}>Escolher meu horário <span>→</span></button>}
          </section>

          <section className="ev-intro">
            <div><span className="ev-kicker">SUA EXPERIÊNCIA</span><h2>Encontre o atendimento ideal.</h2><p>{description}</p></div>
            <div className="ev-introCard"><FaCalendarAlt /><div><strong>{canSchedule ? "Agendamento simples" : "Agendamento indisponível"}</strong><span>{canSchedule ? "Escolha o serviço, o profissional e o melhor horário para você." : "Este estabelecimento ainda não possui os recursos necessários para agendamento online."}</span></div></div>
          </section>

          <div className="ev-sections">
            {Array.isArray(services) && services.length > 0 && (
              <section className="ev-block ev-services">
                <div className="ev-sectionHeading"><div><span>O QUE FAZEMOS</span><h2>Serviços do estabelecimento</h2></div>{canSchedule && <button type="button" onClick={() => handleOpenFromEstablishment(establishment)}>Agendar agora</button>}</div>
                <GlobalCarousel title="" subtitle="Escolha seu serviço" items={services.map((service) => ({ ...service, can_schedule: canSchedule }))} fmtBRL={(value) => value} navigate={safeNavigate} openSchedulePopup={handleOpenFromService} showSchedule={canSchedule} showDots />
              </section>
            )}

            {Array.isArray(employers) && employers.length > 0 && (
              <section className="ev-block">
                <div className="ev-sectionHeading"><div><span>NOSSA EQUIPE</span><h2>Profissionais disponíveis</h2></div></div>
                <GlobalCarousel title="" subtitle="Conheça a equipe" items={employers.map((employer) => ({ ...employer, can_schedule: canSchedule }))} fmtBRL={(value) => value} navigate={navigate} openSchedulePopup={handleOpenFromEmployer} showSchedule={canSchedule} showDots />
              </section>
            )}

            {gallery.length > 0 && (
              <section className="ev-block ev-gallery">
                <div className="ev-sectionHeading"><div><span>AMBIENTE</span><h2>Conheça o espaço</h2></div></div>
                <div className="ev-galleryGrid">{gallery.slice(0, 8).map((src, index) => <button key={`${src}-${index}`} type="button" className={`ev-galleryItem ev-galleryItem-${index + 1}`} onClick={() => Swal.fire({ imageUrl: imageUrl(src), imageAlt: `Ambiente de ${establishment.name}`, showConfirmButton: false, showCloseButton: true, background: "#07111f" })}><img src={imageUrl(src)} alt={`Ambiente ${index + 1} de ${establishment.name}`} loading="lazy" /></button>)}</div>
              </section>
            )}

            {Array.isArray(products) && products.length > 0 && (
              <section className="ev-block">
                <div className="ev-sectionHeading"><div><span>PRODUTOS</span><h2>Produtos disponíveis</h2></div></div>
                <GlobalCarousel title="" subtitle="Produtos disponíveis neste estabelecimento" items={products} fmtBRL={(value) => value} navigate={safeNavigate} showSchedule={false} showDots />
              </section>
            )}

            <section className="ev-block ev-location"><div className="ev-sectionHeading"><div><span>ONDE ESTAMOS</span><h2>Venha nos visitar</h2>{establishment?.address && <p>{establishment.address}{cityLabel ? ` · ${cityLabel}` : ""}</p>}</div></div><GlobalMap location={establishment?.location} address={establishment?.address} city={establishment?.city} uf={establishment?.uf} /></section>

            <section className="ev-finalCta"><div><span>{canSchedule ? "AGENDE ONLINE" : "AGENDA INDISPONÍVEL"}</span><h2>{canSchedule ? "Reserve seu horário em poucos cliques." : "Este estabelecimento ainda não possui agenda online disponível."}</h2>{canSchedule && <p>Escolha seus serviços, seu profissional e encontre os horários disponíveis.</p>}</div>{canSchedule && <button type="button" onClick={() => handleOpenFromEstablishment(establishment)}><FaCalendarAlt /> Agendar agora</button>}</section>

            <section className="ev-block text-center" aria-label="Rasoio para estabelecimentos">
              <div className="mx-auto" style={{ maxWidth: 720 }}>
                <span className="ev-kicker justify-content-center">POWERED BY RASOIO</span>
                <h2 className="mt-2">Quer oferecer uma agenda online como esta no seu negócio?</h2>
                <p className="text-body-secondary mb-4">
                  Organize serviços, profissionais e horários em um só lugar e permita que seus clientes agendem online.
                </p>
                <a className="btn btn-outline-light btn-lg" href={growthUrl}>
                  Conhecer a Rasoio
                </a>
              </div>
            </section>

            {Array.isArray(otherEstablishments) && otherEstablishments.length > 0 && <section className="ev-block ev-related"><GlobalCarousel title="Outros estabelecimentos" subtitle="Conheça outras opções" items={otherEstablishments} fmtBRL={(value) => value} navigate={safeNavigate} showSchedule={false} showDots /></section>}
            {Array.isArray(otherEmployers) && otherEmployers.length > 0 && <section className="ev-related"><GlobalCarousel title="Outros profissionais" subtitle="Mais profissionais para conhecer" items={otherEmployers} fmtBRL={(value) => value} navigate={navigate} openSchedulePopup={handleOpenFromEmployer} showSchedule={canSchedule} showDots /></section>}
            {Array.isArray(otherItems) && otherItems.length > 0 && <section className="ev-related"><GlobalCarousel title="Outros serviços" subtitle="Veja mais opções" items={otherItems} fmtBRL={(value) => value} navigate={safeNavigate} showSchedule={false} showDots /></section>}
          </div>
        </div>
      </main>

      {canSchedule && <div className="ev-mobileBooking"><button type="button" onClick={() => handleOpenFromEstablishment(establishment)}><FaCalendarAlt /> Agendar horário</button></div>}
      <ShareButton />
      <AppointmentWizardModal show={showWizard} onHide={() => setShowWizard(false)} employers={wizardEmployers} services={wizardServices} loadAvailableTimes={loadAvailableTimes} handleCreateAppointment={handleCreateAppointment} imageUrl={imageUrl} preselectedServiceId={preselectedServiceId} preselectedEmployer={preselectedEmployer} establishment={wizardEstablishment} />
    </>
  );
}