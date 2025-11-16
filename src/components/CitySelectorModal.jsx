import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { apiBaseUrl } from "../config";
import "./CitySelectorModal.css";

export default function CitySelectorModal({ user, show, onClose }) {
  const appId = 2;

  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  // Carrega cidade atual (prioriza o que já estava selecionado)
  const storedCity = localStorage.getItem("selectedCity") || user.city || "";
  const storedUF = localStorage.getItem("selectedUF") || user.uf || "";

  const [city, setCity] = useState(storedCity);
  const [uf, setUf] = useState(storedUF);

  // Busca cidades
  useEffect(() => {
    async function fetchCities() {
      try {
        const res = await axios.get(`${apiBaseUrl}/establishment/cities/${appId}`);
        setCities(res.data.cities || []);
      } catch (err) {
        console.error("Erro ao carregar cidades:", err);
      } finally {
        setLoading(false);
      }
    }

    if (show) fetchCities();
  }, [show]);

  const handleSelect = (c) => {
    setCity(c.city);
    setUf(c.uf);
    setOpen(false);
  };

  const handleSave = () => {
    // 🔥 SALVA AS CIDADES COM PRIORIDADE
    localStorage.setItem("selectedCity", city);
    localStorage.setItem("selectedUF", uf);

    // opcional: atualizar user também
    const updatedUser = { ...user, city, uf };
    localStorage.setItem("user", JSON.stringify(updatedUser));

    window.location.reload();
  };

  if (!show) return null;

  return (
    <div className="city-modal-overlay">
      <div className="city-modal">
        <div className="city-modal-header">
          <h3>Escolher cidade</h3>
          <button className="city-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="city-modal-body">
          {loading ? (
            <div className="city-loading">Carregando...</div>
          ) : (
            <div className="city-dropdown-container" ref={dropdownRef}>
              <label className="city-label">Cidade</label>

              <div
                className={`city-dropdown ${open ? "open" : ""}`}
                onClick={() => setOpen(!open)}
              >
                <span className="city-selected">
                  {city && uf ? `${city} / ${uf}` : "Selecione..."}
                </span>

                <span className="city-arrow">▼</span>
              </div>

              <div className={`city-options ${open ? "show" : ""}`}>
                {cities.map((c) => (
                  <div
                    key={`${c.city}-${c.uf}`}
                    className="city-option"
                    onClick={() => handleSelect(c)}
                  >
                    {c.city} / {c.uf}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="city-modal-footer">
          <button className="city-btn secondary" onClick={onClose}>
            Cancelar
          </button>

          <button
            className="city-btn primary"
            onClick={handleSave}
            disabled={!city || !uf}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
