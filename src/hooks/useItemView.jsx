// src/hooks/useItemView.js
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

const getItemImageFromFiles = (files) => {
  if (!Array.isArray(files) || !files.length) return null;
  return (
    files.find((f) => f?.type === "image")?.public_url ??
    files.find((f) => f?.type === "cover")?.public_url ??
    files[0]?.public_url ??
    null
  );
};

const getUserAvatarFromFiles = (files) => {
  if (!Array.isArray(files) || !files.length) return null;
  return (
    files.find((f) => f?.type === "avatar")?.public_url ??
    files.find((f) => f?.type === "profile")?.public_url ??
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

export default function useItemView(apiBaseUrl, slug, token, navigate) {
  const [item, setItem] = useState(null);
  const [establishment, setEstablishment] = useState(null);

  const [employers, setEmployers] = useState([]);
  const [otherItems, setOtherItems] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;

    let active = true;

    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // ✅ view do item
        const itemRes = await axios.get(`${apiBaseUrl}/item/view/${slug}`, { headers });

        if (!active) return;

        const d = itemRes.data || {};
        const itemData = d.item || null;
        const establishmentData = d.establishment || null;

        if (!itemData) {
          setItem(null);
          setEstablishment(null);
          setEmployers([]);
          setOtherItems([]);
          return;
        }

        const itemType = itemData?.type || itemData?.item_type || null;

        // ✅ entityId do item (establishment_id)
        const entityId =
          itemData?.entity_id ??
          itemData?.entityId ??
          itemData?.establishment_id ??
          establishmentData?.id ??
          null;

        const itemImage =
          itemData?.imageUrl ||
          itemData?.image_url ||
          itemData?.image ||
          getItemImageFromFiles(itemData?.files) ||
          null;

        setItem({
          ...itemData,
          type: "item",
          item_type: itemType,
          image: itemImage,
          imageUrl: itemImage,
        });

        setEstablishment(normalizeEstablishment(establishmentData));

        // ✅ relacionados: employers do MESMO estabelecimento (entityId)
        // ✅ outros itens: SOMENTE do mesmo tipo (product/service) dentro do mesmo estabelecimento
        if (entityId) {
          const [employersRes, itemsRes] = await Promise.all([
            axios.get(`${apiBaseUrl}/employer/list-by-entity/${entityId}`, { headers }),
            axios.get(`${apiBaseUrl}/item/list-by-entity/${entityId}`, { headers }),
          ]);

          if (!active) return;

          // employers por entity
          const rawEmployers = Array.isArray(employersRes?.data?.employers)
            ? employersRes.data.employers
            : [];

          setEmployers(
            rawEmployers.map((emp) => {
              const u = emp.user || {};
              const name =
                `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
                u.user_name ||
                "Profissional";

              const avatar =
                getUserAvatarFromFiles(u.files) ??
                u.avatar ??
                emp.avatar ??
                "/images/user.png";

              return {
                ...emp,
                type: "employer",
                name,
                user_name: emp.user_name || u.user_name || null,
                avatar,
                image: avatar,
                user: {
                  ...u,
                  avatar,
                },
              };
            })
          );

          // itens do mesmo estabelecimento (mesmo tipo do item atual)
          const rawItems = Array.isArray(itemsRes?.data?.items) ? itemsRes.data.items : [];

          setOtherItems(
            rawItems
              .filter((it) => it?.slug !== slug && it?.id !== itemData?.id)
              .filter((it) => {
                const t = it?.type || it?.item_type || null;
                // se o item atual não tiver tipo, não filtra por tipo
                if (!itemType) return true;
                return t === itemType;
              })
              .map((it) => {
                const img =
                  getItemImageFromFiles(it?.files) ??
                  it?.image ??
                  it?.image_url ??
                  it?.imageUrl ??
                  null;

                return {
                  ...it,
                  type: "item",
                  item_type: it?.type || it?.item_type || null,
                  image: img,
                  imageUrl: img,
                };
              })
          );
        } else {
          setEmployers([]);
          setOtherItems([]);
        }
      } catch (err) {
        const status = err?.response?.status;
        const data = err?.response?.data || {};
        const msg =
          data?.message ||
          data?.error ||
          err?.message ||
          "Erro ao carregar o item.";

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

        setError(data || err);
        setItem(null);
        setEstablishment(null);
        setEmployers([]);
        setOtherItems([]);

        if (typeof navigate === "function") {
          Promise.resolve().then(() => navigate("/"));
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [apiBaseUrl, slug, token, navigate]);

  return {
    item,
    establishment,
    employers,
    otherItems,
    isLoading,
    error,
  };
}
