// src/hooks/useEmployerView.js
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function useEmployerView(apiBaseUrl, user_name, token, navigate) {
  const [employer, setEmployer] = useState(null);
  const [establishment, setEstablishment] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [interactionSummary, setInteractionSummary] = useState(null);
  const [userInteractions, setUserInteractions] = useState([]);
  const [otherEmployers, setOtherEmployers] = useState([]);
  const [ordersSummary, setOrdersSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/employer/view/${user_name}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!active) return;

        const d = res.data || {};

        setEmployer(d.employer || null);
        setEstablishment(d.establishment || null);
        setMetrics(d.metrics || null);
        setInteractionSummary(d.interaction_summary || null);
        setUserInteractions(Array.isArray(d.user_interactions) ? d.user_interactions : []);
        setOtherEmployers(Array.isArray(d.other_employers) ? d.other_employers : []);
        setOrdersSummary(d.orders_summary || null);
      } catch (err) {
        const msg =
          err?.response?.data?.details ||
          err?.response?.data?.error ||
          "Não foi possível carregar o colaborador.";
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
  }, [user_name, token, navigate]);

  return {
    employer,
    establishment,
    metrics,
    interactionSummary,
    userInteractions,
    otherEmployers,
    ordersSummary,
    isLoading,
  };
}
