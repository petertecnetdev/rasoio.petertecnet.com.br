// src/pages/product/ProductHomePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiBaseUrl, appId } from "../../config";

import useItemProductHome from "../../hooks/useItemProductHome";

import "../homepage.css";

import GlobalPageHeader from "../../components/GlobalPageHeader";
import GlobalCarousel from "../../components/GlobalCarousel";

export default function ProductHomePage() {
  const { productItems, isLoading, error } = useItemProductHome(apiBaseUrl, appId);

  const navigate = useNavigate();

  // ✅ cidade/uf vêm do localStorage (o GlobalNav altera isso)
  const [currentCity, setCurrentCity] = useState(() => localStorage.getItem("selectedCity"));
  const [currentUF, setCurrentUF] = useState(() => localStorage.getItem("selectedUF"));

  // ✅ mantém o header atualizado quando o GlobalNav mudar cidade
  useEffect(() => {
    const sync = () => {
      setCurrentCity(localStorage.getItem("selectedCity"));
      setCurrentUF(localStorage.getItem("selectedUF"));
    };

    window.addEventListener("cityChanged", sync);

    // fallback leve pra mesma aba (caso não exista cityChanged)
    const iv = setInterval(sync, 800);

    return () => {
      window.removeEventListener("cityChanged", sync);
      clearInterval(iv);
    };
  }, []);

  // mantém o padrão de navegação já usado no projeto
  const safeNavigate = useMemo(() => (path) => (window.location.href = path), []);

  const headerMeta = useMemo(() => {
    const cityLabel =
      currentCity && currentUF ? `${currentCity} - ${currentUF}` : currentCity || "";
    return [cityLabel, "Produtos em destaque"].filter(Boolean);
  }, [currentCity, currentUF]);

  const headerDescription = useMemo(() => {
    const cityLabel =
      currentCity && currentUF ? `${currentCity} - ${currentUF}` : currentCity || "";
    return `Confira produtos disponíveis para você comprar com rapidez.${
      cityLabel ? ` (${cityLabel})` : ""
    }`;
  }, [currentCity, currentUF]);

  if (isLoading) {
    return (
      <div className="hp-wrapper">
        <GlobalPageHeader
          title="Produtos"
          variant="home"
          description="Carregando produtos da sua região..."
          meta={headerMeta}
          compact
        />
        <div className="hp-loading">Carregando…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hp-wrapper">
        <GlobalPageHeader
          title="Produtos"
          variant="home"
          description="Não foi possível carregar as informações agora."
          meta={headerMeta}
          compact
        />
        <div className="hp-loading">{error}</div>
      </div>
    );
  }

  return (
    <div className="hp-wrapper">
      <GlobalPageHeader
        title="Produtos"
        variant="home"
        description={headerDescription}
        meta={headerMeta}
      />

      <GlobalCarousel
        title="Produtos"
        items={productItems}
        navigate={safeNavigate}
        showSchedule={false}
      />
    </div>
  );
}
