// src/components/GlobalHeroEditorPreview.jsx
import React from "react";
import { Badge } from "react-bootstrap";
import "./GlobalHeroEditorPreview.css";

export default function GlobalHeroEditorPreview({
  backgroundPreview = null,
  logoPreview = null,
  segments = [],
  title = "",
  subtitle = "",
}) {
  const bgStyle = backgroundPreview
    ? `linear-gradient(90deg, rgba(18,18,18,0.87) 60%, rgba(36,36,36,0.70)),
       url('${backgroundPreview}') center/cover no-repeat`
    : "linear-gradient(90deg, rgba(18,18,18,0.9) 60%, rgba(36,36,36,0.7)), #222";

  return (
    <div className="global-hero-editor" style={{ background: bgStyle }}>
      <div className="global-hero-editor-inner">

        <div className="global-hero-editor-logo-bubble">
          <img
            src={logoPreview || "/images/logo.png"}
            alt="Logo"
            className="global-hero-editor-logo"
          />
        </div>

        <div className="global-hero-editor-info">
          <h1 className="global-hero-editor-title">{title}</h1>
          <div className="global-hero-editor-subtitle">{subtitle}</div>

          <div className="global-hero-editor-badge-list">
            {Array.isArray(segments) &&
              segments.map((seg, i) => (
                <Badge key={i} bg="warning" text="dark" className="me-1">
                  {seg.replace(/_/g, " ")}
                </Badge>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
