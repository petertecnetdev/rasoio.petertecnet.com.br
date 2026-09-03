import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import schedulingApi from "../services/schedulingApi";
import { apiV1BaseUrl } from "../config";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

export default function useEstablishmentOrdersBySlug(slug) {
  const [establishment, setEstablishment] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [apiError, setApiError] = useState(null);

  const fetchOrders = useCallback(
    async (signal) => {
      if (!slug) {
        setEstablishment(null);
        setEmployers([]);
        setOrders([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setApiError(null);
      try {
        const establishmentResponse = await api.get(
          `${apiV1BaseUrl}/establishments/${encodeURIComponent(slug)}`,
          { signal }
        );
        const currentEstablishment = establishmentResponse?.data?.data || null;
        if (!currentEstablishment?.id) {
          throw new Error("Estabelecimento não encontrado.");
        }

        const [appointmentsResponse, employersResponse] = await Promise.all([
          schedulingApi.appointments.establishment(currentEstablishment.id),
          api.get(
            `${apiV1BaseUrl}/establishments/${currentEstablishment.id}/employers`,
            { signal }
          ),
        ]);

        setEstablishment(currentEstablishment);
        setEmployers(
          Array.isArray(employersResponse?.data?.data)
            ? employersResponse.data.data
            : []
        );
        setOrders(
          Array.isArray(appointmentsResponse?.data?.data)
            ? appointmentsResponse.data.data
            : []
        );
      } catch (error) {
        if (isRequestCanceled(error) || signal?.aborted) return;
        setApiError(
          getApiErrorMessage(error, "Erro ao carregar a agenda do estabelecimento.")
        );
        setOrders([]);
        setEmployers([]);
        setEstablishment(null);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [slug]
  );

  const refetch = useCallback(() => fetchOrders(), [fetchOrders]);

  const transitionOrder = useCallback(async (orderId, action, reason = null) => {
    setActionLoading(orderId);
    try {
      const { data } = await schedulingApi.appointments.transition(orderId, {
        action,
        reason,
      });
      const updated = data?.data || null;
      if (updated) {
        setOrders((current) =>
          current.map((order) => (order.id === orderId ? updated : order))
        );
      }
      return updated;
    } catch (error) {
      throw new Error(
        getApiErrorMessage(error, "Não foi possível atualizar o agendamento.")
      );
    } finally {
      setActionLoading(null);
    }
  }, []);

  const assignOrder = useCallback(async (orderId, attendantId) => {
    setActionLoading(orderId);
    try {
      const { data } = await schedulingApi.appointments.assign(orderId, {
        provider_id: attendantId,
      });
      const updated = data?.data || null;
      if (updated) {
        setOrders((current) =>
          current.map((order) => (order.id === orderId ? updated : order))
        );
      }
      return updated;
    } catch (error) {
      throw new Error(
        getApiErrorMessage(error, "Não foi possível redirecionar o agendamento.")
      );
    } finally {
      setActionLoading(null);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);
    return () => controller.abort();
  }, [fetchOrders]);

  return {
    establishment,
    employers,
    orders,
    loading,
    actionLoading,
    apiError,
    refetch,
    transitionOrder,
    assignOrder,
  };
}
