// src/components/appointment/AppointmentWizardModal.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import GlobalDateCarousel from "../GlobalDateCarousel";
import GlobalModal from "../GlobalModal";
import GlobalButton from "../GlobalButton";
import ProcessingIndicatorComponent from "../ProcessingIndicatorComponent";
import { apiBaseUrl } from "../../config";
import useImageUtils from "../../hooks/useImageUtils";
import StepTime from "./StepTime";

import "./AppointmentWizardModal.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(tz);

const MySwal = withReactContent(Swal);
const TZ = "America/Sao_Paulo";
const DAYS_TO_CHECK = 14;

const buildInitialsSvg = (name = "?") => {
  const parts = String(name || "?")
    .trim()
    .split(" ")
    .filter(Boolean);
  const initials =
    parts.length === 1
      ? parts[0][0]?.toUpperCase()
      : (parts[0][0] + parts.at(-1)[0]).toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0b1c2d"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="100" ry="100" fill="url(#g)"/>
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-size="64" font-weight="700" fill="#e5e7eb"
        font-family="Inter, Arial, sans-serif" letter-spacing="2">
        ${initials || "?"}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const normalizeApiError = (err) => {
  const e = err || {};
  const message =
    e?.message ||
    e?.error ||
    e?.msg ||
    e?.data?.message ||
    e?.data?.error ||
    "Não foi possível criar o agendamento.";

  const errors =
    e?.errors ||
    e?.data?.errors ||
    e?.response?.data?.errors ||
    e?.validation_errors ||
    null;

  const fieldMessages = [];
  if (errors && typeof errors === "object") {
    Object.entries(errors).forEach(([field, value]) => {
      if (Array.isArray(value)) {
        value.filter(Boolean).forEach((m) => fieldMessages.push({ field, message: String(m) }));
      } else if (value && typeof value === "string") {
        fieldMessages.push({ field, message: value });
      } else if (value && typeof value === "object") {
        Object.values(value)
          .flat()
          .filter(Boolean)
          .forEach((m) => fieldMessages.push({ field, message: String(m) }));
      }
    });
  }

  return { message, fieldMessages };
};

const escapeHtml = (str) =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const pickApiSuccessMessage = (data) =>
  data?.message ||
  data?.msg ||
  data?.data?.message ||
  data?.data?.msg ||
  "Agendamento registrado com sucesso!";

const pickApiOrderId = (data) =>
  data?.id ||
  data?.order_id ||
  data?.data?.id ||
  data?.data?.order_id ||
  data?.order?.id ||
  data?.data?.order?.id ||
  null;

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
  const [customerCpf, setCustomerCpf] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const hasPreselectedEmployer = !!preselectedEmployer;
  const finalStep = hasPreselectedEmployer ? 4 : 5;
  const dateStep = hasPreselectedEmployer ? 2 : 3;
  const timeStep = dateStep + 1;
  const resolvedEmployer = selectedEmployer || preselectedEmployer || null;

  const resolvedEstablishment = useMemo(
    () =>
      establishment ||
      preselectedEmployer?.establishment ||
      resolvedEmployer?.establishment ||
      null,
    [establishment, preselectedEmployer, resolvedEmployer]
  );

  const totalDuration = useMemo(
    () =>
      selectedServices.reduce(
        (sum, service) => sum + (parseInt(service?.duration, 10) || 30),
        0
      ),
    [selectedServices]
  );

  const totalValue = useMemo(
    () => selectedServices.reduce((sum, service) => sum + (parseFloat(service?.price) || 0), 0),
    [selectedServices]
  );

  const showResultModal = useCallback(async ({ type, title, html, text }) => {
    return MySwal.fire({
      icon: type,
      title,
      html: html || undefined,
      text: text || undefined,
      background: "#0a0a0c",
      color: "#fff",
      confirmButtonColor: "#00e5ff",
      allowOutsideClick: false,
      allowEscapeKey: true,
      heightAuto: false,
      target: document.body,
      customClass: {
        container: "awm-swal-container",
        popup: "awm-swal-popup",
        title: "awm-swal-title",
        htmlContainer: "awm-swal-html",
      },
      didOpen: () => {
        const container = document.querySelector(".awm-swal-container");
        if (container) container.style.zIndex = "2147483647";
      },
    });
  }, []);

  const resolveImage = useCallback(
    (entity, name) => {
      const fileCandidates = Array.isArray(entity?.files)
        ? [
            entity.files.find((f) => f?.type === "logo")?.public_url,
            entity.files.find((f) => f?.type === "avatar")?.public_url,
            entity.files.find((f) => f?.type === "image")?.public_url,
            entity.files.find((f) => f?.type === "photo")?.public_url,
            entity.files.find((f) => f?.type === "cover")?.public_url,
            entity.files.find((f) => f?.type === "background")?.public_url,
          ].filter(Boolean)
        : [];

      const paths = [
        entity?.image,
        entity?.logo,
        entity?.avatar,
        entity?.images?.avatar,
        entity?.images?.logo,
        entity?.images?.profile,
        entity?.images?.background,
        ...fileCandidates,
      ];

      for (const path of paths) {
        const url = imageUrl ? imageUrl(path) : imgUrl(path);
        if (url) return url;
      }

      return buildInitialsSvg(name);
    },
    [imageUrl, imgUrl]
  );

  const establishmentLogoSrc = useMemo(() => {
    if (!resolvedEstablishment) return "/images/rasoio.png";
    return resolveImage(
      resolvedEstablishment,
      resolvedEstablishment?.name || "Estabelecimento"
    );
  }, [resolvedEstablishment, resolveImage]);

  const prepareAvailableDates = useCallback(
    async (employer) => {
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
        const dates = Array.from({ length: DAYS_TO_CHECK }, (_, index) =>
          today.add(index, "day").format("YYYY-MM-DD")
        );

        const checks = await Promise.all(
          dates.map(async (date) => {
            const times = await loadAvailableTimes(date, employer, totalDuration);
            return Array.isArray(times) && times.length > 0 ? date : null;
          })
        );

        const validDates = checks.filter(Boolean);
        setAvailableDates(validDates);
        return validDates;
      } finally {
        setLoadingDates(false);
      }
    },
    [loadAvailableTimes, selectedServices.length, totalDuration]
  );

  useEffect(() => {
    if (!show) return;

    setStep(1);

    const serviceId =
      preselectedServiceId ||
      preselectedService?.id ||
      preselectedService?.item_id ||
      null;

    if (serviceId && services.length) {
      const serviceFromList = services.find(
        (service) => Number(service.id || service.item_id) === Number(serviceId)
      );
      setSelectedServices(serviceFromList ? [serviceFromList] : []);
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

    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        const profile = parsed.profile || {};
        setCustomerCpf(profile.cpf || parsed.cpf || "");
        setCustomerPhone(profile.phone || parsed.phone || "");
      } catch {
        setCustomerCpf("");
        setCustomerPhone("");
      }
    } else {
      setCustomerCpf("");
      setCustomerPhone("");
    }
  }, [show, preselectedService, preselectedServiceId, preselectedEmployer, services]);

  useEffect(() => {
    if (!show) return;
    setSelectedTime(null);
    setAvailableTimes([]);
  }, [selectedDate, show]);

  useEffect(() => {
    if (!selectedTime) return;
    if (!availableTimes.includes(selectedTime)) setSelectedTime(null);
  }, [availableTimes, selectedTime]);

  const handleServiceToggle = useCallback((service) => {
    const id = service.id || service.item_id;
    setSelectedServices((current) => {
      const exists = current.some((item) => (item.id || item.item_id) === id);
      return exists
        ? current.filter((item) => (item.id || item.item_id) !== id)
        : [...current, service];
    });
    setAvailableDates([]);
    setSelectedDate(null);
    setAvailableTimes([]);
    setSelectedTime(null);
  }, []);

  const handleEmployerSelect = useCallback((employer) => {
    setSelectedEmployer(employer);
    setAvailableDates([]);
    setSelectedDate(null);
    setAvailableTimes([]);
    setSelectedTime(null);
  }, []);

  const fmtBRL = (value) => `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;

  const handleNext = async () => {
    if (loading || loadingDates) return;

    if (step === 1) {
      if (!selectedServices.length) return;

      if (hasPreselectedEmployer) {
        setLoading(true);
        try {
          await prepareAvailableDates(resolvedEmployer);
          setStep(dateStep);
        } finally {
          setLoading(false);
        }
      } else {
        setStep(2);
      }
      return;
    }

    if (!hasPreselectedEmployer && step === 2) {
      if (!selectedEmployer) return;

      setLoading(true);
      try {
        await prepareAvailableDates(selectedEmployer);
        setStep(dateStep);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === dateStep) {
      if (!selectedDate) return;

      try {
        setLoading(true);
        setSelectedTime(null);
        setAvailableTimes([]);

        const dateYMD = String(selectedDate).slice(0, 10);
        const times = await loadAvailableTimes(dateYMD, resolvedEmployer, totalDuration);
        const safeTimes = Array.isArray(times) ? times : [];

        if (!safeTimes.length) {
          setAvailableDates((current) => current.filter((date) => date !== dateYMD));
          setSelectedDate(null);
          await showResultModal({
            type: "warning",
            title: "Data indisponível",
            text: "Os horários dessa data acabaram de ficar indisponíveis. Escolha outra data.",
          });
          return;
        }

        setAvailableTimes(safeTimes);
        setStep(timeStep);
      } catch (error) {
        await showResultModal({
          type: "error",
          title: "Erro ao carregar horários",
          text: error?.message || "Não foi possível carregar os horários disponíveis.",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === timeStep) {
      if (!selectedTime) return;
      setStep(finalStep);
      return;
    }

    if (step !== finalStep) return;

    if (!customerCpf || !customerPhone) {
      await showResultModal({
        type: "warning",
        title: "Preencha os campos",
        text: "Informe seu CPF e telefone para continuar.",
      });
      return;
    }

    try {
      setLoading(true);

      const dateBase = String(selectedDate).slice(0, 10);

      // Revalida imediatamente antes de gravar para evitar confirmação de um
      // horário que ficou ocupado enquanto o cliente concluía o formulário.
      const freshTimes = await loadAvailableTimes(dateBase, resolvedEmployer, totalDuration);
      if (!Array.isArray(freshTimes) || !freshTimes.includes(selectedTime)) {
        setAvailableTimes(Array.isArray(freshTimes) ? freshTimes : []);
        setSelectedTime(null);
        setStep(timeStep);
        await showResultModal({
          type: "warning",
          title: "Horário não está mais disponível",
          text: "Escolha outro horário para continuar.",
        });
        return;
      }

      const datetimeSP = dayjs.tz(
        `${dateBase} ${selectedTime}`,
        "YYYY-MM-DD HH:mm",
        TZ
      );

      const userData = localStorage.getItem("user");
      const parsed = userData ? JSON.parse(userData) : null;

      const payload = {
        mode: "appointment",
        app_id: resolvedEstablishment?.app_id || 2,
        entity_name: "establishment",
        entity_id: resolvedEstablishment?.id,
        items: selectedServices.map((service) => ({
          item_id: service.id || service.item_id,
          quantity: 1,
        })),
        client_id: parsed?.id || null,
        customer_name:
          `${parsed?.first_name || ""} ${parsed?.last_name || ""}`.trim() || "Cliente App",
        customer_phone: customerPhone,
        customer_cpf: customerCpf,
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
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw data;

      const message = pickApiSuccessMessage(data);
      const orderId = pickApiOrderId(data);
      const html = `
        <div class="awm-swal">
          <div class="awm-swal__msg">${escapeHtml(message)}</div>
          <div class="awm-swal__title">Resumo do agendamento</div>
          <ul class="awm-swal__list">
            ${
              resolvedEstablishment?.name
                ? `<li><b>Estabelecimento</b>: ${escapeHtml(resolvedEstablishment.name)}</li>`
                : ""
            }
            ${
              resolvedEmployer?.name
                ? `<li><b>Profissional</b>: ${escapeHtml(resolvedEmployer.name)}</li>`
                : ""
            }
            <li><b>Data</b>: ${escapeHtml(dayjs(dateBase).format("DD/MM/YYYY"))}</li>
            <li><b>Horário</b>: ${escapeHtml(selectedTime)}</li>
            ${orderId ? `<li><b>Código</b>: ${escapeHtml(orderId)}</li>` : ""}
            <li><b>Total</b>: ${escapeHtml(fmtBRL(totalValue))}</li>
            <li><b>Duração</b>: ${escapeHtml(totalDuration)} min</li>
          </ul>
        </div>
      `;

      await showResultModal({ type: "success", title: "Agendamento", html });
      onHide?.();
    } catch (error) {
      const { message, fieldMessages } = normalizeApiError(error);
      const html = fieldMessages.length
        ? `
          <div class="awm-swal">
            <div class="awm-swal__msg">${escapeHtml(message)}</div>
            <div class="awm-swal__title">Campos com erro:</div>
            <ul class="awm-swal__list">
              ${fieldMessages
                .map((item) => `<li><b>${escapeHtml(item.field)}</b>: ${escapeHtml(item.message)}</li>`)
                .join("")}
            </ul>
          </div>
        `
        : `<div class="awm-swal"><div class="awm-swal__msg">${escapeHtml(message)}</div></div>`;

      await showResultModal({ type: "error", title: "Erro ao agendar", html });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (loading || loadingDates) return;
    setStep((current) => Math.max(1, current - 1));
  };

  const handleSafeHide = useCallback(() => {
    if (loading || loadingDates) return;
    onHide?.();
  }, [loading, loadingDates, onHide]);

  const footer = (
    <>
      <GlobalButton
        variant="secondary"
        onClick={handleSafeHide}
        disabled={loading || loadingDates}
      >
        Cancelar
      </GlobalButton>

      {step > 1 && (
        <GlobalButton
          variant="secondary"
          onClick={handleBack}
          disabled={loading || loadingDates}
        >
          Voltar
        </GlobalButton>
      )}

      <GlobalButton
        variant="primary"
        onClick={handleNext}
        disabled={loading || loadingDates}
      >
        {step === finalStep ? "Confirmar" : "Avançar"}
      </GlobalButton>
    </>
  );

  return (
    <GlobalModal
      show={show}
      onHide={handleSafeHide}
      size="xl"
      backdrop="static"
      title="Agendamento"
      subtitle={resolvedEstablishment?.name || "Selecione serviços e horário"}
      logoSrc={establishmentLogoSrc}
      footer={footer}
      className="awm-modal awm-modal--fullscreen"
      dialogClassName="awm-modal__dialog"
      contentClassName="awm-modal__content"
    >
      {(loading || loadingDates) && (
        <ProcessingIndicatorComponent
          messages={
            loadingDates
              ? [
                  "Verificando os dias disponíveis...",
                  "Consultando a agenda do profissional...",
                  "Encontrando horários livres...",
                ]
              : [
                  "Processando seu agendamento...",
                  "Verificando disponibilidade...",
                  "Registrando pedido...",
                  "Aguarde só mais um instante...",
                ]
          }
          interval={1100}
          gifSrc="/images/logo.mp4"
        />
      )}

      <div className="awm__root">
        {(resolvedEstablishment || resolvedEmployer) && (
          <div className="awm__summary">
            <div className="awm__summary-left">
              {resolvedEstablishment?.name && (
                <img
                  src={establishmentLogoSrc}
                  alt={resolvedEstablishment.name}
                  className="awm__summary-avatar awm__summary-avatar--est"
                />
              )}

              {resolvedEmployer ? (
                <>
                  <img
                    src={resolveImage(resolvedEmployer, resolvedEmployer.name)}
                    alt={resolvedEmployer.name}
                    className="awm__summary-avatar"
                  />
                  <div className="awm__summary-meta">
                    <div className="awm__summary-label">Profissional selecionado</div>
                    <div className="awm__summary-name">{resolvedEmployer.name}</div>
                  </div>
                </>
              ) : (
                <div className="awm__summary-hint">
                  Selecione um profissional no próximo passo
                </div>
              )}
            </div>

            {resolvedEstablishment?.name && (
              <div className="awm__summary-right">
                <div className="awm__summary-label">Estabelecimento</div>
                <div className="awm__summary-name">{resolvedEstablishment.name}</div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="wizard-step">
            <h4 className="text-center">Escolha os Serviços</h4>
            <div className="grid">
              {services.map((service) => {
                const id = service.id || service.item_id;
                const active = selectedServices.some(
                  (item) => (item.id || item.item_id) === id
                );

                return (
                  <div
                    key={id}
                    className={`card-service ${active ? "active" : ""}`}
                    onClick={() => handleServiceToggle(service)}
                  >
                    <img
                      src={resolveImage(service, service.name)}
                      alt={service.name}
                      className="service-img"
                    />
                    <h5 className="text-white">{service.name}</h5>
                    <p>{fmtBRL(service.price)}</p>
                    <small>{service.duration || 30} min</small>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!hasPreselectedEmployer && step === 2 && (
          <div className="wizard-step">
            <h4 className="text-white text-center">Escolha o Profissional</h4>
            <div className="grid">
              {employers.map((employer) => {
                const active = selectedEmployer?.id === employer.id;

                return (
                  <div
                    key={employer.id}
                    className={`card-emp text-white ${active ? "active" : ""}`}
                    onClick={() => handleEmployerSelect(employer)}
                  >
                    <img
                      src={resolveImage(employer, employer.name)}
                      alt={employer.name}
                      className="emp-avatar aling-center"
                    />
                    <strong>{employer.name}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === dateStep && (
          <GlobalDateCarousel
            selectedDate={selectedDate}
            onChange={setSelectedDate}
            daysToShow={DAYS_TO_CHECK}
            availableDates={availableDates}
            loading={loadingDates}
          />
        )}

        {step === timeStep && (
          <StepTime
            availableTimes={availableTimes}
            selected={selectedTime}
            onChange={setSelectedTime}
            loading={loading}
            title="Escolha o Horário"
            subtitle="Toque em um horário para selecionar"
          />
        )}

        {step === finalStep && (
          <div className="awm__final">
            <p className="awm__totals">
              <b>Total:</b> {fmtBRL(totalValue)} | <b>Duração:</b> {totalDuration} min
            </p>

            <div className="awm__inputs-grid">
              <input
                value={customerCpf}
                onChange={(event) => setCustomerCpf(event.target.value)}
                placeholder="CPF"
                className="awm__input"
              />
              <input
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="Telefone"
                className="awm__input"
              />
            </div>
          </div>
        )}
      </div>
    </GlobalModal>
  );
}
