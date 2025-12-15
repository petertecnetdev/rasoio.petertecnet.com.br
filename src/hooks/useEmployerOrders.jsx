// src/hooks/useEmployerOrders.js
import { useEffect, useState, useCallback } from "react";
import api from "../services/api";

export default function useEmployerOrders() {
  const [orders, setOrders] = useState([]);
  const [employer, setEmployer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [apiError, setApiError] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);

      const res = await api.post("/employer/list-my-orders");

      setOrders(res.data?.orders || []);
      setEmployer(res.data?.employer || null);
    } catch (err) {
      setApiError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Erro ao carregar pedidos do colaborador."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (orderId, action, reason = null) => {
      try {
        setActionLoading(orderId);

        await api.put(`/order/${orderId}/update-status`, {
          action,
          reason,
        });

        await loadOrders();
      } catch (err) {
        throw new Error(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            "Erro ao atualizar status do pedido."
        );
      } finally {
        setActionLoading(null);
      }
    },
    [loadOrders]
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    orders,
    employer,
    loading,
    actionLoading,
    apiError,
    reload: loadOrders,
    updateOrderStatus,
    count: orders.length,
  };
}
