import { useCallback, useEffect, useState } from "react";
import {
  assignAppointment,
  listEstablishmentAppointments,
  transitionAppointment,
} from "../services/platformManagementApi";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

export default function useEstablishmentOrdersBySlug(slug) {
  const [establishment, setEstablishment] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [apiError, setApiError] = useState(null);

  const fetchOrders = useCallback(async (signal) => {
    if (!slug) {
      setEstablishment(null);
      setEmployers([]);
      setOrders([]);
      setApiError("Estabelecimento não informado.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const data = await listEstablishmentAppointments(
        slug,
        signal ? { signal } : {}
      );
      if (signal?.aborted) return;
      setEstablishment(data?.establishment || null);
      setEmployers(Array.isArray(data?.employers) ? data.employers : []);
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
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
  }, [slug]);

  const refetch = useCallback(() => fetchOrders(), [fetchOrders]);

  const handleTransitionOrder = useCallback(async (orderId, action, reason = null) => {
    setActionLoading(orderId);
    try {
      const data = await transitionAppointment(orderId, action, reason);
      const updated = data?.order;
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

  const handleAssignOrder = useCallback(async (orderId, attendantId) => {
    setActionLoading(orderId);
    try {
      const data = await assignAppointment(orderId, attendantId);
      const updated = data?.order;
      if (updated) {
        setOrders((current) =>
          current.map((order) =>
            order.id === orderId ? { ...order, ...updated } : order
          )
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
    transitionOrder: handleTransitionOrder,
    assignOrder: handleAssignOrder,
  };
}
