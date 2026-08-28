// src/hooks/useEstablishmentMy.js
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../services/api";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

export default function useEstablishmentMy(appId) {
  const [establishments, setEstablishments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (!appId) {
      setEstablishments([]);
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    const fetchEstablishments = async () => {
      try {
        setIsLoading(true);
        setApiError(null);

        const { data } = await api.post(
          "/establishment/my/app",
          { app_id: appId },
          { signal: controller.signal }
        );

        const scoped = Array.isArray(data?.establishments)
          ? data.establishments.filter(
              (establishment) => Number(establishment?.app_id) === Number(appId)
            )
          : [];

        setEstablishments(scoped);
      } catch (error) {
        if (isRequestCanceled(error)) return;

        const message = getApiErrorMessage(
          error,
          "Erro ao carregar suas barbearias."
        );
        setApiError(message);

        await Swal.fire({
          icon: "error",
          title: "Não foi possível carregar suas barbearias",
          text: message,
        });
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchEstablishments();
    return () => controller.abort();
  }, [appId]);

  return {
    establishments,
    isLoading,
    apiError,
  };
}
