// src/hooks/useEmployerCreate.js
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../services/api";
import { appId, appSlug } from "../config";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

const appContextPath = `/v1/apps/${encodeURIComponent(appSlug)}`;
const teamMembersPath = `${appContextPath}/team-members`;

export default function useEmployerCreate(slug) {
  const [establishment, setEstablishment] = useState(null);
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("barbeiro");
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!slug) {
      setEstablishment(null);
      setLoadError("Estabelecimento não informado.");
      setInitialLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    (async () => {
      setInitialLoading(true);
      setLoadError("");

      try {
        // Resolve the establishment inside the generic application context.
        // Using /me/establishments also allows the owner to manage the team
        // before the establishment is publicly published.
        const { data } = await api.get(`${appContextPath}/me/establishments`, {
          signal: controller.signal,
        });

        const ownedEstablishments = Array.isArray(data?.data) ? data.data : [];
        const resolved =
          ownedEstablishments.find(
            (candidate) => String(candidate?.slug || "") === String(slug)
          ) || null;

        if (!resolved) {
          throw new Error(
            "Este estabelecimento não foi encontrado entre os estabelecimentos que você administra na Rasoio."
          );
        }

        setEstablishment(resolved);
      } catch (error) {
        if (isRequestCanceled(error)) return;

        const message =
          error?.message?.startsWith("Este estabelecimento")
            ? error.message
            : getApiErrorMessage(
                error,
                "Não foi possível carregar o estabelecimento para adicionar colaboradores."
              );

        setEstablishment(null);
        setLoadError(message);
      } finally {
        if (!controller.signal.aborted) {
          setInitialLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [slug]);

  const searchUsers = async (payload) => {
    if (!establishment) {
      await Swal.fire({
        icon: "error",
        title: "Estabelecimento indisponível",
        text: loadError || "Não foi possível identificar o estabelecimento.",
      });
      return;
    }

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
          establishment_id: establishment.id,
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

      const { data } = await api.post(teamMembersPath, {
        user_id: user.id,
        establishment_id: establishment.id,
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
    initialLoading,
    searching,
    errors,
    loadError,
    setRole,
    setPermissions,
    searchUsers,
    createEmployer,
    detachEmployer,
  };
}
