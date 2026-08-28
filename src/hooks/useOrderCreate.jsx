// src/hooks/useOrderCreate.js
import { useEffect, useState, useCallback, useRef } from "react";
import { appId } from "../config";
import api from "../services/api";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

const belongsToRasoio = (resource) => {
  const resourceAppId =
    resource?.app_id ?? resource?.application_id ?? resource?.app?.id ?? null;
  return resourceAppId == null || Number(resourceAppId) === Number(appId);
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

  const loadData = useCallback(async (signal) => {
    if (!identifier) return;

    setLoading(true);
    setApiError(null);

    try {
      const [estRes, itemsRes, employersRes] = await Promise.all([
        api.get(`/establishment/view/${identifier}`, { signal }),
        api.get(`/item/list-by-entity/${identifier}`, { signal }),
        api.get(`/employer/list-by-entity/${identifier}`, { signal }),
      ]);

      const nextEstablishment = estRes.data?.establishment || null;
      if (!nextEstablishment || !belongsToRasoio(nextEstablishment)) {
        setEstablishment(null);
        setItems([]);
        setEmployers([]);
        setApiError("Esta barbearia não pertence à Rasoio.");
        return;
      }

      setEstablishment(nextEstablishment);
      setItems((itemsRes.data?.items || []).filter(belongsToRasoio));
      setEmployers((employersRes.data?.employers || []).filter(belongsToRasoio));
    } catch (err) {
      if (isRequestCanceled(err)) return;
      setApiError(getApiErrorMessage(err, "Erro ao carregar dados da barbearia."));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
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
      setClients(Array.isArray(data?.users) ? data.users : []);
    } catch (err) {
      if (!isRequestCanceled(err)) setClients([]);
    } finally {
      if (!controller.signal.aborted) setSearchingClients(false);
    }
  }, []);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  const fetchAvailableTimes = useCallback(async (payload) => {
    const { data } = await api.post("/employer/available-times", payload);
    return Array.isArray(data?.available_times) ? data.available_times : [];
  }, []);

  const createOrder = useCallback(async (payload) => {
    setSubmitting(true);
    try {
      const { data } = await api.post("/order", { ...payload, app_id: appId });
      return data;
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
