import { useEffect, useState, useCallback } from "react";
import api from "../services/api";

export default function useEmployerOrders() {
  const [orders, setOrders] = useState([]);
  const [employer, setEmployer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const { data } = await api.get("/rasoio/orders/employer");
      setEmployer(data?.employer || null);
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (err) {
      setApiError(err?.response?.data?.message || err?.response?.data?.error || "Erro ao listar os agendamentos do colaborador.");
      setOrders([]);
      setEmployer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId, action, reason = null) => {
    setActionLoading(orderId);
    try {
      await api.patch(`/rasoio/orders/${orderId}/transition`, { action, reason });
      await fetchOrders();
    } catch (err) {
      throw new Error(err?.response?.data?.message || err?.response?.data?.error || "Erro ao atualizar o agendamento.");
    } finally {
      setActionLoading(null);
    }
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, employer, loading, apiError, actionLoading, updateOrderStatus, refetch: fetchOrders };
}
