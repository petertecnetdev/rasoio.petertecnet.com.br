// src/components/CitySelectorModal.jsx (ajuste: sem logo e título = cidade selecionada)
import React, { useEffect, useMemo, useState, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { apiBaseUrl } from "../config";
import GlobalModal from "./GlobalModal";
import GlobalCard from "./GlobalCard";
import "./CitySelectorModal.css";

export default function CitySelectorModal({ user = {}, show, onClose, onSelectCity }) {
  const appId = 2;

  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  const storedCity = localStorage.getItem("selectedCity") || user.city || "";
  const storedUF = localStorage.getItem("selectedUF") || user.uf || "";

  const [city, setCity] = useState(storedCity);
  const [uf, setUf] = useState(storedUF);

  useEffect(() => {
    if (!show) return;
    const c = localStorage.getItem("selectedCity") || user.city || "";
    const u = localStorage.getItem("selectedUF") || user.uf || "";
    setCity(c);
    setUf(u);
  }, [show, user.city, user.uf]);

  useEffect(() => {
    if (!show) return;

    let mounted = true;

    async function fetchCities() {
      setLoading(true);
      try {
        const res = await axios.get(`${apiBaseUrl}/establishment/cities/${appId}`);
        if (!mounted) return;
        setCities(res.data?.cities || []);
      } catch (e) {
        console.error("Erro ao buscar cidades:", e);
        if (!mounted) return;
        setCities([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchCities();
    return () => {
      mounted = false;
    };
  }, [show]);

  const modalTitle = useMemo(() => {
    if (uf === "ALL") return "Todas as cidades";
    if (city && uf) return `${city} / ${uf}`;
    return "Escolha sua cidade";
  }, [city, uf]);

  const cityCards = useMemo(() => {
    const list = Array.isArray(cities) ? cities : [];

    const all = [
      {
        key: "__ALL__",
        raw: { city: "Todas", uf: "ALL" },
        item: { type: "city", name: "Todas as cidades" },
      },
    ];

    const mapped = list.map((c, idx) => ({
      key: `${c.city}-${c.uf}-${idx}`,
      raw: { city: c.city, uf: c.uf },
      item: { type: "city", name: `${c.city} / ${c.uf}` },
    }));

    return [...all, ...mapped];
  }, [cities]);

  const isSelected = useCallback(
    (c, u) => String(city) === String(c) && String(uf) === String(u),
    [city, uf]
  );

  const applySelection = useCallback(
    (nextCity, nextUf) => {
      setCity(nextCity);
      setUf(nextUf);

      localStorage.setItem("selectedCity", nextCity);
      localStorage.setItem("selectedUF", nextUf);
      localStorage.setItem("user", JSON.stringify({ ...user, city: nextCity, uf: nextUf }));

      if (typeof onSelectCity === "function") {
        onSelectCity({ city: nextCity, uf: nextUf });
      }

      onClose?.();
    },
    [user, onSelectCity, onClose]
  );

  return (
    <GlobalModal
      show={show}
      onHide={onClose}
      title={modalTitle}
      subtitle={null}
      size="lg"
      centered
      backdrop="static"
      closeOnEsc
      closeButton
      className="city-gmodal"
      logoSrc={null}   // ✅ sem imagem no título
      logoAlt=""
      footer={null}
    >
      <div className="city-modal-body">
        {loading ? (
          <div className="city-grid">
            {Array.from({ length: 9 }).map((_, i) => (
              <div className="city-grid-item" key={`sk-${i}`}>
                <GlobalCard loading hideMedia />
              </div>
            ))}
          </div>
        ) : (
          <div className="city-grid" role="list">
            {cityCards.map(({ key, raw, item }) => {
              const active = isSelected(raw.city, raw.uf);

              return (
                <div
                  key={key}
                  role="listitem"
                  className={`city-grid-item ${active ? "is-selected" : ""}`}
                  onClick={() => applySelection(raw.city, raw.uf)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      applySelection(raw.city, raw.uf);
                    }
                  }}
                  tabIndex={0}
                >
                  <div className="city-card-wrap">
                    <GlobalCard item={item} showSchedule={false} actions={null} hideMedia />
                    {active && <div className="city-selected-badge">✓</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlobalModal>
  );
}

CitySelectorModal.propTypes = {
  user: PropTypes.object,
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectCity: PropTypes.func.isRequired,
};
