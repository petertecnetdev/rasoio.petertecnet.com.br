// src/hooks/useEstablishmentView.js
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function useEstablishmentView(apiBaseUrl, slug, token, navigate) {
  const [establishment, setEstablishment] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [interactionSummary, setInteractionSummary] = useState(null);
  const [userInteractions, setUserInteractions] = useState([]);
  const [otherEstablishments, setOtherEstablishments] = useState([]);
  const [otherEmployers, setOtherEmployers] = useState([]);
  const [otherItems, setOtherItems] = useState([]);
  const [items, setItems] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [ordersSummary, setOrdersSummary] = useState(null);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/establishment/view/${slug}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!active) return;

        const d = res.data || {};

        const est = d.establishment || null;
        setEstablishment(
          est
            ? {
                ...est,
                images: {
                  logo: est.images?.logo ?? est.logo ?? null,
                  background: est.images?.background ?? est.background ?? null,
                  gallery: est.images?.gallery ?? [],
                  files: est.images?.files ?? [],
                },
              }
            : null
        );

        setMetrics(d.metrics || null);
        setInteractionSummary(d.interaction_summary || null);
        setUserInteractions(d.user_interactions || []);
        setOrdersSummary(d.orders_summary || null);
        setCompletedAppointments(d.completed_appointments || []);

        setItems(
          (d.items || []).map((it) => {
            const img = it.images || {};
            return {
              ...it,
              type: it.type || "item",
              slug: it.slug,
              images: {
                avatar: img.avatar ?? it.image ?? null,
                gallery: img.gallery ?? [],
                files: img.files ?? [],
              },
            };
          })
        );

        setEmployers(
          (d.employers || []).map((emp) => {
            const img = emp.images || {};
            return {
              ...emp,
              type: "employer",
              slug: emp.slug,
              images: {
                avatar: img.avatar ?? null,
                gallery: img.gallery ?? [],
                files: img.files ?? [],
              },
            };
          })
        );

        setOtherEstablishments(
          (d.other_establishments || []).map((e) => {
            const img = e.images || {};
            return {
              ...e,
              type: "establishment",
              slug: e.slug,
              images: {
                logo: img.logo ?? e.logo ?? null,
                background: img.background ?? e.background ?? null,
                gallery: img.gallery ?? [],
                files: img.files ?? [],
              },
            };
          })
        );

        setOtherEmployers(
          (d.other_employers || []).map((emp) => {
            const img = emp.images || {};
            return {
              ...emp,
              type: "employer",
              slug: emp.slug || emp.user_name,
              images: {
                avatar: img.avatar ?? emp.avatar ?? null,
                gallery: img.gallery ?? [],
                files: img.files ?? [],
              },
            };
          })
        );

        setOtherItems(
          (d.other_items || []).map((it) => {
            const img = it.images || {};
            return {
              ...it,
              type: "item",
              slug: it.slug,
              images: {
                avatar: img.avatar ?? it.image ?? null,
                gallery: img.gallery ?? [],
                files: img.files ?? [],
              },
            };
          })
        );
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Erro ao carregar o estabelecimento.";

        Swal.fire({
          icon: "error",
          title: "Erro",
          text: msg,
        }).then(() => navigate("/"));
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
    otherEstablishments,
    otherEmployers,
    otherItems,
    items,
    employers,
    ordersSummary,
    completedAppointments,
    isLoading,
  };
}
