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
        value
          .filter(Boolean)
          .forEach((m) => fieldMessages.push({ field, message: String(m) }));
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

const pickApiSuccessMessage = (data) => {
  return (
    data?.message ||
    data?.msg ||
    data?.data?.message ||
    data?.data?.msg ||
    "Agendamento registrado com sucesso!"
  );
};

const pickApiOrderId = (data) => {
  return (
    data?.id ||
    data?.order_id ||
    data?.data?.id ||
    data?.data?.order_id ||
    data?.order?.id ||
    data?.data?.order?.id ||
    null
  );
};

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
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customerCpf, setCustomerCpf] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const hasPreselectedEmployer = !!preselectedEmployer;
  const finalStep = hasPreselectedEmployer ? 4 : 5;

  const resolvedEmployer = selectedEmployer || preselectedEmployer || null;

  // ✅ FIX: resolve estabelecimento mesmo quando abrir via employer
  const resolvedEstablishment = useMemo(() => {
    return (
      establishment ||
      preselectedEmployer?.establishment ||
      resolvedEmployer?.establishment ||
      null
    );
  }, [establishment, preselectedEmployer, resolvedEmployer]);

  // ✅ CORREÇÃO PRINCIPAL:
  // Se trocar employer, APAGA horários e horário selecionado (evita agendar com horário errado)
  useEffect(() => {
    if (!show) return;

    setSelectedTime(null);
    setAvailableTimes([]);

    // se já estava no step horário ou confirmação, volta para o step de data,
    // para obrigar o usuário recarregar horários do employer correto
    const stepDate = hasPreselectedEmployer ? 2 : 3;
    if (step >= stepDate + 1) {
      setStep(stepDate);
    }
  }, [resolvedEmployer?.id]); // ✅ quando muda o employer

  // ✅ Se trocar a data, zera horário também
  useEffect(() => {
    if (!show) return;
    setSelectedTime(null);
    setAvailableTimes([]);
  }, [selectedDate]);

  // ✅ Segurança: se lista de horários mudou e não contém o horário selecionado, apaga
  useEffect(() => {
    if (!selectedTime) return;

    const safe = Array.isArray(availableTimes) ? availableTimes : [];
    if (!safe.includes(selectedTime)) {
      setSelectedTime(null);
    }
  }, [availableTimes, selectedTime]);

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

      for (const p of paths) {
        const url = imageUrl ? imageUrl(p) : imgUrl(p);
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
        const c = document.querySelector(".awm-swal-container");
        if (c) c.style.zIndex = "2147483647";
      },
    });
  }, []);

  useEffect(() => {
    if (!show) return;

    setStep(1);

    const sid =
      preselectedServiceId ||
      preselectedService?.id ||
      preselectedService?.item_id ||
      null;

    if (sid && services.length) {
      const serviceFromList = services.find(
        (s) => Number(s.id || s.item_id) === Number(sid)
      );
      setSelectedServices(serviceFromList ? [serviceFromList] : []);
    } else {
      setSelectedServices([]);
    }

    setSelectedEmployer(preselectedEmployer || null);
    setSelectedDate(null);
    setAvailableTimes([]);
    setSelectedTime(null);
    setLoading(false);

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

  const totalDuration = useMemo(
    () =>
      selectedServices.reduce(
        (sum, s) => sum + (parseInt(s.duration, 10) || 30),
        0
      ),
    [selectedServices]
  );

  const totalValue = useMemo(
    () =>
      selectedServices.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0),
    [selectedServices]
  );

  const handleServiceToggle = useCallback((service) => {
    const id = service.id || service.item_id;
    setSelectedServices((prev) => {
      const exists = prev.some((s) => (s.id || s.item_id) === id);
      if (exists) return prev.filter((s) => (s.id || s.item_id) !== id);
      return [...prev, service];
    });
  }, []);

  const fmtBRL = (v) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

  const handleNext = async () => {
    if (loading) return;

    if (step === 1) {
      if (!selectedServices.length) return;
      setStep(2);
      return;
    }

    if (!hasPreselectedEmployer && step === 2) {
      if (!selectedEmployer) return;
      setStep(3);
      return;
    }

    if (step === (hasPreselectedEmployer ? 2 : 3)) {
      if (!selectedDate) return;

      try {
        setLoading(true);

        // ✅ antes de carregar de novo, limpa seleção
        setSelectedTime(null);
        setAvailableTimes([]);

        const dateSP = dayjs(selectedDate).format("YYYY-MM-DD");
        const times = await loadAvailableTimes(dateSP, resolvedEmployer, totalDuration);

        setAvailableTimes(Array.isArray(times) ? times : []);
        setStep((prev) => prev + 1);
      } catch (e) {
        await showResultModal({
          type: "error",
          title: "Erro ao carregar horários",
          text: e?.message || "Não foi possível carregar os horários disponíveis.",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === (hasPreselectedEmployer ? 3 : 4)) {
      if (!selectedTime) return;
      setStep(finalStep);
      return;
    }

    if (step === finalStep) {
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

        const dateBase =
          typeof selectedDate === "string"
            ? selectedDate
            : dayjs(selectedDate).format("YYYY-MM-DD");

        const datetimeSP = dayjs.tz(
          `${dateBase} ${selectedTime}`,
          "YYYY-MM-DD HH:mm",
          "America/Sao_Paulo"
        );

        const userData = localStorage.getItem("user");
        const parsed = userData ? JSON.parse(userData) : null;

        const payload = {
          mode: "appointment",
          app_id: resolvedEstablishment?.app_id || 2,
          entity_name: "establishment",
          entity_id: resolvedEstablishment?.id,
          items: selectedServices.map((s) => ({
            item_id: s.id || s.item_id,
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
        const res = await fetch(`${apiBaseUrl}/order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw data;

        const msg = pickApiSuccessMessage(data);
        const orderId = pickApiOrderId(data);

        const html = `
          <div class="awm-swal">
            <div class="awm-swal__msg">${escapeHtml(msg)}</div>

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

        await showResultModal({
          type: "success",
          title: "Agendamento",
          html,
        });

        onHide?.();
      } catch (e) {
        const { message, fieldMessages } = normalizeApiError(e);

        const html = fieldMessages.length
          ? `
            <div class="awm-swal">
              <div class="awm-swal__msg">${escapeHtml(message)}</div>
              <div class="awm-swal__title">Campos com erro:</div>
              <ul class="awm-swal__list">
                ${fieldMessages
                  .map((x) => `<li><b>${escapeHtml(x.field)}</b>: ${escapeHtml(x.message)}</li>`)
                  .join("")}
              </ul>
            </div>
          `
          : `<div class="awm-swal"><div class="awm-swal__msg">${escapeHtml(message)}</div></div>`;

        await showResultModal({
          type: "error",
          title: "Erro ao agendar",
          html,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSafeHide = useCallback(() => {
    if (loading) return;
    onHide?.();
  }, [loading, onHide]);

  const footer = (
    <>
      <GlobalButton variant="secondary" onClick={handleSafeHide} disabled={loading}>
        Cancelar
      </GlobalButton>

      {step > 1 && (
        <GlobalButton variant="secondary" onClick={handleBack} disabled={loading}>
          Voltar
        </GlobalButton>
      )}

      <GlobalButton variant="primary" onClick={handleNext} disabled={loading}>
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
      subtitle={
        resolvedEstablishment?.name
          ? resolvedEstablishment.name
          : "Selecione serviços e horário"
      }
      logoSrc={establishmentLogoSrc}
      footer={footer}
      className="awm-modal awm-modal--fullscreen"
      dialogClassName="awm-modal__dialog"
      contentClassName="awm-modal__content"
    >
      {loading && (
        <ProcessingIndicatorComponent
          messages={[
            "Processando seu agendamento...",
            "Verificando disponibilidade...",
            "Registrando pedido...",
            "Aguarde só mais um instante...",
          ]}
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
                <div className="awm__summary-hint">Selecione um profissional no próximo passo</div>
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
              {services.map((s) => {
                const id = s.id || s.item_id;
                const active = selectedServices.some((x) => (x.id || x.item_id) === id);

                return (
                  <div
                    key={id}
                    className={`card-service ${active ? "active" : ""}`}
                    onClick={() => handleServiceToggle(s)}
                  >
                    <img src={resolveImage(s, s.name)} alt={s.name} className="service-img" />
                    <h5 className="text-white">{s.name}</h5>
                    <p>{fmtBRL(s.price)}</p>
                    <small>{s.duration || 30} min</small>
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
              {employers.map((e) => {
                const active = selectedEmployer?.id === e.id;

                return (
                  <div
                    key={e.id}
                    className={`card-emp text-white ${active ? "active" : ""}`}
                    onClick={() => {
                      // ✅ AO TROCAR EMPLOYER, ZERA HORÁRIO ANTERIOR
                      setSelectedEmployer(e);
                      setSelectedTime(null);
                      setAvailableTimes([]);
                    }}
                  >
                    <img
                      src={resolveImage(e, e.name)}
                      alt={e.name}
                      className="emp-avatar aling-center"
                    />
                    <strong>{e.name}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === (hasPreselectedEmployer ? 2 : 3) && (
          <GlobalDateCarousel
            selectedDate={selectedDate}
            onChange={setSelectedDate}
            daysToShow={14}
          />
        )}

        {step === (hasPreselectedEmployer ? 3 : 4) && (
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
                onChange={(e) => setCustomerCpf(e.target.value)}
                placeholder="CPF"
                className="awm__input"
              />
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
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
