import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function useItemView(apiBaseUrl, slug, token, navigate) {
  const [item, setItem] = useState(null);
  const [entity, setEntity] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [interactionSummary, setInteractionSummary] = useState(null);
  const [userInteractions, setUserInteractions] = useState([]);
  const [ordersSummary, setOrdersSummary] = useState(null);
  const [otherEstablishments, setOtherEstablishments] = useState([]);
  const [otherEmployers, setOtherEmployers] = useState([]);
  const [otherItems, setOtherItems] = useState([]);
  const [topEmployer, setTopEmployer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/item/view/${slug}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!active) return;

        const d = res.data || {};

        setItem(d.item ?? null);
        setEntity(d.entity ?? null);
        setMetrics(d.metrics ?? null);
        setInteractionSummary(d.interaction_summary ?? null);
        setUserInteractions(d.user_interactions ?? []);
        setOrdersSummary(d.orders_summary ?? null);
        setOtherEstablishments(d.other_establishments ?? []);
        setOtherEmployers(d.other_employers ?? []);
        setOtherItems(d.other_items ?? []);
        setTopEmployer(d.top_employer ?? null);
      } catch (err) {
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          "Erro ao carregar o item.";

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
  }, [apiBaseUrl, slug, token, navigate]);

  return {
    item,
    entity,
    metrics,
    interactionSummary,
    userInteractions,
    ordersSummary,
    otherEstablishments,
    otherEmployers,
    otherItems,
    topEmployer,
    isLoading,
  };
}
