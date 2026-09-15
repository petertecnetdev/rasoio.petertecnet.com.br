import api from "./api";
import { trackTelemetryEvent } from "../telemetry";
import {
  safeLocalStorage as localStorage,
  safeSessionStorage as sessionStorage,
} from "../utils/safeStorage";

const APPLICATION = "rasoio";
const SOURCE = "subscription_plans";
const REQUEST_TIMEOUT_MS = 10000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 250;
const MAX_RETURN_TO_LENGTH = 1000;
const RECOVERED_RETURN_TO_KEY = `subscription_recovery_return_to:${APPLICATION}`;
const inMemoryIdempotencyKeys = new Map();
const TERMINAL_PAYMENT_STATUSES = new Set([
  "cancelled",
  "canceled",
  "expired",
  "failed",
  "rejected",
  "refunded",
  "charged_back",
  "chargeback",
]);

const storageKey = (planCode) =>
  `subscription_intent_idempotency:${APPLICATION}:${planCode}`;

const checkoutStorageKey = (intentId) =>
  `subscription_checkout_idempotency:${APPLICATION}:${intentId}`;

const createKey = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const wait = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const shouldRetry = (error) => {
  const status = Number(error?.response?.status || 0);

  if (!error?.response) return true;
  return status === 408 || status === 429 || status >= 500;
};

const httpStatus = (error) => Number(error?.response?.status || 0) || "network";

const trackRevenue = (type, metadata = {}) => {
  trackTelemetryEvent(type, {
    label: "Assinatura Rasoio",
    target: "subscription",
    metadata: {
      application: APPLICATION,
      ...metadata,
    },
  });
};

const normalizeStatus = (value) => String(value || "").trim().toLowerCase();

const safeReturnTo = (value) => {
  const candidate = String(value || "").trim();
  if (!candidate || candidate.length > MAX_RETURN_TO_LENGTH) return "";
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return "";
  if ([...candidate].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  })) return "";

  try {
    const target = new URL(candidate, window.location.origin);
    if (target.origin !== window.location.origin || target.pathname === "/planos") return "";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "";
  }
};

const postSubscriptionDestination = (returnTo = "") => {
  const safe = safeReturnTo(returnTo);
  if (!safe) return "/dashboard?subscription=active";

  const target = new URL(safe, window.location.origin);
  target.searchParams.set("subscription", "active");
  return `${target.pathname}${target.search}${target.hash}`;
};

const readRecoveredReturnTo = () => {
  try {
    return safeReturnTo(sessionStorage.getItem(RECOVERED_RETURN_TO_KEY));
  } catch {
    return "";
  }
};

const persistRecoveredReturnTo = (value) => {
  const safe = safeReturnTo(value);
  if (!safe) return "";

  try {
    sessionStorage.setItem(RECOVERED_RETURN_TO_KEY, safe);
  } catch {
    // The current URL still carries the context when session storage is unavailable.
  }

  return safe;
};

const clearRecoveredReturnTo = () => {
  try {
    sessionStorage.removeItem(RECOVERED_RETURN_TO_KEY);
  } catch {
    // Nothing else is required when session storage is unavailable.
  }
};

const returnToFromLocation = () => {
  const params = new URLSearchParams(window.location.search);
  return safeReturnTo(params.get("return_to"));
};

const restoreReturnToFromIntent = (intent) => {
  const currentReturnTo = returnToFromLocation();
  if (currentReturnTo) {
    persistRecoveredReturnTo(currentReturnTo);
    return "url";
  }

  const returnTo = persistRecoveredReturnTo(intent?.metadata?.return_to);
  if (!returnTo) return "";

  try {
    const url = new URL(window.location.href);
    url.searchParams.set("return_to", returnTo);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    return "intent_metadata";
  } catch {
    return "session_recovery";
  }
};

const getRecoveryReturnTo = (pending = null) =>
  returnToFromLocation() || safeReturnTo(pending?.return_to) || readRecoveredReturnTo();

