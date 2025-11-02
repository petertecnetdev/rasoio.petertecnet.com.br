import React, { useMemo, useState } from "react";
import { Card, Button, Badge } from "react-bootstrap";
import PropTypes from "prop-types";
import ScheduleButton from "./ScheduleButton";
import "./GlobalCarousel.css";

export default function GlobalCarousel({
  title,
  items,
  itemsInteractions,
  carouselActive,
  handleScroll,
  trackRef,
  fmtBRL,
  apiBaseUrl,
  openSchedulePopup,
  navigate,
  showSchedule,
}) {
  const [visibleCount, setVisibleCount] = useState(10);

  const getItemInteractions = useMemo(
    () => (itemId) =>
      itemsInteractions?.find((i) => i.item_id === itemId) || {
        total_views: 0,
        unique_users: 0,
      },
    [itemsInteractions]
  );

  const visibleItems = useMemo(
    () => (items ? items.slice(0, visibleCount) : []),
    [items, visibleCount]
  );

  const handleNext = (dir) => {
    handleScroll(dir);
    if (visibleCount < (items?.length || 0)) {
      setVisibleCount((prev) => Math.min(prev + 5, items.length));
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <Card
      bg="dark"
      text="light"
      className="mb-5 shadow border-0 rounded-4 overflow-hidden global-carousel"
    >
      <Card.Header className="bg-black text-center py-3 border-0 position-relative">
        <h5 className="fw-bold text-uppercase mb-0 text-neon">{title}</h5>
      </Card.Header>

      <Card.Body className="p-4 position-relative">
        <div
          className={`carousel-wrapper ${
            carouselActive ? "running" : "stopped"
          }`}
        >
          <div className="carousel-controls-wrapper">
            <div className="carousel-controls">
              <button
                type="button"
                className="carousel-arrow left"
                onClick={() => handleNext(-1)}
                title="Anterior"
              >
                ⏪
              </button>
              <button
                type="button"
                className="carousel-arrow right"
                onClick={() => handleNext(1)}
                title="Próximo"
              >
                ⏩
              </button>
            </div>
          </div>

          <div ref={trackRef} className="carousel-track no-image">
            {visibleItems.map((it, idx) => {
              const inter = getItemInteractions(it.id);

              return (
                <div key={`it-${it.id || idx}`} className="carousel-card text-only">
                  <div className="carousel-item-name fw-bold text-light">
                    {it.name}
                  </div>

                  <div className="carousel-item-price text-info">
                    {fmtBRL(it.price)}
                  </div>

                  {it.user && (
                    <div className="carousel-user text-muted small mb-2">
                      Cadastrado por:{" "}
                      <span className="text-info">
                        {it.user.first_name} {it.user.last_name}
                      </span>
                    </div>
                  )}

                  <div className="carousel-description text-white-50 small">
                    {it.description?.substring(0, 100) || "Sem descrição."}
                  </div>

                  <div className="d-flex justify-content-center gap-2 mt-3">
                    <Badge bg="secondary">👁️ {inter.total_views}</Badge>
                    <Badge bg="info">👤 {inter.unique_users}</Badge>
                  </div>

                  <div className="d-flex gap-2 mt-3">
                    {showSchedule && (
                      <ScheduleButton
                        service={it}
                        apiBaseUrl={apiBaseUrl}
                        openSchedulePopup={openSchedulePopup}
                      />
                    )}
                    <Button
                      size="sm"
                      variant="outline-light"
                      className="flex-fill button"
                      onClick={() => navigate(`/item/view/${it.slug}`)}
                    >
                      Detalhes
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

GlobalCarousel.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  itemsInteractions: PropTypes.array,
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
  itemsInteractions: [],
};
