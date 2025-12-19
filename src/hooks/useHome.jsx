import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function useHomePage(apiBaseUrl, appId) {
  const [establishments, setEstablishments] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [highlights, setHighlights] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentInteractions, setRecentInteractions] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const selectedCity = localStorage.getItem("selectedCity");
  const selectedUF = localStorage.getItem("selectedUF");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const city = selectedCity || user.city || null;
  const uf = selectedUF || user.uf || null;

  const fmtBRL = (value) => {
    if (value === null || value === undefined) return "R$ 0,00";
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  useEffect(() => {
    let active = true;
    async function loadHome() {
      setIsLoading(true);
      setError(null);

      try {
        const query = city && uf ? `?city=${city}&uf=${uf}` : "";
        const url = `${apiBaseUrl}/home/${appId}${query}`;

        const res = await axios.get(url);
        if (!active) return;

        const data = res.data || {};

        setStats(data.stats || {});
        setHighlights(data.highlights || {});
        setEstablishments(data.establishments || []);
        setEmployers(data.employers || []);
        setItems(data.items || []);
        setRecentOrders(data.recent_orders || []);
        setRecentInteractions(data.recent_interactions || []);
      } catch (err) {
        if (!active) return;

        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Erro ao carregar a Home.";

        setError(msg);

        Swal.fire({
          icon: "error",
          title: "Erro",
          text: msg,
        });
      } finally {
        if (active) setIsLoading(false);
      }
    }

    if (appId) loadHome();
    else {
      setError("app_id não fornecido.");
      setIsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [apiBaseUrl, appId, city, uf]);

  return {
    establishments,
    employers,
    items,
    stats,
    highlights,
    recentOrders,
    recentInteractions,
    isLoading,
    error,
    city,
    uf,
    fmtBRL,
  };
}
