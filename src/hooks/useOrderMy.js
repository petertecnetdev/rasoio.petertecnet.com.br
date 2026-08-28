// src/hooks/useOrderMy.js
import { useCallback, useEffect, useState } from "react";
import { appId } from "../config";
import api from "../services/api";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function toMs(value) {
  const timestamp = new Date(value || "").getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getLatestFileByType(files, type) {
  const list = safeArray(files).filter((file) => file && file.type === type);
  if (!list.length) return null;

  return list.slice().sort((a, b) => {
    const byDate = toMs(b.created_at) - toMs(a.created_at);
    if (byDate !== 0) return byDate;
    return Number(b.id || 0) - Number(a.id || 0);
  })[0];
}

function normalizeFile(file, fallbackType) {
  if (!file) return null;
  return {
    id: file.id ?? null,
    type: file.type ?? fallbackType,
    path: file.path ?? null,
    url: file.public_url ?? file.url ?? null,
    public_url: file.public_url ?? file.url ?? null,
    created_at: file.created_at ?? null,
  };
}

function normalizeOrder(order) {
  const source = order || {};
  const establishment = source.establishment || null;
  const employer = source.employer || source.attendant || null;
  const employerUser = employer?.user || null;

  const establishmentLogo = getLatestFileByType(establishment?.files, "logo");
  const establishmentBackground = getLatestFileByType(establishment?.files, "background");
  const employerAvatar = getLatestFileByType(employerUser?.files, "avatar");

  return {
    ...source,
    establishment: establishment
      ? {
          ...establishment,
          files: {
            logo: normalizeFile(establishmentLogo, "logo"),
            background: normalizeFile(establishmentBackground, "background"),
          },
        }
      : null,
    employer: employer
      ? {
          ...employer,
          user: employerUser
            ? {
                ...employerUser,
                files: {
                  avatar: normalizeFile(employerAvatar, "avatar"),
                },
              }
            : null,
        }
      : null,
  };
}

export default function useOrdersMy() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get(`/order/listmy/${appId}`);
      setOrders(safeArray(data?.orders).map(normalizeOrder));
    } catch (requestError) {
      setOrders([]);
      setError(
        requestError?.response?.data?.message ||
          requestError?.response?.data?.error ||
          "Erro ao carregar seus agendamentos."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { orders, loading, error, refresh };
}
