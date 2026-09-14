import axios from "axios";
import { apiV1BaseUrl } from "../config";

const REQUEST_TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 250;

const wait = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const shouldRetry = (error) => {
  const status = Number(error?.response?.status || 0);

  if (!error?.response) return true;
  return status === 408 || status === 429 || status >= 500;
};

const SubscriptionPlanService = {
  async list() {
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const { data } = await axios.get(`${apiV1BaseUrl}/subscription-plans`, {
          timeout: REQUEST_TIMEOUT_MS,
        });
        return data?.data ?? data;
      } catch (error) {
        lastError = error;
        const lastAttempt = attempt >= MAX_ATTEMPTS;

        if (lastAttempt || !shouldRetry(error)) throw error;
        await wait(RETRY_BASE_DELAY_MS * attempt);
      }
    }

    throw lastError;
  },
};

export default SubscriptionPlanService;
