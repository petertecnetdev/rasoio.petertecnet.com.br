// src/components/establishment/EstablishmentDashboard.jsx
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import EstablishmentActionsBar from "./EstablishmentActionsBar";
import "./EstablishmentDashboard.css";

const FALLBACK_LOGO = "/images/logo.png";

export default function EstablishmentDashboard({ establishment, navigate }) {
  const title = establishment.fantasy || establishment.name || "Barbearia";
  const location = [establishment.city, establishment.uf].filter(Boolean).join(" • ");
  const logo =
    establishment?.images?.logo ||
    establishment?.logo ||
    FALLBACK_LOGO;

  return (
    <article className="barbershop-management-card">
      <div className="barbershop-management-glow" aria-hidden="true" />

      <div className="barbershop-management-main">
        <button
          type="button"
          className="barbershop-identity"
          onClick={() => navigate(`/establishment/view/${establishment.slug}`)}
          aria-label={`Abrir página da ${title}`}
        >
          <span className="barbershop-logo-shell">
            <img
              src={logo}
              alt=""
              className="barbershop-logo"
              onError={(event) => {
                event.currentTarget.src = FALLBACK_LOGO;
              }}
            />
          </span>

          <span className="barbershop-identity-copy">
            <span className="barbershop-eyebrow">Barbearia ativa</span>
            <strong className="barbershop-name">{title}</strong>
            <span className="barbershop-meta">
              {location || "Localização não informada"}
            </span>
            <span className="barbershop-slug">/{establishment.slug}</span>
          </span>
        </button>

        <div className="barbershop-management-summary">
          <div className="barbershop-summary-item">
            <span className="barbershop-summary-icon" aria-hidden="true">✂</span>
            <div>
              <strong>Operação</strong>
              <span>Equipe, serviços e agenda</span>
            </div>
          </div>
          <div className="barbershop-summary-item">
            <span className="barbershop-summary-icon" aria-hidden="true">⌁</span>
            <div>
              <strong>Página pública</strong>
              <span>Perfil da barbearia na Rasoio</span>
            </div>
          </div>
        </div>
      </div>

      <EstablishmentActionsBar establishment={establishment} />

      <div className="barbershop-management-footer">
        <Link
          to={`/establishment/view/${establishment.slug}`}
          className="barbershop-public-link"
        >
          Ver página pública <span aria-hidden="true">↗</span>
        </Link>
        <span className="barbershop-app-badge">Rasoio</span>
      </div>
    </article>
  );
}

EstablishmentDashboard.propTypes = {
  establishment: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string,
    fantasy: PropTypes.string,
    slug: PropTypes.string.isRequired,
    city: PropTypes.string,
    uf: PropTypes.string,
    logo: PropTypes.string,
    images: PropTypes.shape({
      logo: PropTypes.string,
    }),
  }).isRequired,
  navigate: PropTypes.func.isRequired,
};
