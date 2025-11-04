import React, { useRef, useEffect, useState } from "react";
import { Card, Button } from "react-bootstrap";
import PropTypes from "prop-types";
import "./GlobalCarousel.css";

export default function GlobalCarousel({
  title,
  items,
  fmtBRL,
  openSchedulePopup,
  navigate,
  showSchedule,
}) {
  const trackRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // 🧠 Auto-scroll effect — executado sempre
  useEffect(() => {
    if (!trackRef.current) return;
    let autoScroll;

    if (!isHovered) {
      autoScroll = setInterval(() => {
        if (!trackRef.current) return;
        trackRef.current.scrollBy({ left: 1, behavior: "smooth" });
        const maxScroll =
          trackRef.current.scrollWidth - trackRef.current.clientWidth;
        if (trackRef.current.scrollLeft >= maxScroll - 2) {
          trackRef.current.scrollTo({ left: 0, behavior: "smooth" });
        }
      }, 50);
    }

    return () => clearInterval(autoScroll);
  }, [isHovered]);

  const scroll = (direction) => {
    if (!trackRef.current) return;
    const offset = direction === "left" ? -300 : 300;
    trackRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <Card
      bg="dark"
      text="light"
      className="mb-4 shadow-sm border-0 rounded-4 overflow-hidden global-carousel"
    >
      <Card.Header className="bg-black text-center py-3 border-0">
        <h5 className="fw-bold text-uppercase mb-0 text-light">{title}</h5>
      </Card.Header>

      <Card.Body
        className="p-3 position-relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="carousel-controls-wrapper">
          <button
            type="button"
            className={`carousel-arrow left ${isHovered ? "visible" : ""}`}
            onClick={() => scroll("left")}
            title="Anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className={`carousel-arrow right ${isHovered ? "visible" : ""}`}
            onClick={() => scroll("right")}
            title="Próximo"
          >
            ›
          </button>
        </div>

        <div ref={trackRef} className="carousel-track-flat">
          {items.slice(0, 12).map((it, idx) => (
            <div key={it.id || idx} className="carousel-card">
              {it.image && (
                <div className="carousel-image-wrap">
                  <img
                    loading="lazy"
                    src={it.image}
                    alt={it.name}
                    className="carousel-image"
                  />
                </div>
              )}

              <div className="carousel-item-content">
                <div className="carousel-item-name">{it.name || "Item sem nome"}</div>
                <div className="carousel-item-price">{fmtBRL(it.price)}</div>

                {showSchedule && (
                  <Button
                    size="sm"
                    className="w-100 mb-2 btn-flat-primary"
                    onClick={() => openSchedulePopup({ ...it, type: "service" })}
                  >
                    Agendar
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline-light"
                  className="w-100 btn-flat-outline"
                  onClick={() => navigate(`/item/view/${it.slug}`)}
                >
                  Detalhes
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}

GlobalCarousel.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  fmtBRL: PropTypes.func.isRequired,
  openSchedulePopup: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showSchedule: PropTypes.bool,
};

GlobalCarousel.defaultProps = {
  showSchedule: false,
};
