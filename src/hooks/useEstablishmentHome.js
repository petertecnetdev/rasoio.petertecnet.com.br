// src/hooks/useEstablishmentHome.js
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../services/api";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

const getFileUrlByType = (files, type) =>
  Array.isArray(files) ? files.find((file) => file?.type === type)?.public_url ?? null : null;

export default function useEstablishmentHome(_apiBaseUrl, appId) {
  const [establishments, setEstablishments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const city = localStorage.getItem("selectedCity") || "";
  const uf = localStorage.getItem("selectedUF") || "";

  useEffect(() => {
    if (!appId) {
      setError("Aplicação não identificada.");
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    async function loadEstablishments() {
      setIsLoading(true);
      setError(null);

      try {
        const { data } = await api.get(`/establishment/home/${appId}`, {
          params: city && uf ? { city, uf } : undefined,
          signal: controller.signal,
        });

        const mappedEstablishments = (data?.establishments || []).map((establishment) => {
          const logo = getFileUrlByType(establishment?.files, "logo");
          const background = getFileUrlByType(establishment?.files, "background");

          return {
            ...establishment,
            type: "establishment",
            name: establishment?.name,
            image: logo || background || null,
            images: { logo, background },
          };
        });

        setEstablishments(mappedEstablishments);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        const message = getApiErrorMessage(
          requestError,
          "Erro ao carregar os estabelecimentos."
        );
        setError(message);
        await Swal.fire({ icon: "error", title: "Erro", text: message });
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadEstablishments();
    return () => controller.abort();
  }, [appId, city, uf]);

  return { establishments, isLoading, error };
}
