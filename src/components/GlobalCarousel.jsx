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
      className="mb-4 shadow-sm border-0 rounded-4 overflow-hidden global-carousel"
    >
      <Card.Header className="bg-black text-center py-3 border-0 position-relative">
        <h5 className="fw-bold text-uppercase mb-0 text-neon">{title}</h5>
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
              ⏪
            </button>
            <button
              type="button"
              className="carousel-arrow right"
              onClick={() => handleScroll(1)}
              title="Próximo"
            >
              ⏩
            </button>
          </div>

          <div ref={trackRef} className="carousel-track text-only">
            {items.slice(0, 10).map((it, idx) => (
              <div key={it.id || idx} className="carousel-card text-only">
                <div className="carousel-item-name fw-bold text-light mb-1">
                  {it.name || "Item sem nome"}
                </div>
                <div className="carousel-item-price text-info mb-2">
                  {fmtBRL(it.price)}
                </div>

                {showSchedule ? (
                  <Button
                    size="sm"
                    className="w-100 mb-2"
                    variant="outline-warning"
                    onClick={() => openSchedulePopup(it)}
                  >
                    Agendar
                  </Button>
                ) : null}

                <Button
                  size="sm"
                  variant="outline-light"
                  className="w-100"
                  onClick={() => navigate(`/item/view/${it.slug}`)}
                >
                  Detalhes
                </Button>
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