const persistPendingReturnTo = (planCode, returnTo) => {
  const safe = safeReturnTo(returnTo);
  if (!safe) return;

  persistRecoveredReturnTo(safe);

  try {
    const pending = JSON.parse(localStorage.getItem("pending_subscription_plan") || "null");
    if (pending?.application !== APPLICATION || pending?.plan !== planCode) return;

    localStorage.setItem(
      "pending_subscription_plan",
      JSON.stringify({ ...pending, return_to: safe })
    );
  } catch {
    // Recovery still works from the current URL when storage is unavailable.
  }
};

const terminalPaymentStatus = (data) => {
  const candidates = [
    data?.payment?.status,
    data?.intent?.status,
    data?.subscription?.status,
    data?.status,
  ].map(normalizeStatus).filter(Boolean);

  return candidates.find((status) => TERMINAL_PAYMENT_STATUSES.has(status)) || "";
};

const removeSessionKey = (key) => {
  inMemoryIdempotencyKeys.delete(key);

  try {
    sessionStorage.removeItem(key);
  } catch {
    // In-memory cleanup is enough when browser storage is blocked.
  }
};

const removePendingSubscription = () => {
  try {
    localStorage.removeItem("pending_subscription_plan");
  } catch {
    // Recovery can continue from intent metadata/current URL when storage is blocked.
  }
};

const recoverFromTerminalPayment = (intentId, status) => {
  let pending = null;

  try {
    pending = JSON.parse(localStorage.getItem("pending_subscription_plan") || "null");
  } catch {
    pending = null;
  }

  const planCode = String(pending?.plan || "").trim().toLowerCase();
  const validPlanCode = /^[a-z0-9_-]{1,80}$/i.test(planCode);
  const referral = String(pending?.referral || "").trim();
  const campaign = String(pending?.campaign || "").trim();
  const returnTo = getRecoveryReturnTo(pending);
  const returnToSource = returnTo
    ? (returnToFromLocation()
      ? "url"
      : safeReturnTo(pending?.return_to)
        ? "pending_subscription"
        : "recovered_session")
    : undefined;

  removeSessionKey(checkoutStorageKey(intentId));
  if (validPlanCode) removeSessionKey(storageKey(planCode));
  removePendingSubscription();

  trackRevenue("subscription_payment_recovery_started", {
    method: "pix",
    terminal_status: status,
    plan: validPlanCode ? planCode : undefined,
    referral: referral || undefined,
    campaign: campaign || undefined,
    return_to_preserved: Boolean(returnTo),
    return_to_source: returnToSource,
  });

  if (validPlanCode) {
    const params = new URLSearchParams({
      plan: planCode,
      resume: "1",
      source: "payment_recovery",
    });
    if (referral) params.set("ref", referral.slice(0, 80));
    if (campaign) params.set("utm_campaign", campaign.slice(0, 80));
    if (returnTo) params.set("return_to", returnTo);

    window.location.assign(`/planos?${params.toString()}`);
  }
};

const readPendingAttribution = (planCode) => {
  try {
    const pending = JSON.parse(localStorage.getItem("pending_subscription_plan") || "null");
    if (pending?.application !== APPLICATION || pending?.plan !== planCode) return {};

    return {
      referral: String(pending?.referral || "").trim(),
      campaign: String(pending?.campaign || "").trim(),
      returnTo: safeReturnTo(pending?.return_to) || readRecoveredReturnTo(),
    };
  } catch {
    return { returnTo: readRecoveredReturnTo() };
  }
};

const getOrCreateSessionKey = (key) => {
  const inMemoryKey = inMemoryIdempotencyKeys.get(key);
  if (inMemoryKey) return inMemoryKey;

  try {
    const existing = sessionStorage.getItem(key);
    if (existing) {
      inMemoryIdempotencyKeys.set(key, existing);
      return existing;
    }
  } catch {
    // Continue with an in-memory key when sessionStorage is blocked/unavailable.
  }

  const created = createKey();
  inMemoryIdempotencyKeys.set(key, created);

  try {
    sessionStorage.setItem(key, created);
  } catch {
    // The in-memory copy still keeps retries idempotent for the current page lifecycle.
  }

  return created;
};

