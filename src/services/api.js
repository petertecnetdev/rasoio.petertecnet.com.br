// src/services/api.js
import axios from "axios";
import { apiV1BaseUrl, appSlug } from "../config";

const legacyProductPrefix = `/${appSlug}`;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_V1_URL || apiV1BaseUrl,
  headers: {
    Accept: "application/json",
    "X-Peter-App": appSlug,
  },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  if (typeof config.url === "string") {
    if (config.url === legacyProductPrefix) config.url = "/";
    else if (config.url.startsWith(`${legacyProductPrefix}/`)) {
      config.url = config.url.slice(legacyProductPrefix.length);
    }
  }

  const token = localStorage.getItem("token");
  config.headers = config.headers || {};
  config.headers["X-Peter-App"] = appSlug;

  if (token) config.headers.Authorization = `Bearer ${token}`;

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
  (error) => {
    const url = String(error?.config?.url || "");
    const isAuthAttempt = url.includes("/auth/login") || url.includes("/auth/google");

    if (error?.response?.status === 401 && !isAuthAttempt) {
      const hadToken = Boolean(localStorage.getItem("token"));
      localStorage.removeItem("token");
      if (hadToken && typeof window !== "undefined") window.dispatchEvent(new Event("authChanged"));
    }

    return Promise.reject(error);
  }
);

export default api;
