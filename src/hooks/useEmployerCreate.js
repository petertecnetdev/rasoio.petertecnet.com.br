// src/hooks/useEmployerCreate.js
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../services/api";
import { appId } from "../config";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

export default function useEmployerCreate(slug) {
  const [establishment, setEstablishment] = useState(null);
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("barbeiro");
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!slug) return undefined;

    const controller = new AbortController();

    (async () => {
      try {
        const { data } = await api.get(
          `/establishment/view/${encodeURIComponent(slug)}`,
          {
            params: { app_id: appId },
            signal: controller.signal,
          }
        );

        const resolved = data?.establishment || null;
        if (!resolved || Number(resolved.app_id) !== Number(appId)) {
          throw new Error("Esta empresa não pertence à Rasoio.");
        }

        setEstablishment(resolved);
      } catch (error) {
        if (isRequestCanceled(error)) return;
        setEstablishment(null);
        await Swal.fire({
          icon: "error",
          title: "Não foi possível abrir a equipe",
          text:
            error?.message === "Esta empresa não pertence à Rasoio."
              ? error.message
              : getApiErrorMessage(error, "Barbearia não encontrada."),
        });
      }
    })();

    return () => controller.abort();
  }, [slug]);

  const searchUsers = async (payload) => {
    if (!payload || Object.keys(payload).length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Informe os dados do usuário",
        text: "Pesquise por e-mail, nome de usuário ou outro dado disponível.",
      });
      return;
    }

    try {
      setSearching(true);
      setUsers([]);
      setErrors({});

      const { data } = await api.post("/user/find-for-employer", {
        ...payload,
        app_id: appId,
        establishment_id: establishment?.id,
      });

      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Erro ao buscar usuário",
        text: getApiErrorMessage(error, "Erro ao buscar usuários."),
      });
    } finally {
      setSearching(false);
    }
  };

  const createEmployer = async (user) => {
    if (!establishment || !user?.id) return null;

    try {
      setLoading(true);
      setErrors({});

      const { data } = await api.post("/employer/store", {
        user_id: user.id,
        establishment_id: establishment.id,
        app_id: appId,
        role,
        permissions,
      });

      await Swal.fire({
        icon: "success",
        title: "Colaborador adicionado",
        text: data?.message || "O profissional agora faz parte da equipe.",
      });

      setUsers((prev) =>
        prev.map((candidate) =>
          candidate.id === user.id
            ? { ...candidate, is_employer: true, employer: data?.employer }
            : candidate
        )
      );

      return data;
    } catch (error) {
      setErrors(error?.response?.data?.errors || {});
      await Swal.fire({
        icon: "error",
        title: "Não foi possível adicionar",
        text: getApiErrorMessage(error, "Erro ao associar colaborador."),
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const detachEmployer = async (employerId) => {
    if (!establishment || !employerId) return null;

    try {
      setLoading(true);

      const { data } = await api.post("/employer/detach", {
        employer_id: employerId,
        establishment_id: establishment.id,
        app_id: appId,
      });

      await Swal.fire({
        icon: "success",
        title: "Colaborador removido",
        text: data?.message || "O vínculo foi removido.",
      });

      setUsers((prev) =>
        prev.map((candidate) =>
          candidate.employer?.id === employerId
            ? { ...candidate, is_employer: false, employer: null }
            : candidate
        )
      );

      return data;
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Não foi possível remover",
        text: getApiErrorMessage(error, "Erro ao remover associação."),
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    establishment,
    users,
    role,
    permissions,
    loading,
    searching,
    errors,
    setRole,
    setPermissions,
    searchUsers,
    createEmployer,
    detachEmployer,
  };
}
