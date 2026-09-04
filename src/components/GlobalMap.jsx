import React from "react";
import PropTypes from "prop-types";
import { buildSafeMapEmbedUrl } from "../utils/mapEmbed";
import "./GlobalMap.css";

export default function GlobalMap({ location, address, city, uf }) {
  const getFallback = () => {
    if (address && city && uf) return `${address}, ${city} - ${uf}`;
    if (address && city) return `${address}, ${city}`;
    if (address && uf) return `${address}, ${uf}`;
    if (city && uf) return `${city} - ${uf}`;
    return null;
  };

  const fallback = getFallback();
  const embedUrl = buildSafeMapEmbedUrl(location, fallback || "");
  if (!embedUrl) return null;

  return (
    <div className="globalmap__card">
      <div className="globalmap__header">
        <span className="globalmap__title">Localização</span>
        {fallback && <span className="globalmap__address">{fallback}</span>}
      </div>

      <div className="globalmap__wrapper">
        <iframe
          src={embedUrl}
          title={fallback ? `Mapa de ${fallback}` : "Mapa de localização"}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}

GlobalMap.propTypes = {
  location: PropTypes.string,
  address: PropTypes.string,
  city: PropTypes.string,
  uf: PropTypes.string,
};
