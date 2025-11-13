// src/hooks/useHome.js
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function useHome(apiBaseUrl, appId) {
  const [establishments, setEstablishments] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchHomeData() {
      setIsLoading(true);
      setError(null);

      try {
        const [estRes, empRes, itemRes] = await Promise.all([
          axios.get(`${apiBaseUrl}/establishment/home/${appId}`),
          axios.get(`${apiBaseUrl}/employer/home/${appId}`),
          axios.get(`${apiBaseUrl}/item/home/${appId}`),
        ]);

        if (!active) return;

        setEstablishments(estRes.data?.establishments || []);
        setEmployers(empRes.data?.employers || []);
        setItems(itemRes.data?.items || []);
      } catch (err) {
        if (!active) return;
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Erro ao carregar os dados da página inicial.";
        setError(msg);

        Swal.fire({
          icon: "error",
          title: "Erro",
          text: msg,
        });
      } finally {
        if (active) setIsLoading(false);
      }
    }

    if (appId) {
      fetchHomeData();
    } else {
      setError("app_id não fornecido.");
      setIsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [apiBaseUrl, appId]);

  return {
    establishments,
    employers,
    items,
    isLoading,
    error,
  };
}
