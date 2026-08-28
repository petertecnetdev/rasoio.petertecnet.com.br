// src/pages/item/ItemProductHomePage.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiBaseUrl, appId } from "../../config";

import useItemProductHome from "../../hooks/useItemProductHome";
import useSelectedCity from "../../hooks/useSelectedCity";

import "../homepage.css";
import GlobalPageHeader from "../../components/GlobalPageHeader";
import GlobalCarousel from "../../components/GlobalCarousel";

export default function ItemProductHomePage() {
  const { productItems, isLoading, error } = useItemProductHome(apiBaseUrl, appId);
  const navigate = useNavigate();
  const { cityLabel } = useSelectedCity();

  const headerMeta = useMemo(
    () => [cityLabel, "Produtos das barbearias"].filter(Boolean),
    [cityLabel]
  );

  const headerDescription = useMemo(
    () =>
      `Confira produtos disponíveis nas barbearias.${
        cityLabel ? ` (${cityLabel})` : ""
      }`,
    [cityLabel]
  );

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
          description="Não foi possível carregar os produtos agora."
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
        subtitle="Conheça produtos oferecidos pelas barbearias"
        items={productItems}
        fmtBRL={(value) => value}
        navigate={navigate}
        showSchedule={false}
        showDots
      />
    </div>
  );
}
