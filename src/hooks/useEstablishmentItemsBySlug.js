// src/hooks/useEstablishmentItemsBySlug.js
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  findManagedEstablishmentBySlug,
  listManagedItems,
} from "../services/platformManagementApi";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

export default function useEstablishmentItemsBySlug(identifier, itemType = null) {
  const [establishment, setEstablishment] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const fetchItems = useCallback(async (signal) => {
    if (!identifier) {
      setLoading(false);
      setAllItems([]);
      setEstablishment(null);
      setApiError("Estabelecimento não informado.");
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const options = signal ? { signal } : {};
      const resolvedEstablishment = await findManagedEstablishmentBySlug(
        identifier,
        options
      );

      if (signal?.aborted) return;
      if (!resolvedEstablishment) {
        throw new Error(
          "Este estabelecimento não foi encontrado entre as unidades que você administra na Rasoio."
        );
      }

      setEstablishment(resolvedEstablishment);
      const items = await listManagedItems(resolvedEstablishment.id, options);
      if (signal?.aborted) return;
      setAllItems(items);
    } catch (error) {
      if (isRequestCanceled(error) || signal?.aborted) return;
      setApiError(
        error?.message?.startsWith("Este estabelecimento")
          ? error.message
          : getApiErrorMessage(error, "Erro ao buscar itens do estabelecimento.")
      );
      setAllItems([]);
      setEstablishment(null);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    const controller = new AbortController();
    fetchItems(controller.signal);
    return () => controller.abort();
  }, [fetchItems]);

  const items = useMemo(() => {
    if (!itemType) return allItems;
    return allItems.filter(
      (item) => String(item?.type || "").toLowerCase() === itemType
    );
  }, [allItems, itemType]);

  return {
    establishment,
    items,
    allItems,
    count: items.length,
    serviceCount: allItems.filter(
      (item) => String(item?.type || "").toLowerCase() === "service"
    ).length,
    productCount: allItems.filter(
      (item) => String(item?.type || "").toLowerCase() === "product"
    ).length,
    loading,
    apiError,
    reload: () => fetchItems(),
  };
}
