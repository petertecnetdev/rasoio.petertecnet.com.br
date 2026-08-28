// src/hooks/useEstablishmentOrdersBySlug.js
import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { appId } from "../config";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

export default function useEstablishmentOrdersBySlug(slug) {
  const [establishment, setEstablishment] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const fetchOrders = useCallback(async (signal) => {
    if (!slug) {
      setEstablishment(null);
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const { data } = await api.get(
        `/order/list-by-entity-slug/${encodeURIComponent(slug)}`,
        { params: { app_id: appId }, signal }
      );

      const resolved = data?.establishment || null;
      if (!resolved || Number(resolved.app_id) !== Number(appId)) {
        throw new Error("Esta barbearia não pertence ao aplicativo Rasoio.");
      }

      setEstablishment(resolved);
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (error) {
      if (isRequestCanceled(error) || signal?.aborted) return;

      setApiError(
        error?.message === "Esta barbearia não pertence ao aplicativo Rasoio."
          ? error.message
          : getApiErrorMessage(error, "Erro ao carregar a agenda da barbearia.")
      );
      setOrders([]);
      setEstablishment(null);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);
    return () => controller.abort();
  }, [fetchOrders]);

  return {
    establishment,
    orders,
    loading,
    apiError,
    refetch: fetchOrders,
  };
}
