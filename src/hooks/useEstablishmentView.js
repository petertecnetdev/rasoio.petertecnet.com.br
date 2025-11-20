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

        setEstablishment(d.establishment || null);
        setMetrics(d.metrics || null);
        setInteractionSummary(d.interaction_summary || null);
        setUserInteractions(d.user_interactions || []);
        setOtherEstablishments(d.other_establishments || []);

        // 🔥 EMPLOYERS - padronização exata do backend
        setOtherEmployers(
          (d.other_employers || []).map(emp => ({
            ...emp,
            type: "employer",
            slug: emp.user_name,
            images: {
              avatar: emp.avatar || emp.images?.avatar || null,
              gallery: emp.images?.gallery || [],
            }
          }))
        );

        // self employers list
        setEmployers(
          (d.establishment?.employers || []).map(emp => ({
            ...emp,
            type: "employer",
            slug: emp.user_name,
            images: {
              avatar: emp.avatar || emp.images?.avatar || null,
              gallery: emp.images?.gallery || [],
            }
          }))
        );

        // ITEMS
        setItems(
          (d.items || []).map(it => ({
            ...it,
            type: it.type || "item",
            slug: it.slug,
            images: {
              avatar: it.image || null,
              gallery: it.images?.gallery || []
            }
          }))
        );

        setOtherItems(
          (d.other_items || []).map(it => ({
            ...it,
            type: it.type || "item",
            slug: it.slug,
            images: {
              avatar: it.image || null,
              gallery: []
            }
          }))
        );

        setOrdersSummary(d.orders_summary || null);
        setCompletedAppointments(d.completed_appointments || []);
      } catch (err) {
        const msg =
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
