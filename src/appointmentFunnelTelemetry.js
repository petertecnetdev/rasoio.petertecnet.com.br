import { trackTelemetryEvent } from "./telemetry";
import { getAppointmentAcquisitionAttribution } from "./utils/appointmentAcquisitionAttribution";
import { safeLocalStorage as localStorage } from "./utils/safeStorage";

const INSTALL_FLAG = "__rasoioAppointmentFunnelTelemetryInstalled";
const WIZARD_SELECTOR = ".awm-modal";

const cleanText = (value, limit = 120) => String(value || "")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, limit);

const parseAppointmentPayload = (init) => {
  if (!init?.body || typeof init.body !== "string") return null;

  try {
    const payload = JSON.parse(init.body);
    return payload?.mode === "appointment" ? payload : null;
  } catch {
    return null;
  }
};

const requestUrl = (input) => {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input?.url || "";
};

const isAppointmentOrderRequest = (input, init) => {
  const method = String(init?.method || input?.method || "GET").toUpperCase();
  if (method !== "POST") return false;

  try {
    const url = new URL(requestUrl(input), window.location.origin);
    return /\/order\/?$/.test(url.pathname) && Boolean(parseAppointmentPayload(init));
  } catch {
    return false;
  }
};

const acquisitionMetadata = () => {
  const attribution = getAppointmentAcquisitionAttribution();
  if (!attribution) return {};

  return {
    acquisition_source: attribution.acquisition_source || undefined,
    utm_source: attribution.utm_source || undefined,
    utm_medium: attribution.utm_medium || undefined,
    utm_campaign: attribution.utm_campaign || undefined,
    utm_content: attribution.utm_content || undefined,
    utm_term: attribution.utm_term || undefined,
  };
};

const appointmentMetadata = (payload, extra = {}) => ({
  establishment_id: payload?.entity_id || undefined,
  attendant_id: payload?.attendant_id || undefined,
  item_count: Array.isArray(payload?.items) ? payload.items.length : 0,
  ...extra,
});

export function installAppointmentFunnelTelemetry() {
  if (typeof window === "undefined" || window[INSTALL_FLAG]) return () => {};
  window[INSTALL_FLAG] = true;

  let wizardOpen = false;
  let confirmationSeen = false;
  let slotStepSeen = false;
  let dateStepSeen = false;

  const emit = (type, details = {}) => trackTelemetryEvent(type, {
    ...details,
    metadata: {
      ...acquisitionMetadata(),
      ...(details.metadata || {}),
    },
  });

  const resetWizardState = () => {
    wizardOpen = false;
    confirmationSeen = false;
    slotStepSeen = false;
    dateStepSeen = false;
  };

  const scanWizard = () => {
    const wizard = document.querySelector(WIZARD_SELECTOR);
    if (!wizard) {
      if (wizardOpen) resetWizardState();
      return;
    }

    if (!wizardOpen) {
      wizardOpen = true;
      emit("rasoio_booking_wizard_opened", { label: "Agendamento iniciado" });
    }

    const text = cleanText(wizard.textContent, 500);
    if (!slotStepSeen && /Escolha o Horário/i.test(text)) {
      slotStepSeen = true;
      emit("rasoio_booking_slot_step_viewed", { label: "Escolha de horário" });
    }

    if (!dateStepSeen && !/Escolha os Serviços|Escolha o Profissional|Escolha o Horário/i.test(text)
      && !wizard.querySelector(".awm__final")) {
      dateStepSeen = true;
      emit("rasoio_booking_date_step_viewed", { label: "Escolha de data" });
    }

    if (!confirmationSeen && wizard.querySelector(".awm__final")) {
      confirmationSeen = true;
      emit("rasoio_booking_confirmation_viewed", { label: "Confirmação aberta" });
    }
  };

  const onClick = (event) => {
    const wizard = event.target?.closest?.(WIZARD_SELECTOR);
    if (!wizard) return;

    const serviceCard = event.target?.closest?.(".card-service");
    if (serviceCard) {
      emit("rasoio_booking_service_selected", {
        label: "Serviço selecionado",
        metadata: { selected: !serviceCard.classList.contains("active") },
      });
      return;
    }

    const employerCard = event.target?.closest?.(".card-emp");
    if (employerCard) {
      emit("rasoio_booking_professional_selected", { label: "Profissional selecionado" });
      return;
    }

    const button = event.target?.closest?.("button,[role='button']");
    if (!button || button.disabled) return;

    const label = cleanText(button.textContent || button.getAttribute("aria-label"));
    if (label === "Confirmar") {
      emit("rasoio_booking_confirmation_submitted", { label: "Confirmar agendamento" });
      return;
    }

    if (label !== "Avançar") return;

    const wizardText = cleanText(wizard.textContent, 500);
    if (/Escolha o Horário/i.test(wizardText)) {
      const authenticated = Boolean(localStorage.getItem("token"));
      emit("rasoio_booking_slot_selected", {
        label: "Horário selecionado",
        metadata: { authenticated },
      });
      if (!authenticated) {
        emit("rasoio_booking_login_required", { label: "Login após escolha de horário" });
      }
    }
  };

  const observer = new MutationObserver(scanWizard);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("click", onClick, true);
  scanWizard();

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function appointmentAwareFetch(input, init = {}) {
    if (!isAppointmentOrderRequest(input, init)) return originalFetch(input, init);

    const payload = parseAppointmentPayload(init);
    const startedAt = Date.now();

    try {
      const response = await originalFetch(input, init);
      emit(response.ok ? "rasoio_booking_created" : "rasoio_booking_create_failed", {
        label: response.ok ? "Agendamento criado" : "Falha ao criar agendamento",
        metadata: appointmentMetadata(payload, {
          status: response.status,
          duration_ms: Date.now() - startedAt,
        }),
      });
      return response;
    } catch (error) {
      emit("rasoio_booking_create_failed", {
        label: "Falha de rede ao criar agendamento",
        metadata: appointmentMetadata(payload, {
          status: "network_error",
          duration_ms: Date.now() - startedAt,
        }),
      });
      throw error;
    }
  };

  return () => {
    observer.disconnect();
    document.removeEventListener("click", onClick, true);
    window.fetch = originalFetch;
    delete window[INSTALL_FLAG];
  };
}
