// src/hooks/useEstablishmentEmployers.js
import { useEffect, useState, useCallback } from "react";
import api from "../services/api";

export default function useEstablishmentEmployers(establishmentSlug) {
  const [employers, setEmployers] = useState([]);
  const [establishment, setEstablishment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const loadEmployers = useCallback(async () => {
    if (!establishmentSlug) return;

    setLoading(true);
    setApiError(null);

    try {
      const res = await api.get(`/employer/list-by-entity/${establishmentSlug}`);

      setEmployers(res.data?.employers || []);
      setEstablishment(res.data?.establishment || null);
    } catch (err) {
      setApiError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Erro ao carregar colaboradores."
      );
      setEmployers([]);
      setEstablishment(null);
    } finally {
      setLoading(false);
    }
  }, [establishmentSlug]);

  useEffect(() => {
    loadEmployers();
  }, [loadEmployers]);

  return {
    employers,
    establishment,
    loading,
    apiError,
    reload: loadEmployers,
  };
}
