// src/hooks/useEmployerCreate.js
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  addTeamMember,
  findManagedEstablishmentBySlug,
  inviteTeamMember,
  removeTeamMember,
  searchTeamMemberCandidates,
} from "../services/platformManagementApi";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

function resolveSearchTerm(payload) {
  if (!payload || typeof payload !== "object") return "";

  return String(
    payload.email ||
      payload.user_name ||
      payload.cpf ||
      payload.phone ||
      payload.first_name ||
      ""
  ).trim();
}

export default function useEmployerCreate(slug) {
  const [establishment, setEstablishment] = useState(null);
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("profissional");
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
        const resolved = await findManagedEstablishmentBySlug(slug, {
          signal: controller.signal,
        });

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
      return [];
    }

    const query = resolveSearchTerm(payload);
    if (query.length < 2) {
      await Swal.fire({
        icon: "warning",
        title: "Informe os dados do usuário",
        text: "Pesquise por nome, e-mail, CPF, telefone ou @usuário.",
      });
      return [];
    }

    try {
      setSearching(true);
      setUsers([]);
      setErrors({});

      const candidates = await searchTeamMemberCandidates(
        establishment.id,
        query
      );

      const normalized = candidates.map((candidate) => {
        const teamMember = candidate?.team_member || null;

        return {
          ...candidate,
          is_employer: Boolean(candidate?.is_team_member && teamMember?.id),
          employer: teamMember,
          establishments: teamMember ? [establishment] : [],
        };
      });

      setUsers(normalized);
      return normalized;
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Erro ao buscar usuário",
        text: getApiErrorMessage(
          error,
          "Não foi possível pesquisar candidatos para a equipe."
        ),
      });
      return [];
    } finally {
      setSearching(false);
    }
  };

  const createEmployer = async (user) => {
    if (!establishment || !user?.id) return null;

    try {
      setLoading(true);
      setErrors({});

      const data = await addTeamMember({
        userId: user.id,
        establishmentId: establishment.id,
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
          Number(candidate.id) === Number(user.id)
            ? {
                ...candidate,
                is_team_member: true,
                is_employer: true,
                is_owner: Boolean(data?.is_owner),
                team_member: data?.employer,
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

  const inviteEmployer = async ({ firstName, email }) => {
    if (!establishment) return null;

    try {
      setLoading(true);
      setErrors({});

      const data = await inviteTeamMember({
        firstName,
        email,
        establishmentId: establishment.id,
        role,
        permissions,
      });

      await Swal.fire({
        icon: "success",
        title: data?.invited ? "Convite enviado" : "Profissional adicionado",
        text:
          data?.message ||
          (data?.invited
            ? "A conta foi preparada e o profissional recebeu por e-mail o código para confirmar o acesso."
            : "O profissional já possuía uma conta Peter Tecnet e foi vinculado à equipe."),
      });

      return data;
    } catch (error) {
      setErrors(error?.response?.data?.errors || {});
      await Swal.fire({
        icon: "error",
        title: "Não foi possível convidar",
        text: getApiErrorMessage(
          error,
          "Não foi possível convidar este profissional para a equipe."
        ),
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
      text: "O profissional deixará de fazer parte da equipe deste estabelecimento.",
      showCancelButton: true,
      confirmButtonText: "Remover",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });

    if (!confirmation.isConfirmed) return null;

    try {
      setLoading(true);

      const data = await removeTeamMember(employerId);

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
                is_team_member: false,
                is_employer: false,
                team_member: null,
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
    inviteEmployer,
    detachEmployer,
  };
}
