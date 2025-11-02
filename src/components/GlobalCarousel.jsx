import React from "react";
import { Card, Button, Badge } from "react-bootstrap";
import PropTypes from "prop-types";
import ScheduleButton from "./ScheduleButton";
import "./GlobalCarousel.css";

export default function GlobalCarousel({
  title,
  items,
  itemsInteractions,
  imageUrl,
  handleImgError,
  carouselActive,
  handleScroll,
  trackRef,
  fmtBRL,
  apiBaseUrl,
  openSchedulePopup,
  navigate,
  showSchedule,
}) {
  if (!items || items.length === 0) return null;

  const PLACEHOLDER = "/images/logo.png";

  const getItemInteractions = (itemId) => {
    const found = itemsInteractions?.find((i) => i.item_id === itemId);
    return found || { total_views: 0, unique_users: 0 };
  };

  const resolveImage = (it) => {
    if (it?.image) return imageUrl(it.image);
    if (it?.entity?.logo) return imageUrl(it.entity.logo);
    if (it?.establishment?.logo) return imageUrl(it.establishment.logo);
    return PLACEHOLDER;
  };

  return (
    <Card
      bg="dark"
      text="light"
      className="mb-5 shadow-lg border-0 rounded-4 overflow-hidden global-carousel"
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
          {/* CONTROLES */}
          <div className="carousel-controls-wrapper">
            <div className="carousel-controls">
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
          </div>

          {/* ITENS */}
          <div ref={trackRef} className="carousel-track">
            {items.map((it, idx) => {
              const inter = getItemInteractions(it.id);
              const imgSrc = resolveImage(it);

              return (
                <div key={`it-${it.id || idx}`} className="carousel-card">
                  <div className="carousel-image-wrap">
                    <img
                      src={imgSrc}
                      alt={it.name}
                      className="carousel-image"
                      onError={handleImgError}
                    />
                  </div>

                  <div className="carousel-item-name">{it.name}</div>
                  <div className="carousel-item-price">{fmtBRL(it.price)}</div>

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
                    <Badge bg="secondary">👁️ {inter.total_views || 0}</Badge>
                    <Badge bg="info">👤 {inter.unique_users || 0}</Badge>
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
  imageUrl: PropTypes.func.isRequired,
  handleImgError: PropTypes.func.isRequired,
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
