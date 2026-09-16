import { safeSessionStorage } from "./safeStorage";

const STORAGE_KEY = "rasoio_owner_activation_v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

let memoryContext = null;

function safeEstablishment(establishment) {
  if (!establishment?.id || !establishment?.slug) return null;

  return {
    id: establishment.id,
    slug: String(establishment.slug),
    name: establishment.name || null,
    fantasy: establishment.fantasy || null,
    city: establishment.city || null,
    uf: establishment.uf || null,
    logo: establishment.logo || null,
    background: establishment.background || null,
    images: establishment.images || null,
  };
}

function safeEmployerId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeContext(context) {
  const establishment = safeEstablishment(context?.establishment);
  const employerId = safeEmployerId(context?.employerId);
  const expiresAt = Number(context?.expiresAt || 0);

  if (!establishment || !expiresAt || expiresAt <= Date.now()) return null;

  return { establishment, employerId, expiresAt };
}

function persistContext(context) {
  memoryContext = context;

  if (typeof window === "undefined") return;
  safeSessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
}

export function startOwnerActivation(establishment) {
  const safe = safeEstablishment(establishment);
  if (!safe) return null;

  const context = {
    establishment: safe,
    expiresAt: Date.now() + MAX_AGE_MS,
  };

  persistContext(context);
  return context;
}

export function setOwnerActivationEmployer(employerId, expectedSlug = null) {
  const safeId = safeEmployerId(employerId);
  if (!safeId) return null;

  const current = getOwnerActivation(expectedSlug);
  if (!current) return null;

  const context = {
    ...current,
    employerId: safeId,
    expiresAt: Date.now() + MAX_AGE_MS,
  };

  persistContext(context);
  return context;
}

export function getOwnerActivation(expectedSlug = null) {
  let context = null;

  if (typeof window !== "undefined") {
    try {
      const raw = safeSessionStorage.getItem(STORAGE_KEY);
      if (raw) context = normalizeContext(JSON.parse(raw));
    } catch {
      // Fall back to the in-memory activation context below when persisted data is malformed.
    }
  }

  context = context || normalizeContext(memoryContext);

  if (!context) {
    clearOwnerActivation();
    return null;
  }

  memoryContext = context;

  if (expectedSlug && context.establishment.slug !== String(expectedSlug)) return null;

  return context;
}

export function clearOwnerActivation() {
  memoryContext = null;

  if (typeof window === "undefined") return;
  safeSessionStorage.removeItem(STORAGE_KEY);
}
