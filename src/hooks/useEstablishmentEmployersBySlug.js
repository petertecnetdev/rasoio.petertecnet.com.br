import { useEffect, useState } from "react";
import api from "../services/api";
import { appSlug } from "../config";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

const appContextPath = `/v1/apps/${encodeURIComponent(appSlug)}`;
const teamMembersPath = `${appContextPath}/team-members`;

async function requestOwnedEstablishment(slug, signal) {
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

  return establishment;
}

async function requestEmployers(establishmentId, signal) {
  const response = await api.get(teamMembersPath, {
    params: { establishment_id: establishmentId },
    signal,
  });

  return Array.isArray(response?.data?.data) ? response.data.data : [];
}

function resolveEstablishmentError(error) {
  if (error?.message === "Estabelecimento não informado.") {
    return error.message;
  }

  if (error?.message?.startsWith("Este estabelecimento")) {
    return error.message;
  }

  return getApiErrorMessage(
    error,
    "Não foi possível carregar o estabelecimento para gerenciar a equipe."
  );
}

function resolveEmployersError(error) {
  return getApiErrorMessage(
    error,
    "O estabelecimento foi carregado, mas não foi possível atualizar a lista de colaboradores. Você ainda pode adicionar um colaborador."
  );
}

export default function useEstablishmentEmployersBySlug(slug) {
  const [establishment, setEstablishment] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const loadData = async (signal) => {
    setLoading(true);
    setApiError(null);

    try {
      const resolvedEstablishment = await requestOwnedEstablishment(slug, signal);
      if (signal?.aborted) return null;

      setEstablishment(resolvedEstablishment);

      try {
        const resolvedEmployers = await requestEmployers(
          resolvedEstablishment.id,
          signal
        );
        if (signal?.aborted) return null;
        setEmployers(resolvedEmployers);
        return {
          establishment: resolvedEstablishment,
          employers: resolvedEmployers,
        };
      } catch (error) {
        if (isRequestCanceled(error) || signal?.aborted) return null;
        setEmployers([]);
        setApiError(resolveEmployersError(error));
        return {
          establishment: resolvedEstablishment,
          employers: [],
        };
      }
    } catch (error) {
      if (isRequestCanceled(error) || signal?.aborted) return null;
      setEstablishment(null);
      setEmployers([]);
      setApiError(resolveEstablishmentError(error));
      return null;
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
    // loadData intentionally follows the current route slug only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const refetch = async () => loadData();

  return {
    establishment,
    employers,
    count: employers.length,
    loading,
    apiError,
    refetch,
  };
}
