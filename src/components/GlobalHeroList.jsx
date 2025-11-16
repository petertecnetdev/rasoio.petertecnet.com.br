import React from "react";
import PropTypes from "prop-types";
import "./GlobalHeroList.css";

export default function GlobalHeroList({
  logo,
  background,
  title,
  subtitle,
  servicesCount = 0,
  productsCount = 0,
  imageUrl,
  handleImgError,
}) {
  const total = servicesCount + productsCount;

  return (
    <div
      className="ghlist-root"
      style={{
        backgroundImage: `linear-gradient(
          rgba(0,0,0,0.65), 
          rgba(0,0,0,0.85)
        ), url("${imageUrl(background)}")`,
      }}
    >
      <div className="ghlist-inner">

        {/* LOGO */}
        <div className="ghlist-logo-box">
          <img
            src={imageUrl(logo)}
            alt="Logo"
            className="ghlist-logo"
            onError={handleImgError}
          />
        </div>

        {/* TITULO */}
        <h1 className="ghlist-title">{title}</h1>

        {/* SUBTITULO */}
        {subtitle && <p className="ghlist-subtitle">{subtitle}</p>}

        {/* METRICAS */}
        <div className="ghlist-metrics-box">
          <div className="ghlist-metric">
            <div className="ghlist-metric-value">{servicesCount}</div>
            <div className="ghlist-metric-label">Serviços</div>
          </div>

          <div className="ghlist-separator" />

          <div className="ghlist-metric">
            <div className="ghlist-metric-value">{productsCount}</div>
            <div className="ghlist-metric-label">Produtos</div>
          </div>

          <div className="ghlist-separator" />

          <div className="ghlist-metric">
            <div className="ghlist-metric-value">{total}</div>
            <div className="ghlist-metric-label">Total</div>
          </div>
        </div>

      </div>
    </div>
  );
}

GlobalHeroList.propTypes = {
  logo: PropTypes.string,
  background: PropTypes.string,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  servicesCount: PropTypes.number,
  productsCount: PropTypes.number,
  imageUrl: PropTypes.func.isRequired,
  handleImgError: PropTypes.func.isRequired,
};
