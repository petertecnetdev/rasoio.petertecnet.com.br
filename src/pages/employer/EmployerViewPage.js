import React, { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { FaCalendarAlt, FaCut, FaMapMarkerAlt, FaStar, FaStore, FaWhatsapp } from "react-icons/fa";

import { apiBaseUrl, appId } from "../../config";
import useEmployerView from "../../hooks/useEmployerView";
import useAppointment from "../../hooks/useAppointment";
import useImageUtils from "../../hooks/useImageUtils";
import useSchedulePopup from "../../hooks/useSchedulePopup";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import GlobalCarousel from "../../components/GlobalCarousel";
import AppointmentWizardModal from "../../components/appointment/AppointmentWizardModal";
import ShareButton from "../../components/ShareButton";
import GlobalMap from "../../components/GlobalMap";
import "./EmployerView.css";

const PLACEHOLDER = "/images/user.png";

export default function EmployerViewPage() {
  const { user_name } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }), [user_name]);

  const { employer, establishment, metrics, otherEmployers, otherEstablishments, otherItems, services, products, isLoading } = useEmployerView(apiBaseUrl, user_name, token, navigate);
  const { imageUrl } = useImageUtils(PLACEHOLDER);
  const { showWizard, setShowWizard, wizardEstablishment, wizardEmployers, wizardServices, preselectedEmployer, preselectedServiceId, openSchedulePopup } = useSchedulePopup(apiBaseUrl, token, appId);
  const { loadAvailableTimes, handleCreateAppointment } = useAppointment(apiBaseUrl, appId, token, wizardEstablishment);
  const whatsappLink = useWhatsappLink(employer?.user || employer || establishment || null);
  const safeNavigate = useMemo(() => (path) => (window.location.href = path), []);

  const fullName = `${employer?.user?.first_name || ""} ${employer?.user?.last_name || ""}`.trim() || employer?.name || employer?.user?.user_name || "Profissional";
  const role = employer?.role || employer?.profession || "Barbeiro";
  const cityLabel = [establishment?.city, establishment?.uf].filter(Boolean).join(" - ");
  const rating = metrics?.rating ?? employer?.metrics?.rating ?? employer?.avg_rating ?? employer?.rating;
  const ratingLabel = rating != null && !Number.isNaN(Number(rating)) ? Number(rating).toFixed(1) : null;
  const description = employer?.description || employer?.bio || employer?.user?.about || `Atendimento profissional, técnica e cuidado em cada detalhe.`;

  const portrait = useMemo(() => {
    const eFiles = Array.isArray(employer?.files) ? employer.files : [];
    const uFiles = Array.isArray(employer?.user?.files) ? employer.user.files : [];
    return eFiles.find((f) => ["avatar", "profile"].includes(f?.type))?.public_url || uFiles.find((f) => ["avatar", "profile"].includes(f?.type))?.public_url || employer?.avatar || employer?.images?.avatar || employer?.user?.avatar || employer?.user?.images?.avatar || null;
  }, [employer]);

  const handleOpenFromEmployer = useCallback(async () => {
    try {
      await openSchedulePopup({ establishment: establishment || employer?.establishment || null, employer, filteredEmployers: employer ? [employer] : [] });
    } catch (e) { console.error(e); Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível abrir o agendamento agora." }); }
  }, [openSchedulePopup, employer, establishment]);

  const handleOpenFromService = useCallback((item) => {
    try { openSchedulePopup({ service: item, filteredEmployers: employer ? [employer] : [], establishment: establishment || employer?.establishment || null, employer }); }
    catch (e) { console.error(e); Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível abrir o agendamento agora." }); }
  }, [openSchedulePopup, employer, establishment]);

  if (isLoading) return <div className="barber-state">Carregando profissional…</div>;
  if (!employer) return <div className="barber-state">Perfil profissional indisponível.</div>;

  return (
    <>
      <main className="barber-page">
        <section className="barber-hero">
          <div className="barber-heroTexture" />
          <div className="barber-shell barber-heroGrid">
            <div className="barber-copy">
              <span className="barber-label"><FaCut /> PERFIL PROFISSIONAL</span>
              <h1>{fullName}</h1>
              <div className="barber-role">{role}</div>
              <p>{description}</p>
              <div className="barber-meta">
                {ratingLabel && <span><FaStar /> {ratingLabel} de avaliação</span>}
                {cityLabel && <span><FaMapMarkerAlt /> {cityLabel}</span>}
                {establishment?.name && <button type="button" onClick={() => establishment?.slug && navigate(`/establishment/view/${establishment.slug}`)}><FaStore /> {establishment.name}</button>}
              </div>
              <div className="barber-actions">
                <button type="button" className="barber-book" onClick={handleOpenFromEmployer}><FaCalendarAlt /> Agendar com {fullName.split(" ")[0]}</button>
                {whatsappLink && <a href={whatsappLink} target="_blank" rel="noreferrer"><FaWhatsapp /> WhatsApp</a>}
              </div>
            </div>
            <div className="barber-portraitWrap"><div className="barber-number">01</div><img src={imageUrl(portrait || PLACEHOLDER)} alt={fullName} className="barber-portrait" /><div className="barber-signature">{fullName}</div></div>
          </div>
        </section>

        <div className="barber-shell barber-content">
          <section className="barber-manifesto"><span>ESPECIALIDADE</span><h2>Um atendimento com identidade própria.</h2><p>{description}</p></section>

          {Array.isArray(services) && services.length > 0 && <section className="barber-panel"><div className="barber-heading"><div><span>SERVIÇOS</span><h2>Escolha o seu próximo cuidado</h2></div><button type="button" onClick={handleOpenFromEmployer}>Ver horários</button></div><GlobalCarousel title="" subtitle="Serviços atendidos por este profissional" items={services} fmtBRL={(v) => v} navigate={safeNavigate} openSchedulePopup={handleOpenFromService} showSchedule showDots /></section>}

          {Array.isArray(products) && products.length > 0 && <section className="barber-panel barber-panel--products"><div className="barber-heading"><div><span>RECOMENDAÇÕES</span><h2>Produtos disponíveis</h2></div></div><GlobalCarousel title="" subtitle="Cuidados para continuar em casa" items={products} fmtBRL={(v) => v} navigate={safeNavigate} showSchedule={false} showDots /></section>}

          {establishment && <section className="barber-location"><div><span>ONDE ATENDE</span><h2>{establishment.name}</h2><p>{[establishment.address, cityLabel].filter(Boolean).join(" · ")}</p></div><GlobalMap location={establishment?.location} address={establishment?.address} city={establishment?.city} uf={establishment?.uf} /></section>}

          {Array.isArray(otherEmployers) && otherEmployers.length > 0 && <section className="barber-related"><GlobalCarousel title="Conheça outros profissionais" subtitle="Outros estilos, técnicas e disponibilidades" items={otherEmployers} fmtBRL={(v) => v} navigate={navigate} openSchedulePopup={(emp) => navigate(`/employer/view/${encodeURIComponent(emp?.user_name || emp?.user?.user_name || emp?.id)}`)} showSchedule={false} showDots /></section>}
          {Array.isArray(otherItems) && otherItems.length > 0 && <section className="barber-related"><GlobalCarousel title="Outros serviços" subtitle="Mais opções para o seu próximo atendimento" items={otherItems} fmtBRL={(v) => v} navigate={safeNavigate} openSchedulePopup={handleOpenFromService} showSchedule showDots /></section>}
          {Array.isArray(otherEstablishments) && otherEstablishments.length > 0 && <section className="barber-related"><GlobalCarousel title="Outras barbearias" subtitle="Descubra outros ambientes" items={otherEstablishments} fmtBRL={(v) => v} navigate={safeNavigate} showSchedule={false} showDots /></section>}
        </div>
      </main>

      <div className="barber-mobileBook"><button type="button" onClick={handleOpenFromEmployer}><FaCalendarAlt /> Agendar com {fullName.split(" ")[0]}</button></div>
      <ShareButton />
      <AppointmentWizardModal show={showWizard} onHide={() => setShowWizard(false)} employers={wizardEmployers} services={wizardServices} loadAvailableTimes={loadAvailableTimes} handleCreateAppointment={handleCreateAppointment} imageUrl={imageUrl} preselectedServiceId={preselectedServiceId} preselectedEmployer={preselectedEmployer} establishment={wizardEstablishment} />
    </>
  );
}
