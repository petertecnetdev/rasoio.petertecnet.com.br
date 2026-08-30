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
  const logo = establishment?.images?.logo || establishment?.logo || FALLBACK_LOGO;
  const background = establishment?.images?.background || establishment?.background || null;

  return (
    <article className="barbershop-management-card">
      <div
        className="barbershop-cover"
        style={background ? { backgroundImage: `linear-gradient(180deg, rgba(2,8,16,.08), rgba(2,8,16,.92)), url(${background})` } : undefined}
      >
        <span className="barbershop-status"><i /> Unidade ativa</span>
        <Link
          to={`/establishment/view/${establishment.slug}`}
          className="barbershop-public-pill"
        >
          Página pública ↗
        </Link>
      </div>

      <div className="barbershop-card-body">
        <button
          type="button"
          className="barbershop-identity"
          onClick={() => navigate(`/dashboard?establishment=${encodeURIComponent(establishment.slug)}`)}
          aria-label={`Abrir visão geral da ${title}`}
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
            <span className="barbershop-eyebrow">Sua barbearia</span>
            <strong className="barbershop-name">{title}</strong>
            <span className="barbershop-meta">{location || "Localização não informada"}</span>
            <span className="barbershop-slug">rasoio / {establishment.slug}</span>
          </span>
        </button>

        <div className="barbershop-card-overview">
          <div>
            <span>Gestão independente</span>
            <strong>Equipe, catálogo e agenda próprios</strong>
          </div>
          <Link
            className="barbershop-overview-button"
            to={`/dashboard?establishment=${encodeURIComponent(establishment.slug)}`}
          >
            Visão geral
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <EstablishmentActionsBar establishment={establishment} />
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
    background: PropTypes.string,
    images: PropTypes.shape({
      logo: PropTypes.string,
      background: PropTypes.string,
    }),
  }).isRequired,
  navigate: PropTypes.func.isRequired,
};
