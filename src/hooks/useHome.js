// src/hooks/useHome.js
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import api from "../services/api";
import { getApiErrorMessage, isRequestCanceled } from "../utils/apiError";

const getFileUrlByType = (files, type) =>
  Array.isArray(files) ? files.find((file) => file?.type === type)?.public_url ?? null : null;

const getFirstFileUrl = (files, types = []) => {
  if (!Array.isArray(files)) return null;
  for (const type of types) {
    const url = getFileUrlByType(files, type);
    if (url) return url;
  }
  return null;
};

const normalizeItemType = (rawType, item) => {
  const type =
    rawType ?? item?.item_type ?? item?.kind ?? item?.category?.type ?? item?.category_type;

  if (item?.is_product === true || item?.isProduct === true) return "product";
  if (item?.is_service === true || item?.isService === true) return "service";
  if (item?.product_id || item?.productId) return "product";
  if (item?.service_id || item?.serviceId) return "service";
  if (type === 1 || type === "1") return "service";
  if (type === 2 || type === "2") return "product";

  const value = String(type ?? "").trim().toLowerCase();
  if (!value) return "";
  if (value === "product" || value === "products" || value.includes("prod")) return "product";
  if (value === "service" || value === "services" || value.includes("serv")) return "service";
  if (value === "produto" || value === "produtos") return "product";
  if (value === "servico" || value === "serviços" || value === "servicos") return "service";
  return value;
};

const distributeItems = (items) => {
  const groups = items.reduce((accumulator, item) => {
    const establishmentId =
      item?.establishment_id ??
      item?.entity_id ??
      item?.entityId ??
      item?.establishment?.id ??
      "unknown";

    if (!accumulator[establishmentId]) accumulator[establishmentId] = [];
    accumulator[establishmentId].push(item);
    return accumulator;
  }, {});

  const result = [];
  let lastEstablishmentId = null;

  while (Object.keys(groups).length) {
    const candidates = Object.keys(groups).filter(
      (id) => id !== lastEstablishmentId && groups[id]?.length
    );
    const selectedId = candidates.length
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : Object.keys(groups)[0];

    result.push(groups[selectedId].shift());
    lastEstablishmentId = selectedId;
    if (!groups[selectedId].length) delete groups[selectedId];
  }

  return result;
};

export default function useHome(_apiBaseUrl, appId) {
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
  const params = useMemo(() => (city && uf ? { city, uf } : undefined), [city, uf]);

  useEffect(() => {
    if (!appId) {
      setError("Aplicação não identificada.");
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    async function loadHome() {
      setIsLoading(true);
      setError(null);

      const requestConfig = { params, signal: controller.signal };

      try {
        const [homeRes, establishmentRes, employerRes, itemRes] = await Promise.all([
          api.get(`/home/${appId}`, requestConfig),
          api.get(`/establishment/home/${appId}`, requestConfig),
          api.get(`/employer/home/${appId}`, requestConfig),
          api.get(`/item/home/${appId}`, requestConfig),
        ]);

        const mappedEstablishments = (establishmentRes.data?.establishments || []).map(
          (establishment) => {
            const logo = getFileUrlByType(establishment?.files, "logo");
            const background = getFileUrlByType(establishment?.files, "background");
            return {
              ...establishment,
              type: "establishment",
              name: establishment?.name,
              image: logo || background || null,
              images: { logo, background },
            };
          }
        );

        const mappedEmployers = (employerRes.data?.employers || []).map((employer) => {
          const firstName = employer?.user?.first_name || "";
          const lastName = employer?.user?.last_name || "";
          const fullName = `${firstName} ${lastName}`.trim();
          const avatar = getFileUrlByType(employer?.user?.files, "avatar");

          return {
            ...employer,
            type: "employer",
            name: fullName || firstName || "Profissional",
            first_name: firstName,
            last_name: lastName,
            avatar,
            image: avatar,
            user: employer?.user,
          };
        });

        const mappedItems = (itemRes.data?.items || []).map((item) => {
          const establishmentId =
            item?.establishment_id ??
            item?.entity_id ??
            item?.entityId ??
            item?.establishment?.id ??
            null;

          return {
            ...item,
            establishment_id: establishmentId,
            entity_id: item?.entity_id ?? item?.entityId ?? establishmentId,
            type: normalizeItemType(item?.type, item),
            image: getFirstFileUrl(item?.files, [
              "image",
              "photo",
              "cover",
              "avatar",
              "logo",
              "background",
            ]),
          };
        });

        const orderedItems = distributeItems(mappedItems);
        setEstablishments(mappedEstablishments);
        setEmployers(mappedEmployers);
        setServiceItems(orderedItems.filter((item) => item?.type === "service"));
        setProductItems(orderedItems.filter((item) => item?.type === "product"));
        setStats({
          top_establishments_views: establishmentRes.data?.stats?.top_establishments_views || [],
          top_items_views: itemRes.data?.stats?.top_items_views || [],
          total_views:
            (establishmentRes.data?.stats?.total_views || 0) +
            (itemRes.data?.stats?.total_views || 0),
          dau: establishmentRes.data?.stats?.dau || 0,
          mau: establishmentRes.data?.stats?.mau || 0,
          dau_mau_ratio: establishmentRes.data?.stats?.dau_mau_ratio || 0,
        });
        setHighlights(homeRes.data?.highlights || {});
        setHomePayload(homeRes.data?.payload || {});
        setRecentOrders(homeRes.data?.recent_orders || []);
        setRecentInteractions(homeRes.data?.recent_interactions || []);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        const message = getApiErrorMessage(requestError, "Erro ao carregar a página inicial.");
        setError(message);
        await Swal.fire({ icon: "error", title: "Erro", text: message });
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadHome();
    return () => controller.abort();
  }, [appId, params]);

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
