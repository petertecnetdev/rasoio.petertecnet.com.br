import React, { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { FaCalendarAlt, FaMapMarkerAlt, FaWhatsapp, FaStar, FaCut, FaUsers } from "react-icons/fa";

import { apiBaseUrl, appId } from "../../config";
import useEstablishmentView from "../../hooks/useEstablishmentView";
import useAppointment from "../../hooks/useAppointment";
import useImageUtils from "../../hooks/useImageUtils";
import useSchedulePopup from "../../hooks/useSchedulePopup";
import useWhatsappLink from "../../hooks/useWhatsappLink";

import GlobalCarousel from "../../components/GlobalCarousel";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";
import ShareButton from "../../components/ShareButton";
import GlobalMap from "../../components/GlobalMap";
import "./EstablishmentView.css";

const PLACEHOLDER = "/images/logo.png";

export default function EstablishmentViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { establishment, metrics, otherEstablishments, otherEmployers, otherItems, services, products, employers, isLoading } = useEstablishmentView(apiBaseUrl, slug, token, navigate);
  const { imageUrl } = useImageUtils(PLACEHOLDER);
  const { showWizard, setShowWizard, wizardEstablishment, wizardEmployers, wizardServices, preselectedEmployer, preselectedServiceId, openSchedulePopup } = useSchedulePopup(apiBaseUrl, token, appId);
  const { loadAvailableTimes, handleCreateAppointment } = useAppointment(apiBaseUrl, appId, token, wizardEstablishment);
  const whatsappLink = useWhatsappLink(establishment);
  const safeNavigate = useMemo(() => (path) => (window.location.href = path), []);
  const hasSchedulableEmployers = Array.isArray(employers) && employers.length > 0;

  const heroLogo = establishment?.images?.logo || establishment?.logo || null;
  const heroBg = establishment?.images?.background || establishment?.background || null;
  const gallery = Array.isArray(establishment?.images?.gallery) ? establishment.images.gallery : [];
  const description = establishment?.description || establishment?.about || establishment?.bio || "Cuidado, estilo e atendimento profissional em um ambiente pensado para você.";
  const cityLabel = [establishment?.city, establishment?.uf].filter(Boolean).join(" - ");
  const rating = metrics?.rating ?? establishment?.metrics?.rating ?? metrics?.avg_rating ?? establishment?.avg_rating ?? establishment?.rating;
  const ratingLabel = rating != null && !Number.isNaN(Number(rating)) ? Number(rating).toFixed(1) : null;

  const handleOpenFromEstablishment = useCallback(async (est) => {
    try {
      const estId = est?.id ?? establishment?.id ?? null;
      const filteredEmployers = (Array.isArray(employers) ? employers : []).filter((emp) => Number(emp?.establishment_id) === Number(estId));
      if (!filteredEmployers.length) return;
      await openSchedulePopup({ establishment: est || establishment, filteredEmployers });
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível abrir o agendamento agora." });
    }
  }, [openSchedulePopup, employers, establishment]);

  const handleOpenFromEmployer = useCallback((emp) => {
    try { openSchedulePopup({ employer: emp, establishment: establishment || emp?.establishment || null }); }
    catch (e) { console.error(e); Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível abrir o agendamento agora." }); }
  }, [openSchedulePopup, establishment]);

  const handleOpenFromService = useCallback((item) => {
    try {
      const estId = item?.establishment_id || item?.entity_id || item?.entityId || establishment?.id || null;
      const filteredEmployers = (Array.isArray(employers) ? employers : []).filter((emp) => Number(emp?.establishment_id) === Number(estId));
      if (!filteredEmployers.length) return;
      openSchedulePopup({ service: item, filteredEmployers, establishment });
    } catch (e) { console.error(e); Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível abrir o agendamento agora." }); }
  }, [openSchedulePopup, employers, establishment]);

  if (isLoading) return <div className="ev-state">Carregando barbearia…</div>;
  if (!establishment) return <div className="ev-state">Esta barbearia não está disponível.</div>;

  return (
    <>
      <main className="ev-page">
        <section className="ev-hero" style={heroBg ? { backgroundImage: `linear-gradient(90deg, rgba(3,9,18,.96) 0%, rgba(3,9,18,.78) 46%, rgba(3,9,18,.30) 100%), url(${imageUrl(heroBg)})` } : undefined}>
          <div className="ev-heroGlow" />
          <div className="ev-shell ev-heroInner">
            <div className="ev-identity">
              <div className="ev-logo"><img src={imageUrl(heroLogo || PLACEHOLDER)} alt={establishment.name} /></div>
              <div className="ev-eyebrow"><FaCut /> BARBEARIA</div>
              <h1>{establishment.name}</h1>
              <p>{description}</p>
              <div className="ev-meta">
                {cityLabel && <span><FaMapMarkerAlt /> {cityLabel}</span>}
                {ratingLabel && <span className="ev-rating"><FaStar /> {ratingLabel}</span>}
                <span><FaUsers /> {employers?.length || 0} profissionais</span>
              </div>
              <div className="ev-actions">
                {hasSchedulableEmployers && <button type="button" className="ev-primary" onClick={() => handleOpenFromEstablishment(establishment)}><FaCalendarAlt /> Agendar horário</button>}
                {whatsappLink && <a className="ev-secondary" href={whatsappLink} target="_blank" rel="noreferrer"><FaWhatsapp /> WhatsApp</a>}
              </div>
            </div>
          </div>
        </section>

        <div className="ev-shell">
          <section className="ev-quickbar">
            <div><strong>{services?.length || 0}</strong><span>serviços disponíveis</span></div>
            <div><strong>{employers?.length || 0}</strong><span>profissionais na equipe</span></div>
            <div><strong>{ratingLabel || "—"}</strong><span>avaliação da barbearia</span></div>
            {hasSchedulableEmployers && <button type="button" onClick={() => handleOpenFromEstablishment(establishment)}>Escolher meu horário <span>→</span></button>}
          </section>

          <section className="ev-intro">
            <div><span className="ev-kicker">SUA EXPERIÊNCIA</span><h2>Seu estilo começa aqui.</h2><p>{description}</p></div>
            <div className="ev-introCard"><FaCalendarAlt /><div><strong>{hasSchedulableEmployers ? "Agendamento simples" : "Agendamento indisponível"}</strong><span>{hasSchedulableEmployers ? "Escolha o serviço, o profissional e o melhor horário para você." : "Este estabelecimento ainda não possui profissional disponível para agendamentos."}</span></div></div>
          </section>

          <div className="ev-sections">
            {Array.isArray(services) && services.length > 0 && <section className="ev-block ev-services"><div className="ev-sectionHeading"><div><span>O QUE FAZEMOS</span><h2>Serviços da barbearia</h2></div>{hasSchedulableEmployers && <button type="button" onClick={() => handleOpenFromEstablishment(establishment)}>Agendar agora</button>}</div><GlobalCarousel title="" subtitle="Escolha seu serviço" items={services.map((service) => ({ ...service, can_schedule: hasSchedulableEmployers }))} fmtBRL={(v) => v} navigate={safeNavigate} openSchedulePopup={handleOpenFromService} showSchedule={hasSchedulableEmployers} showDots /></section>}
            {Array.isArray(employers) && employers.length > 0 && <section className="ev-block"><div className="ev-sectionHeading"><div><span>NOSSA EQUIPE</span><h2>Profissionais que cuidam do seu estilo</h2></div></div><GlobalCarousel title="" subtitle="Escolha com quem você quer agendar" items={employers} fmtBRL={(v) => v} navigate={navigate} openSchedulePopup={handleOpenFromEmployer} showSchedule showDots /></section>}

            {gallery.length > 0 && <section className="ev-block ev-gallery"><div className="ev-sectionHeading"><div><span>AMBIENTE</span><h2>Conheça a barbearia</h2></div></div><div className="ev-galleryGrid">{gallery.slice(0, 8).map((src, idx) => <button key={`${src}-${idx}`} type="button" className={`ev-galleryItem ev-galleryItem-${idx + 1}`} onClick={() => Swal.fire({ imageUrl: imageUrl(src), imageAlt: "Ambiente da barbearia", showConfirmButton: false, showCloseButton: true, background: "#07111f" })}><img src={imageUrl(src)} alt={`Ambiente ${idx + 1}`} loading="lazy" /></button>)}</div></section>}

            {Array.isArray(products) && products.length > 0 && <section className="ev-block"><div className="ev-sectionHeading"><div><span>CUIDADO EM CASA</span><h2>Produtos selecionados</h2></div></div><GlobalCarousel title="" subtitle="Produtos disponíveis nesta barbearia" items={products} fmtBRL={(v) => v} navigate={safeNavigate} showSchedule={false} showDots /></section>}

            <section className="ev-block ev-location"><div className="ev-sectionHeading"><div><span>ONDE ESTAMOS</span><h2>Venha nos visitar</h2>{establishment?.address && <p>{establishment.address}{cityLabel ? ` · ${cityLabel}` : ""}</p>}</div></div><GlobalMap location={establishment?.location} address={establishment?.address} city={establishment?.city} uf={establishment?.uf} /></section>

            <section className="ev-finalCta"><div><span>{hasSchedulableEmployers ? "PRONTO PARA MUDAR O VISUAL?" : "AGENDA INDISPONÍVEL"}</span><h2>{hasSchedulableEmployers ? "Reserve seu horário em poucos cliques." : "Este estabelecimento ainda não possui profissional disponível para agendamento."}</h2>{hasSchedulableEmployers && <p>Escolha seus serviços, seu profissional e encontre os horários disponíveis.</p>}</div>{hasSchedulableEmployers && <button type="button" onClick={() => handleOpenFromEstablishment(establishment)}><FaCalendarAlt /> Agendar agora</button>}</section>

            {Array.isArray(otherEstablishments) && otherEstablishments.length > 0 && <section className="ev-block ev-related"><GlobalCarousel title="Outras barbearias" subtitle="Conheça outras opções" items={otherEstablishments} fmtBRL={(v) => v} navigate={safeNavigate} showSchedule={false} showDots /></section>}
            {Array.isArray(otherEmployers) && otherEmployers.length > 0 && <section className="ev-related"><GlobalCarousel title="Outros profissionais" subtitle="Mais profissionais para conhecer" items={otherEmployers} fmtBRL={(v) => v} navigate={navigate} openSchedulePopup={handleOpenFromEmployer} showSchedule showDots /></section>}
            {Array.isArray(otherItems) && otherItems.length > 0 && <section className="ev-related"><GlobalCarousel title="Outros serviços" subtitle="Veja mais opções" items={otherItems} fmtBRL={(v) => v} navigate={safeNavigate} showSchedule={false} showDots /></section>}
          </div>
        </div>
      </main>

      {hasSchedulableEmployers && <div className="ev-mobileBooking"><button type="button" onClick={() => handleOpenFromEstablishment(establishment)}><FaCalendarAlt /> Agendar horário</button></div>}
      <ShareButton />
      <AppointmentWizardModal show={showWizard} onHide={() => setShowWizard(false)} employers={wizardEmployers} services={wizardServices} loadAvailableTimes={loadAvailableTimes} handleCreateAppointment={handleCreateAppointment} imageUrl={imageUrl} preselectedServiceId={preselectedServiceId} preselectedEmployer={preselectedEmployer} establishment={wizardEstablishment} />
    </>
  );
}
