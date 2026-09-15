const memoryStorage = new Map();
const memorySessionStorage = new Map();

const normalizeKey = (key) => String(key);
const normalizeValue = (value) => String(value);

const createSafeStorage = (browserStorageName, fallbackStorage, cleanupComment) => ({
  getItem(key) {
    const normalizedKey = normalizeKey(key);

    try {
      const value = window[browserStorageName].getItem(normalizedKey);
      return value ?? (fallbackStorage.has(normalizedKey) ? fallbackStorage.get(normalizedKey) : null);
    } catch {
      return fallbackStorage.has(normalizedKey) ? fallbackStorage.get(normalizedKey) : null;
    }
  },

  setItem(key, value) {
    const normalizedKey = normalizeKey(key);
    const normalizedValue = normalizeValue(value);

    fallbackStorage.set(normalizedKey, normalizedValue);

    try {
      window[browserStorageName].setItem(normalizedKey, normalizedValue);
    } catch {
      // Some browsers, PWAs and WebViews can deny storage access. The in-memory
      // fallback keeps the current conversion flow alive without weakening auth.
    }
  },

  removeItem(key) {
    const normalizedKey = normalizeKey(key);
    fallbackStorage.delete(normalizedKey);

    try {
      window[browserStorageName].removeItem(normalizedKey);
    } catch {
      // Best-effort cleanup: storage failures must never block a conversion flow.
      void cleanupComment;
    }
  },
});

export const safeLocalStorage = createSafeStorage("localStorage", memoryStorage, "paid activation");
export const safeSessionStorage = createSafeStorage("sessionStorage", memorySessionStorage, "deferred booking");
