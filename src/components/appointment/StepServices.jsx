import React from "react";
import "./steps.css";

export default function StepServices({ services, selected, onChange }) {
  const toggle = (s) => {
    const exists = selected.find(x => x.id === s.id);
    if (exists) onChange(selected.filter(x => x.id !== s.id));
    else onChange([...selected, s]);
  };

  return (
    <div className="step-container">
      <h4>Escolha os Serviços</h4>
      <div className="step-grid">
        {services.map(s => (
          <div
            key={s.id}
            className={`step-card ${selected.find(x => x.id === s.id) ? "active" : ""}`}
            onClick={() => toggle(s)}
          >
            <div className="step-name">{s.name}</div>
            <div className="step-price">R$ {Number(s.price).toFixed(2).replace(".", ",")}</div>
            <div className="step-duration">{s.duration || 30} min</div>
          </div>
        ))}
      </div>
    </div>
  );
}
