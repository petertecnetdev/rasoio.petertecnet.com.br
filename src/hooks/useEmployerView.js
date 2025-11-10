import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function useEstablishmentView(apiBaseUrl, slug, token, navigate) {
  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [interactionSummary, setInteractionSummary] = useState(null);
  const [userInteractions, setUserInteractions] = useState([]);
  const [ordersSummary, setOrdersSummary] = useState(null);
  const [otherEstablishments, setOtherEstablishments] = useState([]);
  const [otherEmployers, setOtherEmployers] = useState([]);
  const [otherItems, setOtherItems] = useState([]);
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
        setItems(Array.isArray(d.items) ? d.items : []);

        setMetrics(() => {
          const m = d.metrics || null;
          if (!m || typeof m !== "object") return null;
          const clean = {};
          for (const [k, v] of Object.entries(m)) {
            if (
              v !== null &&
              v !== undefined &&
              typeof v !== "object" &&
              typeof v !== "function"
            ) {
              clean[k] = v;
            }
          }
          return clean;
        });

        setInteractionSummary(d.interaction_summary || null);
        setUserInteractions(Array.isArray(d.user_interactions) ? d.user_interactions : []);
        setOrdersSummary(d.orders_summary || null);
        setOtherEstablishments(Array.isArray(d.other_establishments) ? d.other_establishments : []);
        setOtherEmployers(Array.isArray(d.other_employers) ? d.other_employers : []);
        setOtherItems(Array.isArray(d.other_items) ? d.other_items : []);
      } catch (err) {
        const msg =
          err?.response?.data?.details ||
          err?.response?.data?.error ||
          "Não foi possível carregar o estabelecimento.";
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
  }, [slug, token, navigate]);

  return {
    establishment,
    items,
    metrics,
    interactionSummary,
    userInteractions,
    ordersSummary,
    otherEstablishments,
    otherEmployers,
    otherItems,
    isLoading,
  };
}
