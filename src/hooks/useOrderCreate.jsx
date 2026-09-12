// src/hooks/useOrderCreate.js
import { useEffect, useState, useCallback, useRef } from "react";
import api from "../services/api";
import { getAppointmentAcquisitionAttribution } from "../utils/appointmentAcquisitionAttribution";

const createOrderIdempotencyKey = () => {
  const uuid = window.crypto?.randomUUID?.();
  if (uuid) return `rasoio-order-${uuid}`;

  return `rasoio-order-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 14)}`;
};

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
  const orderIntentRef = useRef({ fingerprint: null, key: null });

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
      setItems(itemsRes.data.items || []);
      setEmployers(employersRes.data.employers || []);
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

    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setSearchingClients(true);

    try {
      const { data } = await api.post(
        "/user/find-for-order",
        { q: query },
        { signal: controller.signal }
      );

      setClients(data.users || []);
    } catch (err) {
      if (err.name !== "AbortError") setClients([]);
    } finally {
      setSearchingClients(false);
    }
  }, []);

  const fetchAvailableTimes = useCallback(async (payload) => {
    const { data } = await api.post("/employer/available-times", payload);
    return data.available_times || [];
  }, []);

  const createOrder = useCallback(async (payload) => {
    const attribution =
      payload?.mode === "appointment" && !payload?.acquisition_attribution
        ? getAppointmentAcquisitionAttribution()
        : null;
    const orderPayload = attribution
      ? { ...payload, acquisition_attribution: attribution }
      : payload;
    const fingerprint = JSON.stringify(orderPayload);

    if (orderIntentRef.current.fingerprint !== fingerprint) {
      orderIntentRef.current = {
        fingerprint,
        key: createOrderIdempotencyKey(),
      };
    }

    const idempotencyKey = orderIntentRef.current.key;

    setSubmitting(true);
    try {
      const { data } = await api.post("/order", orderPayload, {
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      });

      orderIntentRef.current = { fingerprint: null, key: null };
      return data;
    } catch (err) {
      const idempotencyStatus = String(
        err?.response?.headers?.["idempotency-status"] || ""
      ).toLowerCase();

      // Sem resposta HTTP, a primeira requisição pode ter sido persistida pela API.
      // Mantemos a mesma chave para que uma nova tentativa recupere o resultado
      // em vez de criar outro pedido/agendamento. Erros definitivos recebem uma
      // nova chave na próxima tentativa.
      if (err?.response && idempotencyStatus !== "processing") {
        orderIntentRef.current = { fingerprint: null, key: null };
      }

      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    establishment,
    items,
    employers,

    clients,
    searchingClients,
    searchClients,

    fetchAvailableTimes,
    createOrder,

    loading,
    submitting,
    apiError,
  };
}