export function getSubscriptionIntentIdempotencyKey(planCode) {
  return getOrCreateSessionKey(storageKey(planCode));
}

export async function getRecoverableSubscriptionIntent() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const { data } = await api.get(
        `/v1/apps/${APPLICATION}/subscription-intents/recoverable`,
        { timeout: REQUEST_TIMEOUT_MS }
      );

      const intent = data?.data || null;
      if (intent) {
        const returnToSource = restoreReturnToFromIntent(intent);
        const recoveredReturnTo = returnToFromLocation()
          || safeReturnTo(intent?.metadata?.return_to)
          || readRecoveredReturnTo();

        trackRevenue("subscription_intent_recovered", {
          plan: intent.plan_code,
          status: intent.status,
          source: intent.source,
          price_cents: intent.price_cents,
          return_to_preserved: Boolean(returnToSource),
          return_to_source: returnToSource || undefined,
          attempt,
        });

        const synced = await syncSubscriptionPayment(intent.id);
        const subscriptionActive = synced?.subscription?.status === "active";
        const entitlementActive = synced?.entitlement?.status === "active";

        if (subscriptionActive && entitlementActive) {
          removePendingSubscription();
          trackRevenue("subscription_recovered_activation_completed", {
            method: "pix",
            plan: intent.plan_code,
            recovery_scope: "remote_identity",
            return_to_preserved: Boolean(recoveredReturnTo),
          });
          window.location.assign(postSubscriptionDestination(recoveredReturnTo));
          return null;
        }

        trackRevenue("subscription_recovered_intent_resumable", {
          method: "pix",
          plan: intent.plan_code,
          status: synced?.intent?.status || synced?.payment?.status || intent.status,
          recovery_scope: "remote_identity",
        });
      }

      return intent;
    } catch (error) {
      const lastAttempt = attempt >= MAX_ATTEMPTS;
      if (lastAttempt || !shouldRetry(error)) {
        trackRevenue("subscription_recovery_failed", {
          http_status: httpStatus(error),
          retryable: shouldRetry(error),
          attempt,
        });
        return null;
      }
      await wait(RETRY_DELAY_MS * attempt);
    }
  }

  return null;
}

export async function createSubscriptionIntent({
  planCode,
  priceCents = null,
  currency = "BRL",
  source = SOURCE,
  handoff = "app",
  page,
  referral = "",
  campaign = "",
}) {
  const token = localStorage.getItem("token");
  const normalizedPlanCode = String(planCode || "").trim();

  if (!token || !/^[a-z0-9_-]{1,80}$/i.test(normalizedPlanCode)) return null;

  const pendingAttribution = readPendingAttribution(normalizedPlanCode);
  const resolvedReferral = String(referral || pendingAttribution.referral || "").trim();
  const resolvedCampaign = String(campaign || pendingAttribution.campaign || "").trim();
  const resolvedReturnTo = returnToFromLocation() || pendingAttribution.returnTo || "";
  const idempotencyKey = getSubscriptionIntentIdempotencyKey(normalizedPlanCode);
  const metadata = {
    client_price_cents: priceCents,
    currency,
    page: page || window.location.pathname,
  };

  if (resolvedReferral) metadata.referral = resolvedReferral;
  if (resolvedCampaign) metadata.campaign = resolvedCampaign;
  if (resolvedReturnTo) {
    metadata.return_to = resolvedReturnTo;
    persistPendingReturnTo(normalizedPlanCode, resolvedReturnTo);
  }

  const payload = {
    plan_code: normalizedPlanCode,
    source,
    handoff_channel: handoff,
    metadata,
  };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const { data } = await api.post(
        `/v1/apps/${APPLICATION}/subscription-intents`,
        payload,
        {
          headers: { "Idempotency-Key": idempotencyKey },
          timeout: REQUEST_TIMEOUT_MS,
        }
      );

      const intent = data?.data || null;
      if (intent) {
        trackRevenue("subscription_intent_created", {
          plan: normalizedPlanCode,
          status: intent.status,
          source,
          price_cents: intent.price_cents ?? priceCents,
          currency: intent.currency || currency,
          referral: resolvedReferral || undefined,
          campaign: resolvedCampaign || undefined,
          return_to_preserved: Boolean(resolvedReturnTo),
          attempt,
        });
      } else {
        trackRevenue("subscription_intent_failed", {
          plan: normalizedPlanCode,
          source,
          reason: "empty_response",
          attempt,
        });
      }

      return intent;
    } catch (error) {
      const lastAttempt = attempt >= MAX_ATTEMPTS;
      if (lastAttempt || !shouldRetry(error)) {
        trackRevenue("subscription_intent_failed", {
          plan: normalizedPlanCode,
          source,
          http_status: httpStatus(error),
          retryable: shouldRetry(error),
          attempt,
        });
        return null;
      }
      await wait(RETRY_DELAY_MS * attempt);
    }
  }

  return null;
}

