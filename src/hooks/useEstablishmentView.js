// src/hooks/useEstablishmentView.js
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

export default function useEstablishmentView(apiBaseUrl, slug, token, navigate) {
  const [establishment, setEstablishment] = useState(null);

  const [metrics, setMetrics] = useState(null);
  const [interactionSummary, setInteractionSummary] = useState(null);
  const [userInteractions, setUserInteractions] = useState([]);
  const [ordersSummary, setOrdersSummary] = useState(null);
  const [completedAppointments, setCompletedAppointments] = useState([]);

  const [otherEstablishments, setOtherEstablishments] = useState([]);
  const [otherEmployers, setOtherEmployers] = useState([]);
  const [otherItems, setOtherItems] = useState([]);

  // ✅ separa serviços e produtos
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);

  // ✅ compatibilidade com a page antiga (items = serviços)
  const [items, setItems] = useState([]);

  const [employers, setEmployers] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const getEmployerAvatarFromFiles = (files) => {
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
        logo:
          est.files?.find((f) => f.type === "logo")?.public_url ??
          est.logo ??
          null,
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

  useEffect(() => {
    let active = true;

    (async () => {
      setIsLoading(true);

      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // ✅ View do estabelecimento
        const res = await axios.get(`${apiBaseUrl}/establishment/view/${slug}`, {
          headers,
        });

        if (!active) return;

        const d = res.data || {};
        const est = d.establishment || null;

        setEstablishment(normalizeEstablishment(est));
        setMetrics(est?.metrics || d.metrics || null);
        setInteractionSummary(d.interaction_summary || null);
        setUserInteractions(d.user_interactions || []);
        setOrdersSummary(d.orders_summary || null);
        setCompletedAppointments(d.completed_appointments || []);

        // ✅ relacionados
        const [itemsRes, employersRes, otherEstRes, otherItemsRes, otherEmpRes] =
          await Promise.all([
            axios.get(`${apiBaseUrl}/item/list-by-entity/${slug}`, { headers }),
            axios.get(`${apiBaseUrl}/employer/list-by-entity/${slug}`, { headers }),
            axios.get(`${apiBaseUrl}/establishment/list-others/${slug}`, { headers }),
            axios.get(`${apiBaseUrl}/item/list-others/${slug}`, { headers }),
            axios.get(`${apiBaseUrl}/employer/list-others/${slug}`, { headers }),
          ]);

        if (!active) return;

        // ✅ Itens do estabelecimento
        const rawItems = Array.isArray(itemsRes?.data?.items) ? itemsRes.data.items : [];
        const normalizedItems = rawItems.map((it) => ({
          ...it,
          image: getItemImageFromFiles(it?.files) ?? it?.image ?? null,
        }));

        const onlyServices = normalizedItems
          .filter((it) => it?.type === "service")
          .map((it) => ({
            ...it,
            type: "item", // GlobalCarousel espera "item"
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

        // ✅ compat (page antiga usa "items" como serviços)
        setItems(onlyServices);

        // ✅ Employers do estabelecimento
        setEmployers(
          (employersRes?.data?.employers || []).map((emp) => {
            const u = emp.user || {};
            const name =
              `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
              u.user_name ||
              "Profissional";

            const avatar = getEmployerAvatarFromFiles(u.files);

            return {
              ...emp,
              type: "employer",
              name,
              user_name: u.user_name || null,
              avatar,
            };
          })
        );

        // ✅ outros estabelecimentos
        setOtherEstablishments(
          (otherEstRes?.data?.establishments || []).map((e) => ({
            ...e,
            type: "establishment",
            images: {
              logo:
                e.files?.find((f) => f.type === "logo")?.public_url ??
                e.logo ??
                null,
              background:
                e.files?.find((f) => f.type === "background")?.public_url ??
                e.background ??
                null,
            },
          }))
        );

        // ✅ outros itens
        setOtherItems(
          (otherItemsRes?.data?.items || []).map((it) => ({
            ...it,
            type: "item",
            item_type: it?.type || null, // product/service (se vier)
            image: getItemImageFromFiles(it?.files) ?? it?.image ?? null,
          }))
        );

        // ✅ outros employers
        setOtherEmployers(
          (otherEmpRes?.data?.employers || []).map((emp) => {
            const u = emp.user || {};
            const name =
              emp.name ||
              `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
              u.user_name ||
              "Profissional";

            const avatar =
              emp.avatar ?? getEmployerAvatarFromFiles(u.files) ?? null;

            return {
              ...emp,
              type: "employer",
              name,
              user_name: emp.user_name || u.user_name || null,
              avatar,
            };
          })
        );
      } catch (err) {
        const status = err?.response?.status;
        const data = err?.response?.data || {};
        const msg =
          data?.message ||
          data?.error ||
          err?.message ||
          "Erro ao carregar o estabelecimento.";

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

        // ✅ volta pra home
        Promise.resolve().then(() => navigate("/"));
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [slug, token, navigate, apiBaseUrl]);

  return {
    establishment,
    metrics,
    interactionSummary,
    userInteractions,
    ordersSummary,
    completedAppointments,

    otherEstablishments,
    otherEmployers,
    otherItems,

    services,
    products,
    items, // compat

    employers,
    isLoading,
  };
}
