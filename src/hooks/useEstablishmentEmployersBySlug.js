import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { appId } from "../config";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

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
        const [establishmentResponse, employersResponse] = await Promise.all([
          api.get(`/establishment/view/${encodeURIComponent(slug)}`, {
            params: { app_id: appId },
            signal,
          }),
          api.get(`/employer/list-by-entity/${encodeURIComponent(slug)}`, {
            params: { app_id: appId },
            signal,
          }),
        ]);

        const resolvedEstablishment = establishmentResponse?.data?.establishment || null;

        if (
          !resolvedEstablishment ||
          Number(resolvedEstablishment.app_id) !== Number(appId)
        ) {
          throw new Error("Esta barbearia não pertence ao aplicativo Rasoio.");
        }

        const rawEmployers = Array.isArray(employersResponse?.data?.employers)
          ? employersResponse.data.employers
          : [];

        const scopedEmployers = rawEmployers.filter((employer) => {
          const employerAppId = employer?.establishment?.app_id;
          return employerAppId == null || Number(employerAppId) === Number(appId);
        });

        setEstablishment(resolvedEstablishment);
        setEmployers(scopedEmployers);
      } catch (error) {
        if (isRequestCanceled(error) || signal?.aborted) return;

        setApiError(
          error?.message === "Esta barbearia não pertence ao aplicativo Rasoio."
            ? error.message
            : getApiErrorMessage(error, "Erro ao carregar colaboradores da equipe.")
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
