// src/services/api.js
import axios from "axios";
import { apiBaseUrl } from "../config";

const APP_SLUG = "rasoio";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || apiBaseUrl,
  headers: {
    Accept: "application/json",
    "X-Peter-App": APP_SLUG,
  },
  timeout: 20000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  config.headers = config.headers || {};
  config.headers["X-Peter-App"] = APP_SLUG;
  config.withCredentials = true;

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (window.PeterIdentity) {
    config.headers["X-Peter-Identity-SDK"] = window.PeterIdentity.version;
    config.headers["X-Peter-Device"] = window.PeterIdentity.getDeviceId();
    config.headers["X-Peter-Device-Name"] = window.PeterIdentity.getDeviceName();
  }

  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
    delete config.headers["content-type"];
  } else if (!config.headers["Content-Type"] && !config.headers["content-type"]) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    const url = String(config?.url || "");
    const isAuthAttempt = url.includes("/auth/login") || url.includes("/auth/google");

    if (error?.response?.status === 401 && !isAuthAttempt && config && !config.__peterIdentityRetry && window.PeterIdentity) {
      config.__peterIdentityRetry = true;
      const token = await window.PeterIdentity.recover({ force: true });
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        return api.request(config);
      }
    }

    if (error?.response?.status === 401 && !isAuthAttempt) {
      const hadToken = Boolean(localStorage.getItem("token"));
      window.PeterIdentity?.clearAccessToken?.();
      if (!window.PeterIdentity) localStorage.removeItem("token");
      if (hadToken && typeof window !== "undefined") window.dispatchEvent(new Event("authChanged"));
    }

    return Promise.reject(error);
  }
);

export default api;
