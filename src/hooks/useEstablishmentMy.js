// src/hooks/useEstablishmentMy.js
import { useCallback, useEffect, useState } from "react";
import { listManagedEstablishments } from "../services/platformManagementApi";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

export default function useEstablishmentMy() {
  const [establishments, setEstablishments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const fetchEstablishments = useCallback(async (signal) => {
    try {
      setIsLoading(true);
      setApiError(null);
      const items = await listManagedEstablishments(signal ? { signal } : {});
      if (signal?.aborted) return;
      setEstablishments(items);
    } catch (error) {
      if (isRequestCanceled(error) || signal?.aborted) return;
      setEstablishments([]);
      setApiError(
        getApiErrorMessage(error, "Erro ao carregar seus estabelecimentos.")
      );
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchEstablishments(controller.signal);
    return () => controller.abort();
  }, [fetchEstablishments]);

  return {
    establishments,
    isLoading,
    apiError,
    refetch: () => fetchEstablishments(),
  };
}
