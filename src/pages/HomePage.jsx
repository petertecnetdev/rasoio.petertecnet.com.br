import React from "react";
import { apiBaseUrl, appId } from "../config";

import useHomePage from "../hooks/useHomePage";

import "./HomePage.css";

import StatCard from "../components/home/StatCard";
import HighlightCard from "../components/home/HighlightCard";
import GlobalCarousel from "../components/GlobalCarousel";
import TopList from "../components/home/TopList";
import GlobalNav from "../components/GlobalNav";

import CircleGauge from "../components/home/CircleGauge";

export default function HomePage() {
  const {
    establishments,
    employers,
    items,
    stats,
    isLoading,
    city,
    uf,
    fmtBRL,
  } = useHomePage(apiBaseUrl, appId);

  if (isLoading) {
    return (
      <>
        <GlobalNav />
        <div className="hp-loading">Carregando…</div>
      </>
    );
  }

  return (
    <>
      <GlobalNav />

      <div className="hp-wrapper">
        {/* HEADER */}
        <div className="hp-header">
          <h1>Bem-vindo(a)!</h1>
          <div className="hp-location">
            {city && uf ? `${city} / ${uf}` : "Localização não definida"}
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="hp-section">
          <div className="hp-section-title">Estatísticas rápidas</div>

          <div className="hp-stats-row">
            <StatCard value={stats.total_users} label="Usuários" />
            <StatCard value={stats.total_establishments} label="Estabelecimentos" />
            <StatCard value={stats.total_employers} label="Profissionais" />
            <StatCard value={stats.total_items} label="Serviços" />
            <StatCard value={stats.total_orders} label="Pedidos" />
            <StatCard value={stats.new_users_30d} label="Novos usuários (30d)" />
          </div>
        </div>

        {/* HIGHLIGHTS */}
        <div className="hp-section">
          <div className="hp-section-title">Destaques da cidade</div>

          <div className="hp-highlights-grid">
            {stats.highlights?.best_establishment && (
              <HighlightCard
                title={stats.highlights.best_establishment.name}
                subtitle="Estabelecimento destaque"
              />
            )}

            {stats.highlights?.best_employer && (
              <HighlightCard
                title={stats.highlights.best_employer.name}
                subtitle="Profissional destaque"
              />
            )}

            {stats.highlights?.best_item && (
              <HighlightCard
                icon
                title={stats.highlights.best_item.name}
                subtitle="Serviço destaque"
              />
            )}

            {stats.highlights?.top_item_week && (
              <HighlightCard
                icon
                title={stats.highlights.top_item_week.name}
                subtitle="Mais visto da semana"
              />
            )}

            {stats.highlights?.most_sold_item_month?.item && (
              <HighlightCard
                icon
                title={stats.highlights.most_sold_item_month.item.name}
                subtitle="Mais vendido do mês"
              />
            )}
          </div>
        </div>

        {/* CAROUSELS */}
        <div className="hp-section">
          <GlobalCarousel
            title="Estabelecimentos"
            items={establishments}
            fmtBRL={fmtBRL}
            navigate={(path) => (window.location.href = path)}
            openSchedulePopup={() => {}}
          />

          <GlobalCarousel
            title="Profissionais"
            items={employers}
            fmtBRL={fmtBRL}
            navigate={(path) => (window.location.href = path)}
            openSchedulePopup={() => {}}
          />

          <GlobalCarousel
            title="Serviços"
            items={items}
            fmtBRL={fmtBRL}
            navigate={(path) => (window.location.href = path)}
            openSchedulePopup={() => {}}
          />
        </div>

        {/* LISTAS E ATIVIDADE */}
        <div className="hp-bottom-grid">
          <TopList
            title="Top Estabelecimentos (views)"
            items={stats.top_establishments_views}
          />

          <TopList
            title="Serviços mais vendidos"
            items={stats.top_items_sold}
          />

          <div className="hp-activity">
            <h4>Atividade Global</h4>

            <CircleGauge value={stats.dau} />

            <div className="hp-activity-info">
              <div>DAU: {stats.dau}</div>
              <div>MAU: {stats.mau}</div>
              <div>DAU/MAU Ratio: {stats.dau_mau_ratio}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
