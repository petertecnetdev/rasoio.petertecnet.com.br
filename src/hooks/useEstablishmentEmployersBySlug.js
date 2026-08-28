import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

export default function useEstablishmentEmployersBySlug(slug) {
  const [establishment, setEstablishment] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const load = useCallback(
    async (signal) => {
      if (!slug) {
        setEstablishment(null);
        setEmployers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setApiError(null);

      try {
        const { data } = await api.get(`/employer/list-by-entity/${slug}`, {
          signal,
        });
        setEstablishment(data?.establishment || null);
        setEmployers(Array.isArray(data?.employers) ? data.employers : []);
      } catch (error) {
        if (error?.code === "ERR_CANCELED") return;
        setApiError(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Erro ao carregar barbeiros da equipe."
        );
        setEstablishment(null);
        setEmployers([]);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const refetch = useCallback(() => load(), [load]);

  return {
    establishment,
    employers,
    count: employers.length,
    loading,
    apiError,
    refetch,
  };
}
