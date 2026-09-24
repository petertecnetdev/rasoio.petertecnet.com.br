// src/hooks/useEmployerListBySlug.jsx
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../services/api";

export default function useEmployerListBySlug(slug) {
  const [establishment, setEstablishment] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (!slug) {
      setApiError("Slug inválido.");
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setApiError(null);

        const { data } = await api.get(
          `/employer/list-by-entity/${encodeURIComponent(slug)}`,
          { signal: controller.signal }
        );

        if (!mounted) return;

        setEstablishment(data.establishment ?? null);
        setEmployers(Array.isArray(data.employers) ? data.employers : []);
      } catch (error) {
        if (!mounted || error?.code === "ERR_CANCELED") return;

        setApiError(
          error?.response?.data?.error ||
            error?.response?.data?.message ||
            "Erro ao carregar colaboradores."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [slug]);

  const removeEmployer = async (employerId) => {
    if (!establishment) return;

    const confirm = await Swal.fire({
      title: "Remover colaborador",
      text: "Tem certeza que deseja remover este colaborador do estabelecimento?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.post("/employer/detach", {
        employer_id: employerId,
        establishment_id: establishment.id,
      });

      setApiError(null);
      setEmployers((prev) => prev.filter((employer) => employer.id !== employerId));

      await Swal.fire({
        icon: "success",
        title: "Removido",
        text: "Colaborador removido com sucesso.",
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Erro",
        text:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Erro ao remover colaborador.",
      });
    }
  };

  return {
    establishment,
    employers,
    loading,
    apiError,
    removeEmployer,
  };
}
