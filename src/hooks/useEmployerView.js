// src/hooks/useEmployerView.js
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const buildValidationHtml = (errorsObj) => {
  if (!errorsObj || typeof errorsObj !== "object") return "";
  const entries = Object.entries(errorsObj);
  if (!entries.length) return "";

  return `
    <div style="text-align:left;">
      ${entries
        .map(([field, messages]) => {
          const msgs = Array.isArray(messages) ? messages : [String(messages)];
          return `
            <div style="padding:10px 12px;border:1px solid rgba(255,255,255,0.10);border-radius:12px;margin:8px 0;background:rgba(255,255,255,0.03);">
              <div style="font-weight:800;margin-bottom:6px;">${String(field)}</div>
              ${msgs.map((m) => `<div style="margin-top:4px;">• ${String(m)}</div>`).join("")}
            </div>
          `;
        })
        .join("")}
    </div>
  `;
};

const showApiError = (title, msg, errors) => {
  const html = buildValidationHtml(errors);
  Swal.fire({
    icon: "error",
    title: title || "Erro",
    html: html || `<div style="opacity:.95">${msg || "Ocorreu um erro na solicitação."}</div>`,
    confirmButtonText: "OK",
  });
};

const getAvatarFromFiles = (files) => {
  if (!Array.isArray(files) || !files.length) return null;
  return (
    files.find((f) => f?.type === "avatar")?.public_url ??
    files.find((f) => f?.type === "profile")?.public_url ??
    files[0]?.public_url ??
    null
  );
};

const getItemImageFromFiles = (files) => {
  if (!Array.isArray(files) || !files.length) return null;
  return (
    files.find((f) => f?.type === "image")?.public_url ??
    files.find((f) => f?.type === "cover")?.public_url ??
    files[0]?.public_url ??
    null
  );
};

const normalizeEstablishment = (est) => {
  if (!est) return null;

  return {
    ...est,
    images: {
      logo: est.files?.find((f) => f.type === "logo")?.public_url ?? est.logo ?? null,
      background:
        est.files?.find((f) => f.type === "background")?.public_url ??
        est.background ??
        null,
      gallery: est.files
        ?.filter((f) => !["logo", "background"].includes(f.type))
        .map((f) => f.public_url),
    },
  };
};

