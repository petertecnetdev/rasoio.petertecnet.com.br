const STORAGE_KEY = "rasoio:appointment-acquisition-attribution";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

const trimParam = (value, max = 160) => String(value || "").trim().slice(0, max) || null;

const readStoredAttribution = () => {
  if (typeof window === "undefined") return null;

  try {
    const stored = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "null");
    const capturedAt = Date.parse(stored?.acquisition_captured_at || "");

    if (!stored || !Number.isFinite(capturedAt) || Date.now() - capturedAt > TTL_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return stored;
  } catch {
    try { window.sessionStorage.removeItem(STORAGE_KEY); } catch {}
    return null;
  }
};

const captureAttribution = () => {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const attribution = {
    utm_source: trimParam(params.get("utm_source")),
    utm_medium: trimParam(params.get("utm_medium")),
    utm_campaign: trimParam(params.get("utm_campaign")),
    utm_content: trimParam(params.get("utm_content")),
    utm_term: trimParam(params.get("utm_term")),
    acquisition_source: trimParam(params.get("source") || params.get("referral") || params.get("ref")),
    acquisition_landing: trimParam(`${window.location.pathname}${window.location.search}`, 1000),
    acquisition_captured_at: new Date().toISOString(),
  };

  const hasSignal = Boolean(
    attribution.acquisition_source ||
      attribution.utm_source ||
      attribution.utm_medium ||
      attribution.utm_campaign ||
      attribution.utm_content ||
      attribution.utm_term
  );

  if (!hasSignal) return readStoredAttribution();

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Booking must remain usable when browser storage is unavailable.
  }

  return attribution;
};

const isAppointmentOrderRequest = (input, init) => {
  const method = String(init?.method || (typeof input !== "string" ? input?.method : "") || "GET").toUpperCase();
  if (method !== "POST") return false;

  const url = typeof input === "string" ? input : input?.url;
  if (!url) return false;

  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.pathname.endsWith("/order");
  } catch {
    return false;
  }
};

export const installAppointmentAcquisitionAttribution = () => {
  if (typeof window === "undefined" || typeof window.fetch !== "function") return;
  if (window.__rasoioAppointmentAttributionInstalled) return;

  window.__rasoioAppointmentAttributionInstalled = true;
  captureAttribution();

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    if (!isAppointmentOrderRequest(input, init) || typeof init.body !== "string") {
      return originalFetch(input, init);
    }

    try {
      const payload = JSON.parse(init.body);
      if (payload?.mode !== "appointment" || payload?.acquisition_attribution) {
        return originalFetch(input, init);
      }

      const attribution = captureAttribution() || readStoredAttribution();
      if (!attribution) return originalFetch(input, init);

      return originalFetch(input, {
        ...init,
        body: JSON.stringify({ ...payload, acquisition_attribution: attribution }),
      });
    } catch {
      return originalFetch(input, init);
    }
  };
};
