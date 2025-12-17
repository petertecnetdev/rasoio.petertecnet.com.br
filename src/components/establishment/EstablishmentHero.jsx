// src/components/establishment/EstablishmentHero.jsx
import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import GlobalButton from "../GlobalButton";
import "./EstablishmentHero.css";

export default function EstablishmentHero({
  logo,
  background,
  title,
  subtitle,
  description,
  city,
  uf,
  showBack,
}) {
  const navigate = useNavigate();

  return (
    <div
      className="eshlist-root"
      style={{
        backgroundImage: background
          ? `linear-gradient(
              rgba(0,0,0,0.65),
              rgba(0,0,0,0.85)
            ), url("${background}")`
          : undefined,
      }}
    >
      <div className="eshlist-inner">
        {showBack && (
          <div className="eshlist-back">
            <GlobalButton
              size="md"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Voltar
            </GlobalButton>
          </div>
        )}

        {logo && (
          <div className="eshlist-logo-box">
            <img
              src={logo}
              alt="Logo"
              className="eshlist-logo"
            />
          </div>
        )}

        <h1 className="eshlist-title">{title}</h1>

        {subtitle && (
          <p className="eshlist-subtitle">{subtitle}</p>
        )}

        {description && (
          <p className="eshlist-description">{description}</p>
        )}

        {(city || uf) && (
          <div className="eshlist-location">
            {city}
            {city && uf ? " / " : ""}
            {uf}
          </div>
        )}
      </div>
    </div>
  );
}

EstablishmentHero.propTypes = {
  logo: PropTypes.string,
  background: PropTypes.string,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  description: PropTypes.string,
  city: PropTypes.string,
  uf: PropTypes.string,
  showBack: PropTypes.bool,
};

EstablishmentHero.defaultProps = {
  showBack: true,
};
