// src/components/home/EmployerCard.jsx
import React from "react";
import "./EmployerCard.css";

export default function EmployerCard({ data }) {
  const img =
    data?.avatar ||
    data?.images?.avatar ||
    "/images/placeholder.png";

  return (
    <div className="ecard">
      <div className="ecard-top">
        <img src={img} alt="" className="ecard-avatar" />

        <div className="ecard-info">
          <div className="ecard-name">{data.name}</div>
          <div className="ecard-sub">{data.establishment?.name}</div>
        </div>
      </div>

      <div className="ecard-stats">
        {data.completed_appointments} atendimentos concluídos
      </div>
    </div>
  );
}
