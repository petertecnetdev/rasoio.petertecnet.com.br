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
  const [items, setItems] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [itemsInteractions, setItemsInteractions] = useState([]);
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

        // ✅ Inclui o orders_summary dentro do objeto establishment
        const estData = {
          ...(d.establishment || {}),
          orders_summary: d.orders_summary || null,
        };

        setEstablishment(estData);
        setItems(Array.isArray(estData.items) ? estData.items : []);
        setEmployers(Array.isArray(estData.employers) ? estData.employers : []);
        setMetrics(d.metrics || null);
        setInteractionSummary(d.interaction_summary || null);
        setUserInteractions(Array.isArray(d.user_interactions) ? d.user_interactions : []);
        setOtherEstablishments(Array.isArray(d.other_establishments) ? d.other_establishments : []);
        setItemsInteractions(Array.isArray(d.items_interactions) ? d.items_interactions : []);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível carregar o estabelecimento.",
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
    metrics,
    interactionSummary,
    userInteractions,
    otherEstablishments,
    items,
    employers,
    itemsInteractions,
    isLoading,
  };
}
