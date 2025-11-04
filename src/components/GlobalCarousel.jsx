import React from "react";
import { Card, Button } from "react-bootstrap";
import PropTypes from "prop-types";
import "./GlobalCarousel.css";

export default function GlobalCarousel({
  title,
  items,
  carouselActive,
  handleScroll,
  trackRef,
  fmtBRL,
  apiBaseUrl,
  openSchedulePopup,
  navigate,
  showSchedule,
}) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <Card
      bg="dark"
      text="light"
      className="mb-4 shadow-lg border-0 rounded-4 overflow-hidden global-carousel"
    >
      <Card.Header className="bg-black text-center py-3 border-0 position-relative">
        <h5 className="fw-bold text-uppercase mb-0 text-neon-glow">{title}</h5>
      </Card.Header>

      <Card.Body className="p-3 position-relative">
        <div
          className={`carousel-wrapper ${
            carouselActive ? "running" : "stopped"
          }`}
        >
          <div className="carousel-controls-wrapper">
            <button
              type="button"
              className="carousel-arrow left"
              onClick={() => handleScroll(-1)}
              title="Anterior"
            >
              ‹
            </button>
            <button
              type="button"
              className="carousel-arrow right"
              onClick={() => handleScroll(1)}
              title="Próximo"
            >
              ›
            </button>
          </div>

          <div ref={trackRef} className="carousel-track text-only">
            {items.slice(0, 10).map((it, idx) => (
              <div key={it.id || idx} className="carousel-card text-only">
                <div className="carousel-item-content">
                  <div className="carousel-item-name fw-bold mb-2 text-gradient">
                    {it.name || "Item sem nome"}
                  </div>
                  <div className="carousel-item-price text-neon mb-3">
                    {fmtBRL(it.price)}
                  </div>

                  {showSchedule && (
                    <Button
                      size="sm"
                      className="w-100 mb-2 btn-schedule"
                      onClick={() => openSchedulePopup({ ...it, type: "service" })}
                    >
                      Agendar
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline-light"
                    className="w-100 btn-details"
                    onClick={() => navigate(`/item/view/${it.slug}`)}
                  >
                    Detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

GlobalCarousel.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  carouselActive: PropTypes.bool.isRequired,
  handleScroll: PropTypes.func.isRequired,
  trackRef: PropTypes.object.isRequired,
  fmtBRL: PropTypes.func.isRequired,
  apiBaseUrl: PropTypes.string.isRequired,
  openSchedulePopup: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showSchedule: PropTypes.bool,
};

GlobalCarousel.defaultProps = {
  showSchedule: false,
};
