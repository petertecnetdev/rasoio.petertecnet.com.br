import React from "react";
import "./ItemCard.css";

export default function ItemCard({ data }) {
  const img =
    data?.images?.avatar ||
    data?.images?.logo ||
    data?.images?.background ||
    "";

  return (
    <div className="icard" data-name={data?.name || ""}>
      <div className="icard-top">
        <img
          src={img}
          alt={data?.name || "Item"}
          data-fallback-text={data?.name || ""}
          className="icard-img"
        />

        <div className="icard-info">
          <div className="icard-name">{data.name}</div>
          <div className="icard-price">R$ {Number(data.price).toFixed(2)}</div>
        </div>
      </div>

      <div className="icard-stats">
        {data.total_views} visualizações
      </div>
    </div>
  );
}
