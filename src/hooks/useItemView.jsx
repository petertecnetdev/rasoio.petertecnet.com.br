import { useState, useEffect } from "react";
import axios from "axios";

export default function useItemView(apiBaseUrl, slug, token, navigate) {
  const [item, setItem] = useState(null);
  const [establishment, setEstablishment] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [interactionSummary, setInteractionSummary] = useState({});
  const [userInteractions, setUserInteractions] = useState([]);
  const [ordersSummary, setOrdersSummary] = useState(null);
  const [otherEstablishments, setOtherEstablishments] = useState([]);
  const [otherEmployers, setOtherEmployers] = useState([]);
  const [otherItems, setOtherItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    setIsLoading(true);

    axios
      .get(`${apiBaseUrl}/items/view/${slug}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => {
        if (!isMounted) return;
        const data = res.data || {};

        setItem(data.item ?? null);
        setEstablishment(data.establishment ?? null);
        setMetrics(data.metrics ?? {});
        setInteractionSummary(data.interaction_summary ?? {});
        setUserInteractions(data.user_interactions ?? []);
        setOrdersSummary(data.orders_summary ?? null);
        setOtherEstablishments(data.other_establishments ?? []);
        setOtherEmployers(data.other_employers ?? []);
        setOtherItems(data.other_items ?? []);

        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (!isMounted) return;
        setIsLoading(false);
        if (err.response?.status === 404) {
          navigate("/404");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug, token, apiBaseUrl, navigate]);

  return {
    item,
    establishment,
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
