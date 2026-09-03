// src/hooks/useEmployerCreate.js
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../services/api";
import schedulingApi from "../services/schedulingApi";
import { appId } from "../config";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

export default function useEmployerCreate(slug) {
  const [establishment, setEstablishment] = useState(null);
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("professional");
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
          throw new Error("Este estabelecimento não pertence à Rasoio.");
        }

        setEstablishment(resolved);
      } catch (error) {
        if (isRequestCanceled(error)) return;
        setEstablishment(null);
        await Swal.fire({
          icon: "error",
          title: "Não foi possível abrir a equipe",
          text:
            error?.message === "Este estabelecimento não pertence à Rasoio."
              ? error.message
              : getApiErrorMessage(error, "Estabelecimento não encontrado."),
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

      const [usersResponse, professionalsResponse] = await Promise.all([
        api.post("/user/find-for-employer", {
          ...payload,
          app_id: appId,
          establishment_id: establishment?.id,
        }),
        schedulingApi.professionals.list(establishment.id),
      ]);

      const foundUsers = Array.isArray(usersResponse?.data?.users)
        ? usersResponse.data.users
        : [];
      const establishmentProfessionals = Array.isArray(
        professionalsResponse?.data?.data
      )
        ? professionalsResponse.data.data
        : [];

      const employerByUserId = new Map(
        establishmentProfessionals.map((employer) => [
          Number(employer?.user_id),
          employer,
        ])
      );

      setUsers(
        foundUsers.map((user) => {
          const employer = employerByUserId.get(Number(user.id)) || null;
          return {
            ...user,
            is_employer: Boolean(employer),
            employer,
            establishments: employer ? [establishment] : [],
          };
        })
      );
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

      const { data } = await schedulingApi.professionals.create({
        user_id: user.id,
        establishment_id: establishment.id,
        role,
        permissions,
      });

      const employer = data?.data || null;

      await Swal.fire({
        icon: "success",
        title: "Profissional adicionado",
        text:
          data?.message ||
          "O profissional agora faz parte da equipe e possui um recurso agendável associado.",
      });

      setUsers((prev) =>
        prev.map((candidate) =>
          candidate.id === user.id
            ? {
                ...candidate,
                is_employer: true,
                employer,
                establishments: [establishment],
              }
            : candidate
        )
      );

      return data;
    } catch (error) {
      setErrors(error?.response?.data?.errors || {});
      await Swal.fire({
        icon: "error",
        title: "Não foi possível adicionar",
        text: getApiErrorMessage(error, "Erro ao associar profissional."),
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const detachEmployer = async (employerId) => {
    if (!establishment || !employerId) return null;

    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Remover profissional?",
      text: "O profissional deixará de fazer parte da equipe deste estabelecimento e seu recurso agendável será desativado.",
      showCancelButton: true,
      confirmButtonText: "Remover",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });

    if (!confirmation.isConfirmed) return null;

    try {
      setLoading(true);

      const { data } = await schedulingApi.professionals.remove(employerId);

      await Swal.fire({
        icon: "success",
        title: "Profissional removido",
        text: data?.message || "O vínculo foi removido.",
      });

      setUsers((prev) =>
        prev.map((candidate) =>
          Number(candidate.employer?.id) === Number(employerId)
            ? {
                ...candidate,
                is_employer: false,
                employer: null,
                establishments: [],
              }
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
