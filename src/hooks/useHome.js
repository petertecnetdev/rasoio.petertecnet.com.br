// src/hooks/useHome.js
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const getFileUrlByType = (files, type) =>
  Array.isArray(files) ? files.find((f) => f?.type === type)?.public_url ?? null : null;

const getFirstFileUrl = (files, types = []) => {
  if (!Array.isArray(files)) return null;
  for (const t of types) {
    const url = getFileUrlByType(files, t);
    if (url) return url;
  }
  return null;
};

const normalizeItemType = (rawType, item) => {
  const t = rawType ?? item?.item_type ?? item?.kind ?? item?.category?.type ?? item?.category_type;

  if (item?.is_product === true || item?.isProduct === true) return "product";
  if (item?.is_service === true || item?.isService === true) return "service";

  if (item?.product_id || item?.productId) return "product";
  if (item?.service_id || item?.serviceId) return "service";

  if (t === 1 || t === "1") return "service";
  if (t === 2 || t === "2") return "product";

  const s = String(t ?? "").trim().toLowerCase();

  if (!s) return "";

  if (s === "product" || s === "products" || s.includes("prod")) return "product";
  if (s === "service" || s === "services" || s.includes("serv")) return "service";

  if (s === "produto" || s === "produtos") return "product";
  if (s === "servico" || s === "serviços" || s === "servicos") return "service";

  return s;
};

const distributeItems = (items) => {
  const groups = items.reduce((acc, item) => {
    const estId =
      item?.establishment_id ??
      item?.entity_id ??
      item?.entityId ??
      item?.establishment?.id ??
      "unknown";

    if (!acc[estId]) acc[estId] = [];
    acc[estId].push(item);
    return acc;
  }, {});

  const result = [];
  let lastEstId = null;

  while (Object.keys(groups).length) {
    const previousEstId = lastEstId;
    const candidates = Object.keys(groups).filter(
      (id) => id !== previousEstId && groups[id]?.length
    );

    const selectedId = candidates.length
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : Object.keys(groups)[0];

    const item = groups[selectedId].shift();
    result.push(item);
    lastEstId = selectedId;

    if (!groups[selectedId].length) delete groups[selectedId];
  }

  return result;
};

export default function useHome(apiBaseUrl, appId) {
  const [establishments, setEstablishments] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [serviceItems, setServiceItems] = useState([]);
  const [productItems, setProductItems] = useState([]);
  const [stats, setStats] = useState({
    top_establishments_views: [],
    top_items_views: [],
    total_views: 0,
    dau: 0,
    mau: 0,
    dau_mau_ratio: 0,
  });
  const [highlights, setHighlights] = useState({});
  const [homePayload, setHomePayload] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentInteractions, setRecentInteractions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const city = localStorage.getItem("selectedCity") || "";
  const uf = localStorage.getItem("selectedUF") || "";

  const query = useMemo(() => {
    return city && uf ? `?city=${encodeURIComponent(city)}&uf=${encodeURIComponent(uf)}` : "";
  }, [city, uf]);

  useEffect(() => {
    let active = true;

    async function loadHome() {
      setIsLoading(true);
      setError(null);

      try {
        const [homeRes, estRes, empRes, itemRes] = await Promise.all([
          axios.get(`${apiBaseUrl}/home/${appId}${query}`),
          axios.get(`${apiBaseUrl}/establishment/home/${appId}${query}`),
          axios.get(`${apiBaseUrl}/employer/home/${appId}${query}`),
          axios.get(`${apiBaseUrl}/item/home/${appId}${query}`),
        ]);

        if (!active) return;

        const mappedEstablishments = (estRes.data?.establishments || []).map((est) => {
          const logo = getFileUrlByType(est?.files, "logo");
          const bg = getFileUrlByType(est?.files, "background");
          return {
            ...est,
            type: "establishment",
            name: est?.name,
            image: logo || bg || null,
            images: {
              logo,
              background: bg,
            },
          };
        });

        const mappedEmployers = (empRes.data?.employers || []).map((emp) => {
          const firstName = emp?.user?.first_name || "";
          const lastName = emp?.user?.last_name || "";
          const fullName = `${firstName} ${lastName}`.trim();

          const avatar = getFileUrlByType(emp?.user?.files, "avatar");

          return {
            ...emp,
            type: "employer",
            name: fullName || firstName || "Colaborador",
            first_name: firstName,
            last_name: lastName,
            avatar,
            image: avatar,
            user: emp?.user,
          };
        });

        const schedulableEstablishmentIds = new Set(
          mappedEmployers
            .map((employer) =>
              employer?.establishment_id ??
              employer?.establishmentId ??
              employer?.entity_id ??
              employer?.entityId ??
              employer?.establishment?.id ??
              null
            )
            .filter((id) => id != null)
            .map((id) => String(id))
        );

        const establishmentsWithAvailability = mappedEstablishments.map((establishment) => ({
          ...establishment,
          can_schedule: schedulableEstablishmentIds.has(String(establishment?.id)),
        }));

        const mappedItems = (itemRes.data?.items || []).map((item) => {
          const normalizedType = normalizeItemType(item?.type, item);

          const estId =
            item?.establishment_id ??
            item?.entity_id ??
            item?.entityId ??
            item?.establishment?.id ??
            null;

          const image = getFirstFileUrl(item?.files, [
            "image",
            "photo",
            "cover",
            "avatar",
            "logo",
            "background",
          ]);

          return {
            ...item,
            establishment_id: estId,
            entity_id: item?.entity_id ?? item?.entityId ?? estId ?? null,
            type: normalizedType,
            image,
            can_schedule:
              normalizedType === "product"
                ? false
                : estId != null && schedulableEstablishmentIds.has(String(estId)),
          };
        });

        const orderedItems = distributeItems(mappedItems);

        const services = orderedItems.filter((i) => i?.type === "service");
        const products = orderedItems.filter((i) => i?.type === "product");

        setEstablishments(establishmentsWithAvailability);
        setEmployers(mappedEmployers);
        setServiceItems(services);
        setProductItems(products);

        setStats({
          top_establishments_views: estRes.data?.stats?.top_establishments_views || [],
          top_items_views: itemRes.data?.stats?.top_items_views || [],
          total_views:
            (estRes.data?.stats?.total_views || 0) + (itemRes.data?.stats?.total_views || 0),
          dau: estRes.data?.stats?.dau || 0,
          mau: estRes.data?.stats?.mau || 0,
          dau_mau_ratio: estRes.data?.stats?.dau_mau_ratio || 0,
        });

        setHighlights(homeRes.data?.highlights || {});
        setHomePayload(homeRes.data?.payload || {});
        setRecentOrders(homeRes.data?.recent_orders || []);
        setRecentInteractions(homeRes.data?.recent_interactions || []);
      } catch (err) {
        if (!active) return;

        const msg =
          typeof err?.response?.data?.message === "string"
            ? err.response.data.message
            : "Erro ao carregar a home.";

        setError(msg);

        Swal.fire({
          icon: "error",
          title: "Erro",
          text: msg,
        });
      } finally {
        if (active) setIsLoading(false);
      }
    }

    if (appId) loadHome();
    else {
      setError("app_id não informado.");
      setIsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [apiBaseUrl, appId, query]);

  return {
    establishments,
    employers,
    serviceItems,
    productItems,
    stats,
    highlights,
    homePayload,
    recentOrders,
    recentInteractions,
    isLoading,
    error,
  };
}
