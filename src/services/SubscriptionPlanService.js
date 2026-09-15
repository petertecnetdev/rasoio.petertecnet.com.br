import axios from "axios";
import { apiV1BaseUrl } from "../config";
import { safeLocalStorage as localStorage } from "../utils/safeStorage";

const REQUEST_TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 250;
const CATALOG_CACHE_KEY = "rasoio_subscription_plans_catalog";
const CATALOG_CACHE_TTL_MS = 10 * 60 * 1000;

const wait = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const shouldRetry = (error) => {
  const status = Number(error?.response?.status || 0);

  if (!error?.response) return true;
  return status === 408 || status === 429 || status >= 500;
};

const isValidCatalog = (catalog) =>
  Boolean(catalog && Array.isArray(catalog.plans) && catalog.plans.length > 0);

const writeCatalogCache = (catalog) => {
  if (!isValidCatalog(catalog)) return;

  localStorage.setItem(
    CATALOG_CACHE_KEY,
    JSON.stringify({ cached_at: Date.now(), catalog })
  );
};

const readFreshCatalogCache = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY) || "null");
    const cachedAt = Number(cached?.cached_at || 0);
    const fresh = cachedAt > 0 && Date.now() - cachedAt <= CATALOG_CACHE_TTL_MS;

    if (!fresh || !isValidCatalog(cached?.catalog)) return null;
    return cached.catalog;
  } catch {
    return null;
  }
};

const SubscriptionPlanService = {
  async list() {
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const { data } = await axios.get(`${apiV1BaseUrl}/subscription-plans`, {
          timeout: REQUEST_TIMEOUT_MS,
        });
        const catalog = data?.data ?? data;
        writeCatalogCache(catalog);
        return catalog;
      } catch (error) {
        lastError = error;
        const lastAttempt = attempt >= MAX_ATTEMPTS;

        if (!shouldRetry(error)) throw error;
        if (!lastAttempt) {
          await wait(RETRY_BASE_DELAY_MS * attempt);
          continue;
        }

        const cachedCatalog = readFreshCatalogCache();
        if (cachedCatalog) return cachedCatalog;
      }
    }

    throw lastError;
  },
};

export default SubscriptionPlanService;
