// src/hooks/useEmployerHome.js
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../services/api";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

const getFileUrlByType = (files, type) =>
  Array.isArray(files) ? files.find((file) => file?.type === type)?.public_url ?? null : null;

export default function useEmployerHome(_apiBaseUrl, appId) {
  const [employers, setEmployers] = useState([]);
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

    async function loadEmployers() {
      setIsLoading(true);
      setError(null);

      try {
        const { data } = await api.get(`/employer/home/${appId}`, {
          params: city && uf ? { city, uf } : undefined,
          signal: controller.signal,
        });

        const mappedEmployers = (data?.employers || []).map((employer) => {
          const firstName = employer?.user?.first_name || "";
          const lastName = employer?.user?.last_name || "";
          const fullName = `${firstName} ${lastName}`.trim();
          const avatar = getFileUrlByType(employer?.user?.files, "avatar");

          return {
            ...employer,
            type: "employer",
            name: fullName || firstName || "Profissional",
            first_name: firstName,
            last_name: lastName,
            avatar,
            image: avatar,
            user: employer?.user,
          };
        });

        setEmployers(mappedEmployers);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        const message = getApiErrorMessage(
          requestError,
          "Erro ao carregar os profissionais."
        );
        setError(message);
        await Swal.fire({ icon: "error", title: "Erro", text: message });
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadEmployers();
    return () => controller.abort();
  }, [appId, city, uf]);

  return { employers, isLoading, error };
}
