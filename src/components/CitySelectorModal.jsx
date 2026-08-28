// src/components/CitySelectorModal.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

import { appId } from "../config";
import api from "../services/api";
import GlobalModal from "./GlobalModal";
import "./CitySelectorModal.css";

export default function CitySelectorModal({ user = {}, show, onClose, onSelectCity }) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!show) return;

    setCity(localStorage.getItem("selectedCity") || user.city || "");
    setUf(localStorage.getItem("selectedUF") || user.uf || "");
    setQuery("");
  }, [show, user.city, user.uf]);

  useEffect(() => {
    if (!show) return undefined;

    const controller = new AbortController();

    const fetchCities = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/establishment/cities/${appId}`, {
          signal: controller.signal,
        });
        setCities(Array.isArray(data?.cities) ? data.cities : []);
      } catch (error) {
        if (error?.code !== "ERR_CANCELED") setCities([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchCities();
    return () => controller.abort();
  }, [show]);

  const modalTitle = useMemo(() => {
    if (uf === "ALL") return "Todas as cidades";
    if (city && uf) return `${city} / ${uf}`;
    return "Escolha sua cidade";
  }, [city, uf]);

  const normalizedQuery = useMemo(
    () => String(query || "").trim().toLocaleLowerCase("pt-BR"),
    [query]
  );

  const cityItems = useMemo(() => {
    const mapped = (Array.isArray(cities) ? cities : []).map((item, index) => ({
      key: `${item.city}-${item.uf}-${index}`,
      city: item.city,
      uf: item.uf,
      label: `${item.city} / ${item.uf}`,
    }));

    const all = [
      { key: "__ALL__", city: "Todas", uf: "ALL", label: "Todas as cidades" },
      ...mapped,
    ];

    if (!normalizedQuery) return all;

    return all.filter((item) =>
      [item.city, item.uf, item.label].some((value) =>
        String(value || "").toLocaleLowerCase("pt-BR").includes(normalizedQuery)
      )
    );
  }, [cities, normalizedQuery]);

  const isSelected = useCallback(
    (nextCity, nextUf) => String(city) === String(nextCity) && String(uf) === String(nextUf),
    [city, uf]
  );

  const applySelection = useCallback(
    (nextCity, nextUf) => {
      localStorage.setItem("selectedCity", nextCity);
      localStorage.setItem("selectedUF", nextUf);
      setCity(nextCity);
      setUf(nextUf);

      window.dispatchEvent(
        new CustomEvent("cityChanged", { detail: { city: nextCity, uf: nextUf } })
      );

      onSelectCity?.({ city: nextCity, uf: nextUf });
      onClose?.();
    },
    [onSelectCity, onClose]
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
        <div className="city-modal__top">
          <div className="city-modal__search">
            <input
              className="city-modal__input"
              placeholder="Pesquisar cidade ou UF..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
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

        <div className="city-modal__content">
          {loading ? (
            <div className="city-modal__grid" aria-busy="true">
              {Array.from({ length: 9 }).map((_, index) => (
                <div className="city-tile city-tile--skeleton" key={`sk-${index}`}>
                  <div className="city-tile__skTitle" />
                  <div className="city-tile__skSub" />
                </div>
              ))}
            </div>
          ) : (
            <div className="city-modal__grid" role="listbox" aria-label="Cidades disponíveis">
              {cityItems.map((item) => {
                const active = isSelected(item.city, item.uf);
                return (
                  <div
                    key={item.key}
                    role="option"
                    tabIndex={0}
                    aria-selected={active}
                    className={`city-tile ${active ? "is-active" : ""}`}
                    onClick={() => applySelection(item.city, item.uf)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        applySelection(item.city, item.uf);
                      }
                    }}
                  >
                    <div className="city-tile__row">
                      <div className="city-tile__title">{item.city}</div>
                      {active && <div className="city-tile__badge">✓</div>}
                    </div>
                    <div className="city-tile__sub">
                      {item.uf === "ALL" ? "Selecione para ver tudo" : item.uf}
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
