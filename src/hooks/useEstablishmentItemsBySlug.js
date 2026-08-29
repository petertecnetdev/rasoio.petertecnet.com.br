// src/hooks/useEstablishmentItemsBySlug.js
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { appId } from "../config";

export default function useEstablishmentItemsBySlug(identifier, itemType = null) {
  const [establishment, setEstablishment] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const fetchItems = useCallback(async () => {
    if (!identifier) {
      setLoading(false);
      setAllItems([]);
      setEstablishment(null);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const encodedIdentifier = encodeURIComponent(identifier);
      const [establishmentResponse, itemsResponse] = await Promise.all([
        api.get(`/establishment/view/${encodedIdentifier}`, {
          params: { app_id: appId },
        }),
        api.get(`/item/list-by-entity/${encodedIdentifier}`),
      ]);

      const resolvedEstablishment =
        establishmentResponse?.data?.establishment || null;

      if (
        !resolvedEstablishment ||
        Number(resolvedEstablishment.app_id) !== Number(appId)
      ) {
        throw new Error("Esta barbearia não pertence à Rasoio.");
      }

      setEstablishment(resolvedEstablishment);
      setAllItems(
        Array.isArray(itemsResponse?.data?.items)
          ? itemsResponse.data.items
          : []
      );
    } catch (error) {
      setApiError(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Erro ao buscar itens do estabelecimento."
      );
      setAllItems([]);
      setEstablishment(null);
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    fetchItems();
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
    reload: fetchItems,
  };
}
