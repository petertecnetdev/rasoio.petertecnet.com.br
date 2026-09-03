// src/components/home/EstablishmentCard.jsx
import React from "react";
import "./EstablishmentCard.css";

export default function EstablishmentCard({ data }) {
  const img =
    data?.images?.logo ||
    data?.images?.avatar ||
    data?.images?.background ||
    "";

  return (
    <div className="estcard" data-name={data?.name || ""}>
      <div className="estcard-top">
        <img
          src={img}
          alt={data?.name || "Estabelecimento"}
          data-fallback-text={data?.name || ""}
          className="estcard-logo"
        />

        <div className="estcard-info">
          <div className="estcard-name">{data.name}</div>
          <div className="estcard-sub">{data.city} - {data.uf}</div>
        </div>
      </div>

      <div className="estcard-stats">
        {data.total_views} visualizações
      </div>
    </div>
  );
}
