const memoryStorage = new Map();

const normalizeKey = (key) => String(key);
const normalizeValue = (value) => String(value);

export const safeLocalStorage = {
  getItem(key) {
    const normalizedKey = normalizeKey(key);

    try {
      return window.localStorage.getItem(normalizedKey);
    } catch {
      return memoryStorage.has(normalizedKey) ? memoryStorage.get(normalizedKey) : null;
    }
  },

  setItem(key, value) {
    const normalizedKey = normalizeKey(key);
    const normalizedValue = normalizeValue(value);

    memoryStorage.set(normalizedKey, normalizedValue);

    try {
      window.localStorage.setItem(normalizedKey, normalizedValue);
    } catch {
      // Some browsers, PWAs and WebViews can deny storage access. The in-memory
      // fallback keeps the current purchase flow alive without weakening auth.
    }
  },

  removeItem(key) {
    const normalizedKey = normalizeKey(key);
    memoryStorage.delete(normalizedKey);

    try {
      window.localStorage.removeItem(normalizedKey);
    } catch {
      // Best-effort cleanup: storage failures must never block paid activation.
    }
  },
};