export async function createSubscriptionPixCheckout(intentId) {
  const normalizedIntentId = String(intentId || "").trim();
  if (!normalizedIntentId) return null;

  const idempotencyKey = getOrCreateSessionKey(checkoutStorageKey(normalizedIntentId));

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const { data } = await api.post(
        `/v1/apps/${APPLICATION}/subscription-intents/${encodeURIComponent(normalizedIntentId)}/checkout`,
        { method: "pix" },
        {
          headers: { "Idempotency-Key": idempotencyKey },
          timeout: REQUEST_TIMEOUT_MS,
        }
      );

      if (data?.payment?.pix?.qr_code) {
        trackRevenue("subscription_checkout_ready", {
          method: "pix",
          status: data?.payment?.status || data?.intent?.status || "ready",
          attempt,
        });
      } else {
        trackRevenue("subscription_checkout_failed", {
          method: "pix",
          reason: "missing_pix_payload",
          attempt,
        });
      }

      return data || null;
    } catch (error) {
      const lastAttempt = attempt >= MAX_ATTEMPTS;
      if (lastAttempt || !shouldRetry(error)) {
        trackRevenue("subscription_checkout_failed", {
          method: "pix",
          http_status: httpStatus(error),
          retryable: shouldRetry(error),
          attempt,
        });
        return null;
      }
      await wait(RETRY_DELAY_MS * attempt);
    }
  }

  return null;
}

export async function syncSubscriptionPayment(intentId) {
  const normalizedIntentId = String(intentId || "").trim();
  if (!normalizedIntentId) return null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const { data } = await api.post(
        `/v1/apps/${APPLICATION}/subscription-intents/${encodeURIComponent(normalizedIntentId)}/sync`,
        {},
        { timeout: REQUEST_TIMEOUT_MS }
      );

      const subscriptionStatus = data?.subscription?.status || "";
      const entitlementStatus = data?.entitlement?.status || "";
      if (subscriptionStatus === "active" && entitlementStatus === "active") {
        clearRecoveredReturnTo();
        trackRevenue("subscription_activated", {
          method: "pix",
          subscription_status: subscriptionStatus,
          entitlement_status: entitlementStatus,
          attempt,
        });
        return data || null;
      }

      const terminalStatus = terminalPaymentStatus(data);
      if (terminalStatus) {
        recoverFromTerminalPayment(normalizedIntentId, terminalStatus);
      }

      return data || null;
    } catch (error) {
      const lastAttempt = attempt >= MAX_ATTEMPTS;
      if (lastAttempt || !shouldRetry(error)) {
        trackRevenue("subscription_sync_failed", {
          method: "pix",
          http_status: httpStatus(error),
          retryable: shouldRetry(error),
          attempt,
        });
        return error?.response?.data || null;
      }

      trackRevenue("subscription_sync_retry", {
        method: "pix",
        http_status: httpStatus(error),
        attempt,
      });
      await wait(RETRY_DELAY_MS * attempt);
    }
  }

  return null;
}