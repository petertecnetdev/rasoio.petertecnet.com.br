import React from "react";
import { Badge } from "react-bootstrap";
import { FaMapMarkerAlt } from "react-icons/fa";
import { storageUrl } from "../../config";
import { buildInitialsImageDataUri } from "../../utils/imageFallback";
import "./HomeCard.css";

const parseSegments = (segments) => {
  if (Array.isArray(segments)) return segments;
  try {
    const parsed = JSON.parse(segments);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function HomeCard({ shop, onClick }) {
  const fallbackImage = buildInitialsImageDataUri(shop?.name || "");
  const bg = shop.background ? `${storageUrl}/${shop.background}` : null;
  const logo = shop.logo ? `${storageUrl}/${shop.logo}` : fallbackImage;
  const segs = parseSegments(shop.segments);
  const backgroundImage = bg
    ? `url("${bg}"), url("${fallbackImage}")`
    : `url("${fallbackImage}")`;

  return (
    <article
      className="hp-card"
      data-name={shop?.name || ""}
      role="button"
      tabIndex={0}
      style={{ backgroundImage }}
      onClick={() => onClick(shop.slug)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick(shop.slug)}
      aria-label={`Abrir ${shop.name}`}
    >
      <div className="hp-hero-overlay" />
      <div className="hp-logo-bubble" aria-hidden="true">
        <img
          src={logo}
          alt={shop?.name || "Estabelecimento"}
          data-fallback-text={shop?.name || ""}
          className="hp-logo-img"
          draggable={false}
          onError={(event) => {
            event.currentTarget.removeAttribute("srcset");
            event.currentTarget.src = fallbackImage;
          }}
        />
      </div>
      <div className="hp-info">
        <h3 className="hp-name">{shop.name}</h3>
        {(shop.address || shop.city) && (
          <div className="hp-address">
            <FaMapMarkerAlt /> {shop.city && ` ${shop.city}`}
          </div>
        )}
        {segs.length > 0 && (
          <div className="hp-badges">
            {segs.map((seg) => (
              <Badge key={seg} bg="warning" text="dark">
                {seg}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
