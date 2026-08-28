// src/services/api.js
import axios from "axios";
import { apiBaseUrl } from "../config";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || apiBaseUrl,
  headers: {
    Accept: "application/json",
  },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  config.headers = config.headers || {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Nunca force Content-Type em FormData. O browser/axios precisa gerar o
  // boundary correto do multipart; isso corrige uploads de avatar, logo,
  // background e imagens de itens em toda a aplicação.
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

      if (hadToken && typeof window !== "undefined") {
        window.dispatchEvent(new Event("authChanged"));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
