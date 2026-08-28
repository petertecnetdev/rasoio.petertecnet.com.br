// src/hooks/useEmployerListBySlug.jsx
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../services/api";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

export default function useEmployerListBySlug(slug) {
  const [establishment, setEstablishment] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (!slug) {
      setApiError("Barbearia não identificada.");
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setApiError(null);
        const { data } = await api.get(
          `/employer/list-by-entity/${encodeURIComponent(slug)}`,
          { signal: controller.signal }
        );
        setEstablishment(data?.establishment ?? null);
        setEmployers(Array.isArray(data?.employers) ? data.employers : []);
      } catch (error) {
        if (isRequestCanceled(error)) return;
        setApiError(getApiErrorMessage(error, "Erro ao carregar os profissionais."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [slug]);

  const removeEmployer = useCallback(
    async (employerId) => {
      if (!establishment?.id || !employerId) return false;

      const confirmation = await Swal.fire({
        title: "Remover profissional",
        text: "Tem certeza que deseja remover este profissional da barbearia?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, remover",
        cancelButtonText: "Cancelar",
        reverseButtons: true,
      });
      if (!confirmation.isConfirmed) return false;

      try {
        await api.post("/employer/detach", {
          employer_id: employerId,
          establishment_id: establishment.id,
        });

        setApiError(null);
        setEmployers((current) =>
          current.filter((employer) => Number(employer?.id) !== Number(employerId))
        );
        await Swal.fire({
          icon: "success",
          title: "Profissional removido",
          text: "A associação com a barbearia foi removida com sucesso.",
        });
        return true;
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "Erro",
          text: getApiErrorMessage(error, "Erro ao remover o profissional."),
        });
        return false;
      }
    },
    [establishment]
  );

  return { establishment, employers, loading, apiError, removeEmployer };
}
