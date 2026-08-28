// src/services/api.js
import axios from "axios";
import { apiBaseUrl } from "../config";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
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
