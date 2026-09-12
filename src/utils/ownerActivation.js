const STORAGE_KEY = "rasoio_owner_activation_v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

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

export function startOwnerActivation(establishment) {
  const safe = safeEstablishment(establishment);
  if (!safe || typeof window === "undefined") return null;

  const context = {
    establishment: safe,
    expiresAt: Date.now() + MAX_AGE_MS,
  };

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    return context;
  } catch {
    return null;
  }
}

export function getOwnerActivation(expectedSlug = null) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const context = JSON.parse(raw);
    const establishment = safeEstablishment(context?.establishment);
    const expiresAt = Number(context?.expiresAt || 0);

    if (!establishment || !expiresAt || expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (expectedSlug && establishment.slug !== String(expectedSlug)) return null;

    return { establishment, expiresAt };
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearOwnerActivation() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // The activation flow still works without persistence when storage is blocked.
  }
}