export default function useEmployerView(apiBaseUrl, identifier, token, navigate) {
  const [employer, setEmployer] = useState(null);
  const [establishment, setEstablishment] = useState(null);

  const [metrics, setMetrics] = useState(null);
  const [interactionSummary, setInteractionSummary] = useState(null);
  const [userInteractions, setUserInteractions] = useState([]);

  // ✅ outros profissionais: DO MESMO ESTABELECIMENTO
  const [otherEmployers, setOtherEmployers] = useState([]);

  // ✅ pode manter (ou remover se não usar na page)
  const [otherEstablishments, setOtherEstablishments] = useState([]);
  const [otherItems, setOtherItems] = useState([]);

  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]); // compat: services

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      setIsLoading(true);

      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // ✅ employer view recebe user_name (identifier)
        const username = String(identifier || "").trim();

        const res = await axios.get(
          `${apiBaseUrl}/employer/view/${encodeURIComponent(username)}`,
          { headers }
        );

        if (!active) return;

        const d = res.data || {};
        const emp = d.employer || null;

        if (!emp) {
          setEmployer(null);
          setEstablishment(null);
          setMetrics(null);
          setInteractionSummary(null);
          setUserInteractions([]);
          setServices([]);
          setProducts([]);
          setItems([]);
          setOtherEmployers([]);
          setOtherEstablishments([]);
          setOtherItems([]);
          return;
        }

        const u = emp.user || {};
        const resolvedUserName = u.user_name || emp.user_name || username || null;

        const name =
          `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
          resolvedUserName ||
          "Profissional";

        const avatar =
          getAvatarFromFiles(emp.files) ??
          getAvatarFromFiles(u.files) ??
          u.avatar ??
          emp.avatar ??
          null;

        const est = emp.establishment || null;

        setEmployer({
          ...emp,
          type: "employer",
          name,
          user_name: resolvedUserName,
          avatar,
        });

        setEstablishment(normalizeEstablishment(est));

        setMetrics(d.metrics || emp.metrics || null);
        setInteractionSummary(d.interaction_summary || null);
        setUserInteractions(d.user_interactions || []);

        // ✅ entityKey = establishment_id (prioridade) / slug / id / identifier
        const entityKey =
          emp?.establishment_id ??
          est?.id ??
          est?.slug ??
          est?.identifier ??
          null;

        if (entityKey) {
          // ✅ Itens do estabelecimento
          // ✅ Outros estabelecimentos (mantém seu padrão atual)
          // ✅ Outros itens (mantém seu padrão atual)
          // ✅ Outros employers: agora = list-by-entity (mesmo estabelecimento)
          const [itemsRes, otherEstRes, otherItemsRes, employersSameEntityRes] =
            await Promise.all([
              axios.get(`${apiBaseUrl}/item/list-by-entity/${entityKey}`, { headers }),
              axios.get(`${apiBaseUrl}/establishment/list-others/${entityKey}`, { headers }),
              axios.get(`${apiBaseUrl}/item/list-others/${entityKey}`, { headers }),
              axios.get(`${apiBaseUrl}/employer/list-by-entity/${entityKey}`, { headers }),
            ]);

          if (!active) return;

          // itens (services/prods)
          const rawItems = Array.isArray(itemsRes?.data?.items) ? itemsRes.data.items : [];
          const normalizedItems = rawItems.map((it) => ({
            ...it,
            image: getItemImageFromFiles(it?.files) ?? it?.image ?? null,
          }));

          const onlyServices = normalizedItems
            .filter((it) => it?.type === "service")
            .map((it) => ({
              ...it,
              type: "item",
              item_type: "service",
            }));

          const onlyProducts = normalizedItems
            .filter((it) => it?.type === "product")
            .map((it) => ({
              ...it,
              type: "item",
              item_type: "product",
            }));

          setServices(onlyServices);
          setProducts(onlyProducts);
          setItems(onlyServices);

          // outros estabelecimentos (mantém)
          setOtherEstablishments(
            (otherEstRes?.data?.establishments || []).map((e) => ({
              ...e,
              type: "establishment",
              images: {
                logo: e.files?.find((f) => f.type === "logo")?.public_url ?? e.logo ?? null,
                background:
                  e.files?.find((f) => f.type === "background")?.public_url ??
                  e.background ??
                  null,
              },
            }))
          );

          // outros itens (mantém)
          setOtherItems(
            (otherItemsRes?.data?.items || []).map((it) => ({
              ...it,
              type: "item",
              item_type: it?.type || null,
              image: getItemImageFromFiles(it?.files) ?? it?.image ?? null,
            }))
          );

          // ✅ outros employers do MESMO estabelecimento (filtra removendo o atual)
          const rawSameEmployers = Array.isArray(employersSameEntityRes?.data?.employers)
            ? employersSameEntityRes.data.employers
            : [];

          setOtherEmployers(
            rawSameEmployers
              .filter((oe) => Number(oe?.id) !== Number(emp?.id))
              .map((oe) => {
                const ou = oe.user || {};
                const ouUserName = oe.user_name || ou.user_name || null;

                const otherName =
                  `${ou.first_name || ""} ${ou.last_name || ""}`.trim() ||
                  ouUserName ||
                  oe.name ||
                  "Profissional";

                const otherAvatar =
                  getAvatarFromFiles(oe?.files) ??
                  getAvatarFromFiles(ou?.files) ??
                  ou.avatar ??
                  oe.avatar ??
                  null;

                return {
                  ...oe,
                  type: "employer",
                  name: otherName,
                  user_name: ouUserName,
                  avatar: otherAvatar,
                };
              })
          );
        } else {
          setServices([]);
          setProducts([]);
          setItems([]);
          setOtherEmployers([]);
          setOtherEstablishments([]);
          setOtherItems([]);
        }
      } catch (err) {
        const status = err?.response?.status;
        const data = err?.response?.data || {};
        const msg =
          data?.message ||
          data?.error ||
          err?.message ||
          "Erro ao carregar o profissional.";

        const errors = data?.errors || null;

        if (status === 422 && errors) {
          showApiError("Erro de validação", msg, errors);
        } else {
          Swal.fire({
            icon: "error",
            title: "Erro",
            text: msg,
          });
        }

        Promise.resolve().then(() => navigate("/"));
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [identifier, token, navigate, apiBaseUrl]);

  return {
    employer,
    establishment,

    metrics,
    interactionSummary,
    userInteractions,

    otherEmployers, // ✅ agora mesmo estabelecimento
    otherEstablishments,
    otherItems,

    services,
    products,
    items,

    isLoading,
  };
}
