// src/components/GlobalPageHeader.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { FaMapMarkerAlt, FaInfoCircle } from "react-icons/fa";
import "./GlobalPageHeader.css";

export default function GlobalPageHeader({
  title,
  description,
  meta,
  icon,
  actions,
  align,
  variant,
  compact,
  className,
}) {
  const safeMeta = useMemo(() => {
    if (!Array.isArray(meta)) return [];
    return meta.filter((m) => typeof m === "string" && m.trim().length > 0);
  }, [meta]);

  return (
    <section
      className={[
        "gph-root",
        `gph-variant-${variant}`,
        `gph-align-${align}`,
        compact ? "gph-compact" : "",
        className || "",
      ].join(" ")}
      aria-label={title ? `Cabeçalho da página: ${title}` : "Cabeçalho da página"}
    >
      <div className="gph-inner">
        <div className="gph-left">
          <div className="gph-topline">
            {icon ? <div className="gph-icon">{icon}</div> : null}

            <div className="gph-titles">
              {title ? <h1 className="gph-title">{title}</h1> : null}
              {description ? (
                <p className="gph-description">
                  <FaInfoCircle className="gph-desc-ico" />
                  <span>{description}</span>
                </p>
              ) : null}
            </div>
          </div>

          {safeMeta.length ? (
            <div className="gph-meta">
              {safeMeta.map((txt, idx) => (
                <span key={`${txt}-${idx}`} className="gph-chip">
                  {idx === 0 ? <FaMapMarkerAlt className="gph-chip-ico" /> : null}
                  <span className="gph-chip-text">{txt}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {actions ? <div className="gph-actions">{actions}</div> : null}
      </div>
    </section>
  );
}

GlobalPageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  meta: PropTypes.arrayOf(PropTypes.string),
  icon: PropTypes.node,
  actions: PropTypes.node,
  align: PropTypes.oneOf(["left", "center"]),
  variant: PropTypes.oneOf(["default", "soft", "home"]),
  compact: PropTypes.bool,
  className: PropTypes.string,
};

GlobalPageHeader.defaultProps = {
  description: "",
  meta: [],
  icon: null,
  actions: null,
  align: "left",
  variant: "default",
  compact: false,
  className: "",
};
