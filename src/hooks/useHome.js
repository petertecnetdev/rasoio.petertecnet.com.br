// src/hooks/useHome.js
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import {
  canScheduleItem,
  isSchedulableEstablishment,
} from "../utils/schedulingCapabilities";

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

const establishmentIdOf = (entity) =>
  entity?.establishment_id ??
  entity?.entity_id ??
  entity?.entityId ??
  entity?.establishment?.id ??
  null;

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
          // Highlights/analytics enrich the home but must not take the public catalog down.
          axios.get(`${apiBaseUrl}/home/${appId}${query}`).catch(() => ({ data: {} })),
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
            name: fullName || firstName || "Profissional",
            first_name: firstName,
            last_name: lastName,
            avatar,
            image: avatar,
            user: emp?.user,
          };
        });

        const mappedItems = (itemRes.data?.items || []).map((item) => {
          const normalizedType = normalizeItemType(item?.type, item);
          const estId = establishmentIdOf(item);
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
          };
        });

        const orderedItems = distributeItems(mappedItems);
        const rawServices = orderedItems.filter((item) => item?.type === "service");
        const products = orderedItems.filter((item) => item?.type === "product");

        const establishmentsWithAvailability = mappedEstablishments.map((establishment) => ({
          ...establishment,
          can_schedule: isSchedulableEstablishment({
            establishment,
            employers: mappedEmployers,
            services: rawServices,
          }),
        }));

        const establishmentById = new Map(
          establishmentsWithAvailability.map((establishment) => [String(establishment.id), establishment])
        );

        const employersWithAvailability = mappedEmployers.map((employer) => {
          const establishment = establishmentById.get(String(establishmentIdOf(employer)));
          return {
            ...employer,
            can_schedule: Boolean(establishment?.can_schedule),
          };
        });

        const services = rawServices.map((item) => {
          const establishment = establishmentById.get(String(establishmentIdOf(item)));
          return {
            ...item,
            can_schedule: canScheduleItem({
              item,
              establishment,
              employers: mappedEmployers,
              services: rawServices,
            }),
          };
        });

        setEstablishments(establishmentsWithAvailability);
        setEmployers(employersWithAvailability);
        setServiceItems(services);
        setProductItems(products.map((item) => ({ ...item, can_schedule: false })));

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
            : "Não foi possível carregar os estabelecimentos e serviços agora.";

        setError(msg);

        Swal.fire({
          icon: "error",
          title: "Não foi possível carregar a Rasoio",
          text: msg,
        });
      } finally {
        if (active) setIsLoading(false);
      }
    }

    if (appId) loadHome();
    else {
      setError("Contexto da aplicação não informado.");
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
