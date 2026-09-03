import { useEffect, useState, useCallback } from "react";
import schedulingApi from "../services/schedulingApi";

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
      const { data } = await schedulingApi.appointments.provider();
      const storedEmployer = (() => {
        try {
          return JSON.parse(localStorage.getItem("employer") || "null");
        } catch {
          return null;
        }
      })();

      setEmployer(storedEmployer);
      setOrders(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      setApiError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Erro ao listar os agendamentos do profissional."
      );
      setOrders([]);
      setEmployer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (orderId, action, reason = null) => {
      setActionLoading(orderId);
      try {
        await schedulingApi.appointments.transition(orderId, { action, reason });
        await fetchOrders();
      } catch (err) {
        throw new Error(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            "Erro ao atualizar o agendamento."
        );
      } finally {
        setActionLoading(null);
      }
    },
    [fetchOrders]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    employer,
    loading,
    apiError,
    actionLoading,
    updateOrderStatus,
    refetch: fetchOrders,
  };
}
