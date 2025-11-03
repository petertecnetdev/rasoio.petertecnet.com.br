import React from "react";
import "./steps.css";

export default function StepEmployer({ employers, selected, onChange, imageUrl }) {
  return (
    <div className="step-container">
      <h4>Escolha o Profissional</h4>
      <div className="step-grid">
        {employers.map(e => (
          <div
            key={e.id}
            className={`step-card ${selected?.id === e.id ? "active" : ""}`}
            onClick={() => onChange(e)}
          >
            <img
              src={imageUrl(e.user?.avatar)}
              onError={(ev) => (ev.target.src = "/images/logo.png")}
              alt={e.user?.first_name}
              className="step-avatar"
            />
            <div>{e.user?.first_name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
