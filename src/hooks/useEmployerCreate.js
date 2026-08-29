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

      const [usersResponse, employersResponse] = await Promise.all([
        api.post("/user/find-for-employer", {
          ...payload,
          app_id: appId,
          establishment_id: establishment?.id,
        }),
        api.get(`/employer/list-by-entity/${encodeURIComponent(slug)}`),
      ]);

      const foundUsers = Array.isArray(usersResponse?.data?.users)
        ? usersResponse.data.users
        : [];
      const establishmentEmployers = Array.isArray(
        employersResponse?.data?.employers
      )
        ? employersResponse.data.employers
        : [];

      const employerByUserId = new Map(
        establishmentEmployers.map((employer) => [
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

      const { data } = await api.post("/rasoio/employers", {
        user_id: user.id,
        establishment_id: establishment.id,
        app_id: appId,
        role,
        permissions,
      });

      await Swal.fire({
        icon: "success",
        title: data?.is_owner
          ? "Proprietário adicionado à equipe"
          : "Colaborador adicionado",
        text:
          data?.message ||
          (data?.is_owner
            ? "O proprietário agora também pode atender clientes e possuir agenda própria."
            : "O profissional agora faz parte da equipe."),
      });

      setUsers((prev) =>
        prev.map((candidate) =>
          candidate.id === user.id
            ? {
                ...candidate,
                is_employer: true,
                is_owner: Boolean(data?.is_owner),
                employer: data?.employer,
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
        text: getApiErrorMessage(error, "Erro ao associar colaborador."),
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
      title: "Remover colaborador?",
      text: "O profissional deixará de fazer parte da equipe desta barbearia.",
      showCancelButton: true,
      confirmButtonText: "Remover",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });

    if (!confirmation.isConfirmed) return null;

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
