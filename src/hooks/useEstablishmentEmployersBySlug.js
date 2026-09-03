import { useEffect, useState } from "react";
import api from "../services/api";
import { appId, appSlug } from "../config";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

const appContextPath = `/v1/apps/${encodeURIComponent(appSlug)}`;

async function requestTeamData(slug, signal) {
  if (!slug) {
    throw new Error("Estabelecimento não informado.");
  }

  const establishmentResponse = await api.get(
    `${appContextPath}/me/establishments`,
    { signal }
  );

  const ownedEstablishments = Array.isArray(establishmentResponse?.data?.data)
    ? establishmentResponse.data.data
    : [];

  const establishment =
    ownedEstablishments.find(
      (candidate) => String(candidate?.slug || "") === String(slug)
    ) || null;

  if (!establishment) {
    throw new Error(
      "Este estabelecimento não foi encontrado entre os estabelecimentos que você administra na Rasoio."
    );
  }

  // Workforce read still uses the compatibility endpoint while the generic
  // /v1/apps/{application}/team-members read contract is being completed.
  const employersResponse = await api.get(
    `/employer/list-by-entity/${encodeURIComponent(slug)}`,
    {
      params: { app_id: appId },
      signal,
    }
  );

  const employers = Array.isArray(employersResponse?.data?.employers)
    ? employersResponse.data.employers
    : [];

  return { establishment, employers };
}

function resolveLoadError(error) {
  if (error?.message === "Estabelecimento não informado.") {
    return error.message;
  }

  if (error?.message?.startsWith("Este estabelecimento")) {
    return error.message;
  }

  return getApiErrorMessage(error, "Erro ao carregar colaboradores da equipe.");
}

export default function useEstablishmentEmployersBySlug(slug) {
  const [establishment, setEstablishment] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setApiError(null);

    requestTeamData(slug, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setEstablishment(result.establishment);
        setEmployers(result.employers);
      })
      .catch((error) => {
        if (isRequestCanceled(error) || controller.signal.aborted) return;
        setEstablishment(null);
        setEmployers([]);
        setApiError(resolveLoadError(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [slug]);

  const refetch = async () => {
    setLoading(true);
    setApiError(null);

    try {
      const result = await requestTeamData(slug);
      setEstablishment(result.establishment);
      setEmployers(result.employers);
      return result;
    } catch (error) {
      if (isRequestCanceled(error)) return null;
      setEstablishment(null);
      setEmployers([]);
      setApiError(resolveLoadError(error));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    establishment,
    employers,
    count: employers.length,
    loading,
    apiError,
    refetch,
  };
}
