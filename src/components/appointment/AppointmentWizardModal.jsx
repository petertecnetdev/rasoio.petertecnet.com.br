import React, { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";

import { apiBaseUrl } from "../../config";
import api from "../../services/api";
import useImageUtils from "../../hooks/useImageUtils";
import GlobalDateCarousel from "../GlobalDateCarousel";
import GlobalModal from "../GlobalModal";
import GlobalButton from "../GlobalButton";
import ProcessingIndicatorComponent from "../ProcessingIndicatorComponent";
import StepTime from "./StepTime";
import "./AppointmentWizardModal.css";

dayjs.extend(utc);
dayjs.extend(tz);

const MySwal = withReactContent(Swal);
const TZ = "America/Sao_Paulo";
const DAYS_TO_CHECK = 14;

const buildInitialsSvg = (name = "?") => {
  const parts = String(name || "?").trim().split(" ").filter(Boolean);
  const initials = parts.length === 1
    ? parts[0][0]?.toUpperCase()
    : (parts[0][0] + parts.at(-1)[0]).toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0b1c2d"/><stop offset="100%" stop-color="#020617"/></linearGradient></defs>
      <rect width="200" height="200" rx="100" fill="url(#g)"/>
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="64" font-weight="700" fill="#e5e7eb" font-family="Inter,Arial,sans-serif">${initials || "?"}</text>
    </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const normalizeApiError = (err) => {
  const e = err || {};
  const message = e?.message || e?.error || e?.msg || e?.data?.message || e?.data?.error || "Não foi possível criar o agendamento.";
  const errors = e?.errors || e?.data?.errors || e?.response?.data?.errors || e?.validation_errors || null;
  const fieldMessages = [];
  if (errors && typeof errors === "object") {
    Object.entries(errors).forEach(([field, value]) => {
      const list = Array.isArray(value) ? value : [value];
      list.flat().filter(Boolean).forEach((m) => fieldMessages.push({ field, message: String(m) }));
    });
  }
  return { message, fieldMessages };
};

const escapeHtml = (str) => String(str ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const pickApiSuccessMessage = (data) => data?.message || data?.msg || data?.data?.message || data?.data?.msg || "Agendamento registrado com sucesso!";
const pickApiOrderId = (data) => data?.id || data?.order_id || data?.data?.id || data?.data?.order_id || data?.order?.id || data?.data?.order?.id || null;

export default function AppointmentWizardModal({
  show,
  onHide,
  employers = [],
  services = [],
  loadAvailableTimes,
  imageUrl,
  preselectedService = null,
  preselectedServiceId = null,
  preselectedEmployer = null,
  establishment = null,
}) {
  const { imageUrl: imgUrl } = useImageUtils();
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [customerCpf, setCustomerCpf] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [requiresCpf, setRequiresCpf] = useState(true);
  const [requiresPhone, setRequiresPhone] = useState(true);

  const hasPreselectedEmployer = !!preselectedEmployer;
  const finalStep = hasPreselectedEmployer ? 4 : 5;
  const dateStep = hasPreselectedEmployer ? 2 : 3;
  const timeStep = dateStep + 1;
  const resolvedEmployer = selectedEmployer || preselectedEmployer || null;
  const busy = loading || loadingDates || loadingProfile;

  const resolvedEstablishment = useMemo(
    () => establishment || preselectedEmployer?.establishment || resolvedEmployer?.establishment || null,
    [establishment, preselectedEmployer, resolvedEmployer]
  );

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, service) => sum + (parseInt(service?.duration, 10) || 30), 0),
    [selectedServices]
  );
  const totalValue = useMemo(
    () => selectedServices.reduce((sum, service) => sum + (parseFloat(service?.price) || 0), 0),
    [selectedServices]
  );
  const fmtBRL = (value) => `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;

  const showResultModal = useCallback(async ({ type, title, html, text }) => MySwal.fire({
    icon: type,
    title,
    html: html || undefined,
    text: text || undefined,
    background: "#0a0a0c",
    color: "#fff",
    confirmButtonColor: "#00e5ff",
    allowOutsideClick: false,
    heightAuto: false,
    target: document.body,
    customClass: { container: "awm-swal-container", popup: "awm-swal-popup", title: "awm-swal-title", htmlContainer: "awm-swal-html" },
    didOpen: () => {
      const container = document.querySelector(".awm-swal-container");
      if (container) container.style.zIndex = "2147483647";
    },
  }), []);

  const resolveImage = useCallback((entity, name) => {
    const files = Array.isArray(entity?.files) ? entity.files : [];
    const candidates = [
      entity?.image, entity?.logo, entity?.avatar,
      entity?.images?.avatar, entity?.images?.logo, entity?.images?.profile, entity?.images?.background,
      files.find((f) => f?.type === "logo")?.public_url,
      files.find((f) => f?.type === "avatar")?.public_url,
      files.find((f) => ["image", "photo", "cover", "background"].includes(f?.type))?.public_url,
    ].filter(Boolean);
    for (const path of candidates) {
      const url = imageUrl ? imageUrl(path) : imgUrl(path);
      if (url) return url;
    }
    return buildInitialsSvg(name);
  }, [imageUrl, imgUrl]);

  const establishmentLogoSrc = useMemo(() => {
    if (!resolvedEstablishment) return "/images/rasoio.png";
    return resolveImage(resolvedEstablishment, resolvedEstablishment?.name || "Estabelecimento");
  }, [resolvedEstablishment, resolveImage]);

  const applyContactData = useCallback((user) => {
    const profile = user?.profile || {};
    const cpf = String(profile?.cpf || user?.cpf || "").trim();
    const phone = String(profile?.phone || user?.phone || "").trim();
    setCustomerCpf(cpf);
    setCustomerPhone(phone);
    setRequiresCpf(!cpf);
    setRequiresPhone(!phone);
  }, []);

  useEffect(() => {
    if (!show) return undefined;
    let active = true;

    setStep(1);
    const serviceId = preselectedServiceId || preselectedService?.id || preselectedService?.item_id || null;
    if (serviceId && services.length) {
      const found = services.find((service) => Number(service.id || service.item_id) === Number(serviceId));
      setSelectedServices(found ? [found] : []);
    } else {
      setSelectedServices([]);
    }

    setSelectedEmployer(preselectedEmployer || null);
    setSelectedDate(null);
    setAvailableDates([]);
    setAvailableTimes([]);
    setSelectedTime(null);
    setLoading(false);
    setLoadingDates(false);

    let storedUser = null;
    try { storedUser = JSON.parse(localStorage.getItem("user") || "null"); } catch { storedUser = null; }
    applyContactData(storedUser || {});

    const token = localStorage.getItem("token");
    if (token) {
      setLoadingProfile(true);
      api.get("/auth/me")
        .then(({ data }) => {
          if (!active) return;
          const freshUser = data?.user || null;
          if (!freshUser) return;
          applyContactData(freshUser);
          localStorage.setItem("user", JSON.stringify({ ...(storedUser || {}), ...freshUser }));
        })
        .catch(() => {})
        .finally(() => { if (active) setLoadingProfile(false); });
    } else {
      setLoadingProfile(false);
    }

    return () => { active = false; };
  }, [show, preselectedService, preselectedServiceId, preselectedEmployer, services, applyContactData]);

  useEffect(() => {
    if (!show) return;
    setSelectedTime(null);
    setAvailableTimes([]);
  }, [selectedDate, show]);

  useEffect(() => {
    if (selectedTime && !availableTimes.includes(selectedTime)) setSelectedTime(null);
  }, [availableTimes, selectedTime]);

  const prepareAvailableDates = useCallback(async (employer) => {
    if (!employer?.id || !selectedServices.length || totalDuration <= 0) {
      setAvailableDates([]);
      setSelectedDate(null);
      return [];
    }
    setLoadingDates(true);
    setSelectedDate(null);
    setSelectedTime(null);
    setAvailableTimes([]);
    try {
      const today = dayjs().tz(TZ).startOf("day");
      const dates = Array.from({ length: DAYS_TO_CHECK }, (_, index) => today.add(index, "day").format("YYYY-MM-DD"));
      const checks = await Promise.all(dates.map(async (date) => {
        const times = await loadAvailableTimes(date, employer, totalDuration);
        return Array.isArray(times) && times.length > 0 ? date : null;
      }));
      const valid = checks.filter(Boolean);
      setAvailableDates(valid);
      return valid;
    } finally {
      setLoadingDates(false);
    }
  }, [loadAvailableTimes, selectedServices.length, totalDuration]);

  const handleServiceToggle = useCallback((service) => {
    const id = service.id || service.item_id;
    setSelectedServices((current) => current.some((item) => (item.id || item.item_id) === id)
      ? current.filter((item) => (item.id || item.item_id) !== id)
      : [...current, service]);
    setAvailableDates([]); setSelectedDate(null); setAvailableTimes([]); setSelectedTime(null);
  }, []);

  const handleEmployerSelect = useCallback((employer) => {
    setSelectedEmployer(employer);
    setAvailableDates([]); setSelectedDate(null); setAvailableTimes([]); setSelectedTime(null);
  }, []);

  const submitAppointment = async () => {
    const missing = [];
    if (!String(customerCpf || "").trim()) missing.push("CPF");
    if (!String(customerPhone || "").trim()) missing.push("telefone");
    if (missing.length) {
      await showResultModal({ type: "warning", title: "Complete seus dados", text: `Informe ${missing.join(" e ")} para continuar.` });
      return;
    }

    setLoading(true);
    try {
      const dateBase = String(selectedDate).slice(0, 10);
      const freshTimes = await loadAvailableTimes(dateBase, resolvedEmployer, totalDuration);
      if (!Array.isArray(freshTimes) || !freshTimes.includes(selectedTime)) {
        setAvailableTimes(Array.isArray(freshTimes) ? freshTimes : []);
        setSelectedTime(null);
        setStep(timeStep);
        await showResultModal({ type: "warning", title: "Horário não está mais disponível", text: "Escolha outro horário para continuar." });
        return;
      }

      const datetimeSP = dayjs.tz(`${dateBase} ${selectedTime}`, "YYYY-MM-DD HH:mm", TZ);
      let parsed = null;
      try { parsed = JSON.parse(localStorage.getItem("user") || "null"); } catch { parsed = null; }
      const payload = {
        mode: "appointment",
        app_id: resolvedEstablishment?.app_id || 2,
        entity_name: "establishment",
        entity_id: resolvedEstablishment?.id,
        items: selectedServices.map((service) => ({ item_id: service.id || service.item_id, quantity: 1 })),
        client_id: parsed?.id || null,
        customer_name: `${parsed?.first_name || ""} ${parsed?.last_name || ""}`.trim() || "Cliente App",
        customer_phone: String(customerPhone).trim(),
        customer_cpf: String(customerCpf).trim(),
        origin: "App",
        fulfillment: "dine-in",
        payment_status: "pending",
        payment_method: "Pix",
        notes: "Agendamento feito pelo aplicativo.",
        order_datetime: datetimeSP.format("YYYY-MM-DDTHH:mm:ssZ"),
        attendant_id: resolvedEmployer?.id || null,
      };

      const token = localStorage.getItem("token");
      const response = await fetch(`${apiBaseUrl}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw data;

      const orderId = pickApiOrderId(data);
      const html = `<div class="awm-swal"><div class="awm-swal__msg">${escapeHtml(pickApiSuccessMessage(data))}</div><div class="awm-swal__title">Resumo do agendamento</div><ul class="awm-swal__list">${resolvedEstablishment?.name ? `<li><b>Estabelecimento</b>: ${escapeHtml(resolvedEstablishment.name)}</li>` : ""}${resolvedEmployer?.name ? `<li><b>Profissional</b>: ${escapeHtml(resolvedEmployer.name)}</li>` : ""}<li><b>Data</b>: ${escapeHtml(dayjs(dateBase).format("DD/MM/YYYY"))}</li><li><b>Horário</b>: ${escapeHtml(selectedTime)}</li>${orderId ? `<li><b>Código</b>: ${escapeHtml(orderId)}</li>` : ""}<li><b>Total</b>: ${escapeHtml(fmtBRL(totalValue))}</li><li><b>Duração</b>: ${escapeHtml(totalDuration)} min</li></ul></div>`;
      await showResultModal({ type: "success", title: "Agendamento", html });
      onHide?.();
    } catch (error) {
      const { message, fieldMessages } = normalizeApiError(error);
      const html = fieldMessages.length
        ? `<div class="awm-swal"><div class="awm-swal__msg">${escapeHtml(message)}</div><div class="awm-swal__title">Campos com erro:</div><ul class="awm-swal__list">${fieldMessages.map((item) => `<li><b>${escapeHtml(item.field)}</b>: ${escapeHtml(item.message)}</li>`).join("")}</ul></div>`
        : `<div class="awm-swal"><div class="awm-swal__msg">${escapeHtml(message)}</div></div>`;
      await showResultModal({ type: "error", title: "Erro ao agendar", html });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (busy) return;
    if (step === 1) {
      if (!selectedServices.length) return;
      if (hasPreselectedEmployer) {
        setLoading(true);
        try { await prepareAvailableDates(resolvedEmployer); setStep(dateStep); } finally { setLoading(false); }
      } else setStep(2);
      return;
    }
    if (!hasPreselectedEmployer && step === 2) {
      if (!selectedEmployer) return;
      setLoading(true);
      try { await prepareAvailableDates(selectedEmployer); setStep(dateStep); } finally { setLoading(false); }
      return;
    }
    if (step === dateStep) {
      if (!selectedDate) return;
      setLoading(true);
      try {
        const dateYMD = String(selectedDate).slice(0, 10);
        const times = await loadAvailableTimes(dateYMD, resolvedEmployer, totalDuration);
        const safeTimes = Array.isArray(times) ? times : [];
        if (!safeTimes.length) {
          setAvailableDates((current) => current.filter((date) => date !== dateYMD));
          setSelectedDate(null);
          await showResultModal({ type: "warning", title: "Data indisponível", text: "Os horários dessa data acabaram de ficar indisponíveis. Escolha outra data." });
          return;
        }
        setAvailableTimes(safeTimes); setSelectedTime(null); setStep(timeStep);
      } finally { setLoading(false); }
      return;
    }
    if (step === timeStep) {
      if (!selectedTime) return;
      setStep(finalStep);
      return;
    }
    if (step === finalStep) await submitAppointment();
  };

  const handleBack = () => { if (!busy) setStep((current) => Math.max(1, current - 1)); };
  const handleSafeHide = useCallback(() => { if (!busy) onHide?.(); }, [busy, onHide]);

  const footer = <>
    <GlobalButton variant="secondary" onClick={handleSafeHide} disabled={busy}>Cancelar</GlobalButton>
    {step > 1 && <GlobalButton variant="secondary" onClick={handleBack} disabled={busy}>Voltar</GlobalButton>}
    <GlobalButton variant="primary" onClick={handleNext} disabled={busy}>{step === finalStep ? "Confirmar" : "Avançar"}</GlobalButton>
  </>;

  return (
    <GlobalModal show={show} onHide={handleSafeHide} size="xl" backdrop="static" title="Agendamento" subtitle={resolvedEstablishment?.name || "Selecione serviços e horário"} logoSrc={establishmentLogoSrc} footer={footer} className="awm-modal awm-modal--fullscreen" dialogClassName="awm-modal__dialog" contentClassName="awm-modal__content">
      {busy && <ProcessingIndicatorComponent messages={loadingProfile ? ["Verificando seus dados...", "Preparando o agendamento..."] : loadingDates ? ["Verificando os dias disponíveis...", "Consultando a agenda do profissional...", "Encontrando horários livres..."] : ["Processando seu agendamento...", "Verificando disponibilidade...", "Registrando pedido..."]} interval={1100} gifSrc="/images/logo.mp4" />}

      <div className="awm__root">
        {(resolvedEstablishment || resolvedEmployer || selectedServices.length > 0) && <div className="awm__summary">
          <div className="awm__summary-left">
            {resolvedEstablishment?.name && <img src={establishmentLogoSrc} alt={resolvedEstablishment.name} className="awm__summary-avatar awm__summary-avatar--est" />}
            {resolvedEmployer ? <><img src={resolveImage(resolvedEmployer, resolvedEmployer.name)} alt={resolvedEmployer.name} className="awm__summary-avatar" /><div className="awm__summary-meta"><div className="awm__summary-label">Profissional selecionado</div><div className="awm__summary-name">{resolvedEmployer.name}</div></div></> : <div className="awm__summary-hint">{step === 1 ? "Monte seu atendimento" : "Selecione um profissional no próximo passo"}</div>}
          </div>
          <div className="awm__summary-right">{selectedServices.length > 0 ? <><div className="awm__summary-label">{selectedServices.length} {selectedServices.length === 1 ? "serviço selecionado" : "serviços selecionados"}</div><div className="awm__summary-name">{fmtBRL(totalValue)} · {totalDuration} min</div></> : resolvedEstablishment?.name ? <><div className="awm__summary-label">Estabelecimento</div><div className="awm__summary-name">{resolvedEstablishment.name}</div></> : null}</div>
        </div>}

        {step === 1 && <div className="wizard-step"><h4 className="text-center">Escolha os Serviços</h4><div className="grid">{services.map((service) => { const id = service.id || service.item_id; const active = selectedServices.some((item) => (item.id || item.item_id) === id); return <div key={id} className={`card-service ${active ? "active" : ""}`} onClick={() => handleServiceToggle(service)}><img src={resolveImage(service, service.name)} alt={service.name} className="service-img" /><h5 className="text-white">{service.name}</h5><p>{fmtBRL(service.price)}</p><small>{service.duration || 30} min</small></div>; })}</div></div>}

        {!hasPreselectedEmployer && step === 2 && <div className="wizard-step"><h4 className="text-white text-center">Escolha o Profissional</h4><div className="grid">{employers.map((employer) => <div key={employer.id} className={`card-emp text-white ${selectedEmployer?.id === employer.id ? "active" : ""}`} onClick={() => handleEmployerSelect(employer)}><img src={resolveImage(employer, employer.name)} alt={employer.name} className="emp-avatar aling-center" /><strong>{employer.name}</strong></div>)}</div></div>}

        {step === dateStep && <GlobalDateCarousel selectedDate={selectedDate} onChange={setSelectedDate} daysToShow={DAYS_TO_CHECK} availableDates={availableDates} loading={loadingDates} />}
        {step === timeStep && <StepTime availableTimes={availableTimes} selected={selectedTime} onChange={setSelectedTime} loading={loading} title="Escolha o Horário" subtitle="Toque em um horário para selecionar" />}

        {step === finalStep && <div className="awm__final">
          <p className="awm__totals"><b>Total:</b> {fmtBRL(totalValue)} | <b>Duração:</b> {totalDuration} min</p>
          {(requiresCpf || requiresPhone) ? <>
            <p className="awm__totals">Complete somente os dados que ainda não estão cadastrados na sua conta.</p>
            <div className="awm__inputs-grid">
              {requiresCpf && <input value={customerCpf} onChange={(event) => setCustomerCpf(event.target.value)} placeholder="CPF" className="awm__input" inputMode="numeric" autoComplete="off" />}
              {requiresPhone && <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="Telefone" className="awm__input" inputMode="tel" autoComplete="tel" />}
            </div>
          </> : <p className="awm__totals">Seus dados de contato já estão cadastrados. Revise o total acima e confirme o agendamento.</p>}
        </div>}
      </div>
    </GlobalModal>
  );
}
