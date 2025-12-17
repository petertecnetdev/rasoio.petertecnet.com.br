// src/hooks/useOrderCreate.js
import { useEffect, useState, useCallback, useRef } from "react";
import api from "../services/api";

export default function useOrderCreate(identifier) {
  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState([]);
  const [employers, setEmployers] = useState([]);

  const [clients, setClients] = useState([]);
  const [searchingClients, setSearchingClients] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const abortRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!identifier) return;

    setLoading(true);
    setApiError(null);

    try {
      const [estRes, itemsRes, employersRes] = await Promise.all([
        api.get(`/establishment/view/${identifier}`),
        api.get(`/item/list-by-entity/${identifier}`),
        api.get(`/employer/list-by-entity/${identifier}`),
      ]);

      setEstablishment(estRes.data.establishment || null);
      setItems(Array.isArray(itemsRes.data.items) ? itemsRes.data.items : []);
      setEmployers(
        Array.isArray(employersRes.data.employers)
          ? employersRes.data.employers
          : []
      );
    } catch (err) {
      setApiError(
        err?.response?.data?.error ||
          "Erro ao carregar dados do estabelecimento."
      );
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const searchClients = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setClients([]);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setSearchingClients(true);

    try {
      const { data } = await api.post(
        "/user/find-for-order",
        { q: query },
        { signal: controller.signal }
      );

      setClients(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") return;
      setClients([]);
    } finally {
      setSearchingClients(false);
    }
  }, []);

  const fetchAvailableTimes = useCallback(async (payload) => {
    try {
      const { data } = await api.post("/employer/available-times", payload);
      return Array.isArray(data.available_times)
        ? data.available_times
        : [];
    } catch {
      return [];
    }
  }, []);

  const createOrder = useCallback(
    async (payload) => {
      if (!establishment) {
        throw new Error("Estabelecimento não carregado.");
      }

      setSubmitting(true);
      setApiError(null);

      try {
        const { data } = await api.post("/order", payload);
        return data;
      } catch (err) {
        setApiError(
          err?.response?.data?.error || "Erro ao criar pedido."
        );
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [establishment]
  );

  return {
    establishment,
    items,
    employers,

    clients,
    searchingClients,
    searchClients,

    loading,
    submitting,
    apiError,

    fetchAvailableTimes,
    createOrder,
    reload: loadData,
  };
}
