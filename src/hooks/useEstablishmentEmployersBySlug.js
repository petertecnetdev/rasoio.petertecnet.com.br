import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { appId, appSlug } from "../config";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

const appContextPath = `/v1/apps/${encodeURIComponent(appSlug)}`;

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
        setApiError("Estabelecimento não informado.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setApiError(null);

      try {
        // Resolve ownership through the generic application context. This avoids
        // depending on the numeric legacy app_id to open the team management UI.
        const establishmentResponse = await api.get(
          `${appContextPath}/me/establishments`,
          { signal }
        );

        const ownedEstablishments = Array.isArray(establishmentResponse?.data?.data)
          ? establishmentResponse.data.data
          : [];
        const resolvedEstablishment =
          ownedEstablishments.find(
            (candidate) => String(candidate?.slug || "") === String(slug)
          ) || null;

        if (!resolvedEstablishment) {
          throw new Error(
            "Este estabelecimento não foi encontrado entre os estabelecimentos que você administra na Rasoio."
          );
        }

        // Employer listing still has a compatibility endpoint while the
        // workforce read contract is moved completely to /v1/apps/{app}/.
        const employersResponse = await api.get(
          `/employer/list-by-entity/${encodeURIComponent(slug)}`,
          {
            params: { app_id: appId },
            signal,
          }
        );

        const rawEmployers = Array.isArray(employersResponse?.data?.employers)
          ? employersResponse.data.employers
          : [];

        setEstablishment(resolvedEstablishment);
        setEmployers(rawEmployers);
      } catch (error) {
        if (isRequestCanceled(error) || signal?.aborted) return;

        setApiError(
          error?.message?.startsWith("Este estabelecimento")
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
