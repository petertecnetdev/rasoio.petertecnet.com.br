// src/hooks/useHome.js
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const getFileUrlByType = (files, type) =>
  Array.isArray(files)
    ? files.find((f) => f.type === type)?.public_url ?? null
    : null;

export default function useHome(apiBaseUrl, appId) {
  const [establishments, setEstablishments] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    top_establishments_views: [],
    top_items_views: [],
    total_views: 0,
    dau: 0,
    mau: 0,
    dau_mau_ratio: 0,
  });
  const [highlights, setHighlights] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const city = localStorage.getItem("selectedCity");
  const uf = localStorage.getItem("selectedUF");

  useEffect(() => {
    let active = true;

    async function loadHome() {
      setIsLoading(true);
      setError(null);

      try {
        const query =
          city && uf
            ? `?city=${encodeURIComponent(city)}&uf=${encodeURIComponent(uf)}`
            : "";

        const [estRes, empRes, itemRes] = await Promise.all([
          axios.get(`${apiBaseUrl}/establishment/home/${appId}${query}`),
          axios.get(`${apiBaseUrl}/employer/home/${appId}${query}`),
          axios.get(`${apiBaseUrl}/item/home/${appId}${query}`),
        ]);

        if (!active) return;

        setEstablishments(
          (estRes.data?.establishments || []).map((est) => ({
            ...est,
            type: "establishment",
            name: est.name,
            image:
              getFileUrlByType(est.files, "logo") ||
              getFileUrlByType(est.files, "background") ||
              null,
            images: {
              logo: getFileUrlByType(est.files, "logo"),
              background: getFileUrlByType(est.files, "background"),
            },
          }))
        );

        setEmployers(
          (empRes.data?.employers || []).map((emp) => {
            const firstName = emp.user?.first_name || "";
            const lastName = emp.user?.last_name || "";
            const fullName = `${firstName} ${lastName}`.trim();

            return {
              ...emp,
              type: "employer",
              name: fullName || firstName || "Colaborador",
              first_name: firstName,
              last_name: lastName,
              avatar: getFileUrlByType(emp.user?.files, "avatar"),
              image: getFileUrlByType(emp.user?.files, "avatar"),
              user: emp.user,
            };
          })
        );

        setItems(
          (itemRes.data?.items || []).map((item) => ({
            ...item,
            type: item.type === "product" ? "product" : "service",
            image: getFileUrlByType(item.files, "image"),
          }))
        );

        setStats({
          top_establishments_views:
            estRes.data?.stats?.top_establishments_views || [],
          top_items_views: itemRes.data?.stats?.top_items_views || [],
          total_views:
            (estRes.data?.stats?.total_views || 0) +
            (itemRes.data?.stats?.total_views || 0),
          dau: estRes.data?.stats?.dau || 0,
          mau: estRes.data?.stats?.mau || 0,
          dau_mau_ratio: estRes.data?.stats?.dau_mau_ratio || 0,
        });

        setHighlights(estRes.data?.highlights || {});
      } catch (err) {
        if (!active) return;

        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Erro ao carregar a home.";

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
      setError("app_id não informado.");
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
    isLoading,
    error,
  };
}
