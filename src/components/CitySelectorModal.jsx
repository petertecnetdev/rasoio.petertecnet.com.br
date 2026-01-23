// src/components/CitySelectorModal.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "axios";

import { apiBaseUrl } from "../config";
import GlobalModal from "./GlobalModal";

import "./CitySelectorModal.css";

export default function CitySelectorModal({ user = {}, show, onClose, onSelectCity }) {
  const appId = 2;

  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  const storedCity = localStorage.getItem("selectedCity") || user.city || "";
  const storedUF = localStorage.getItem("selectedUF") || user.uf || "";

  const [city, setCity] = useState(storedCity);
  const [uf, setUf] = useState(storedUF);

  const [query, setQuery] = useState("");

  // ✅ sempre sincroniza cidade/uf ao abrir
  useEffect(() => {
    if (!show) return;

    const c = localStorage.getItem("selectedCity") || user.city || "";
    const u = localStorage.getItem("selectedUF") || user.uf || "";

    setCity(c);
    setUf(u);
    setQuery("");
  }, [show, user.city, user.uf]);

  // ✅ fetch cidades ao abrir
  useEffect(() => {
    if (!show) return;

    let mounted = true;

    async function fetchCities() {
      setLoading(true);
      try {
        const res = await axios.get(`${apiBaseUrl}/establishment/cities/${appId}`);

        if (!mounted) return;
        setCities(Array.isArray(res.data?.cities) ? res.data.cities : []);
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

  const normalizedQuery = useMemo(() => String(query || "").trim().toLowerCase(), [query]);

  const cityItems = useMemo(() => {
    const list = Array.isArray(cities) ? cities : [];

    const base = [
      {
        key: "__ALL__",
        city: "Todas",
        uf: "ALL",
        label: "Todas as cidades",
      },
    ];

    const mapped = list.map((c, idx) => ({
      key: `${c.city}-${c.uf}-${idx}`,
      city: c.city,
      uf: c.uf,
      label: `${c.city} / ${c.uf}`,
    }));

    const all = [...base, ...mapped];

    if (!normalizedQuery) return all;

    return all.filter((it) => {
      const a = String(it.city || "").toLowerCase();
      const b = String(it.uf || "").toLowerCase();
      const c = String(it.label || "").toLowerCase();
      return a.includes(normalizedQuery) || b.includes(normalizedQuery) || c.includes(normalizedQuery);
    });
  }, [cities, normalizedQuery]);

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
      className="city-modal"
      logoSrc={null}
      logoAlt=""
      footer={null}
    >
      <div className="city-modal__body">
        {/* Top bar */}
        <div className="city-modal__top">
          <div className="city-modal__search">
            <input
              className="city-modal__input"
              placeholder="Pesquisar cidade ou UF..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            {!!query && (
              <button
                type="button"
                className="city-modal__clear"
                onClick={() => setQuery("")}
                aria-label="Limpar pesquisa"
                title="Limpar"
              >
                ×
              </button>
            )}
          </div>

          <div className="city-modal__hint">
            {loading ? "Carregando..." : `${cityItems.length} opções`}
          </div>
        </div>

        {/* Grid */}
        <div className="city-modal__content">
          {loading ? (
            <div className="city-modal__grid" aria-busy="true">
              {Array.from({ length: 9 }).map((_, i) => (
                <div className="city-tile city-tile--skeleton" key={`sk-${i}`}>
                  <div className="city-tile__skTitle" />
                  <div className="city-tile__skSub" />
                </div>
              ))}
            </div>
          ) : (
            <div className="city-modal__grid" role="list">
              {cityItems.map((it) => {
                const active = isSelected(it.city, it.uf);

                return (
                  <div
                    key={it.key}
                    role="listitem"
                    tabIndex={0}
                    aria-selected={active}
                    className={`city-tile ${active ? "is-active" : ""}`}
                    onClick={() => applySelection(it.city, it.uf)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        applySelection(it.city, it.uf);
                      }
                    }}
                  >
                    <div className="city-tile__row">
                      <div className="city-tile__title">{it.city}</div>
                      {active && <div className="city-tile__badge">✓</div>}
                    </div>

                    <div className="city-tile__sub">
                      {it.uf === "ALL" ? "Selecione para ver tudo" : it.uf}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && cityItems.length === 0 && (
            <div className="city-modal__empty">
              <div className="city-modal__emptyTitle">Nenhuma cidade encontrada</div>
              <div className="city-modal__emptySubtitle">
                Tente pesquisar por nome da cidade ou UF.
              </div>
            </div>
          )}
        </div>
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
