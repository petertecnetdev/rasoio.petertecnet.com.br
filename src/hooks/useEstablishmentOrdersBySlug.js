import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
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
      setLoading(false);
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const { data } = await api.get(`/rasoio/establishments/${encodeURIComponent(slug)}/orders`, { signal });
      setEstablishment(data?.establishment || null);
      setEmployers(Array.isArray(data?.employers) ? data.employers : []);
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (error) {
      if (isRequestCanceled(error) || signal?.aborted) return;
      setApiError(getApiErrorMessage(error, "Erro ao carregar a agenda da barbearia."));
      setOrders([]);
      setEmployers([]);
      setEstablishment(null);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [slug]);

  const refetch = useCallback(() => fetchOrders(), [fetchOrders]);

  const transitionOrder = useCallback(async (orderId, action, reason = null) => {
    setActionLoading(orderId);
    try {
      const { data } = await api.patch(`/rasoio/orders/${orderId}/transition`, { action, reason });
      setOrders((current) => current.map((order) => order.id === orderId ? data.order : order));
      return data.order;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Não foi possível atualizar o agendamento."));
    } finally {
      setActionLoading(null);
    }
  }, []);

  const assignOrder = useCallback(async (orderId, attendantId) => {
    setActionLoading(orderId);
    try {
      const { data } = await api.patch(`/rasoio/orders/${orderId}/assign`, { attendant_id: attendantId });
      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, ...data.order } : order));
      return data.order;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Não foi possível redirecionar o agendamento."));
    } finally {
      setActionLoading(null);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);
    return () => controller.abort();
  }, [fetchOrders]);

  return { establishment, employers, orders, loading, actionLoading, apiError, refetch, transitionOrder, assignOrder };
}
