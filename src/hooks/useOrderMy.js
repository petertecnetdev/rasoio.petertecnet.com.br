// src/hooks/useOrderMy.js
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import { apiBaseUrl, appId } from "../config";

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function toMs(iso) {
  const t = new Date(iso || "").getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * ✅ pega o arquivo mais recente (created_at + id)
 */
function getLatestFileByType(files, type) {
  const list = safeArray(files).filter((f) => f && f.type === type);

  if (!list.length) return null;

  return list
    .slice()
    .sort((a, b) => {
      const ta = toMs(a.created_at);
      const tb = toMs(b.created_at);
      if (tb !== ta) return tb - ta;

      const ida = Number(a.id || 0);
      const idb = Number(b.id || 0);
      return idb - ida;
    })[0];
}

/**
 * ✅ Normaliza para o formato esperado pela OrderMyPage.jsx:
 * establishment.files.logo/background (obj)
 * employer.user.files.avatar (obj)
 */
function normalizeOrder(order) {
  const o = order || {};

  const est = o?.establishment || null;
  const emp = o?.employer || null;
  const user = emp?.user || null;

  const estFilesArray = safeArray(est?.files);
  const userFilesArray = safeArray(user?.files);

  const estLogo = getLatestFileByType(estFilesArray, "logo");
  const estBg = getLatestFileByType(estFilesArray, "background");
  const userAvatar = getLatestFileByType(userFilesArray, "avatar");

  return {
    ...o,

    establishment: est
      ? {
          ...est,
          files: {
            logo: estLogo
              ? {
                  id: estLogo?.id ?? null,
                  type: estLogo?.type ?? "logo",
                  path: estLogo?.path ?? null,
                  url: estLogo?.public_url ?? null,
                  public_url: estLogo?.public_url ?? null,
                  created_at: estLogo?.created_at ?? null,
                }
              : null,
            background: estBg
              ? {
                  id: estBg?.id ?? null,
                  type: estBg?.type ?? "background",
                  path: estBg?.path ?? null,
                  url: estBg?.public_url ?? null,
                  public_url: estBg?.public_url ?? null,
                  created_at: estBg?.created_at ?? null,
                }
              : null,
          },
        }
      : null,

    employer: emp
      ? {
          ...emp,
          user: user
            ? {
                ...user,
                files: {
                  avatar: userAvatar
                    ? {
                        id: userAvatar?.id ?? null,
                        type: userAvatar?.type ?? "avatar",
                        path: userAvatar?.path ?? null,
                        url: userAvatar?.public_url ?? null,
                        public_url: userAvatar?.public_url ?? null,
                        created_at: userAvatar?.created_at ?? null,
                      }
                    : null,
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
      const token = localStorage.getItem("token");

      const res = await axios.get(`${apiBaseUrl}/order/listmy/${appId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const rawOrders = safeArray(res?.data?.orders);

      // ✅ normaliza pra page
      const normalized = rawOrders.map(normalizeOrder);

      setOrders(normalized);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Erro ao carregar seus agendamentos.";

      setOrders([]);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    orders,
    loading,
    error,
    refresh,
  };
}
