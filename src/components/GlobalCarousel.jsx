import React, { useRef, useLayoutEffect, useState } from "react";
import { Card, Button, Modal, Badge } from "react-bootstrap";
import { FaChevronLeft, FaChevronRight, FaEye, FaUser } from "react-icons/fa";
import PropTypes from "prop-types";
import LoginFormComponent from "./auth/LoginFormComponent";
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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);

  useLayoutEffect(() => {
    const t = setTimeout(() => {
      if (trackRef.current) trackRef.current.scrollLeft = 0;
    }, 50);
    return () => clearTimeout(t);
  }, []);

  const isAuthenticated = () => !!localStorage.getItem("token");

  const handleScheduleClick = (item) => {
    if (!isAuthenticated()) {
      setPendingItem(item);
      setShowLoginModal(true);
      return;
    }
    openSchedulePopup({ ...item, type: "service" });
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (pendingItem) {
      setTimeout(() => {
        openSchedulePopup({ ...pendingItem, type: "service" });
        setPendingItem(null);
      }, 300);
    }
  };

  const scroll = (direction) => {
    if (!trackRef.current) return;
    const offset = direction === "left" ? -260 : 260;
    trackRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <>
      <Card
        bg="dark"
        text="light"
        className="mb-4 shadow-sm border-0 rounded-4 overflow-hidden global-carousel"
      >
        <Card.Header className="bg-black text-center py-3 border-0">
          <h5 className="fw-bold text-uppercase mb-0 text-light">{title}</h5>
        </Card.Header>

        <Card.Body className="p-3 position-relative">
          <button
            type="button"
            className="carousel-arrow left"
            onClick={() => scroll("left")}
          >
            <FaChevronLeft />
          </button>

          <button
            type="button"
            className="carousel-arrow right"
            onClick={() => scroll("right")}
          >
            <FaChevronRight />
          </button>

          <div ref={trackRef} className="carousel-track-static">
            {items.map((it, idx) => (
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
                  <div className="carousel-item-name">
                    {it.name || "Item sem nome"}
                  </div>

                  <div className="carousel-item-price">
                    {fmtBRL(it.price)}
                  </div>

                  {/* 👁️ Visualizações e usuários únicos */}
                  <div className="d-flex justify-content-center align-items-center gap-2 mt-2 flex-wrap">
                    <Badge bg="secondary" className="px-2 py-1 rounded-pill"> {it.total_views ?? 0}{" "}
                      {it.total_views === 1
                        ? "View"
                        : "Views"}
                    </Badge>
                  </div>

                  {showSchedule && (
                    <Button
                      size="sm"
                      className="w-100 mb-2 btn-flat-primary mt-2"
                      onClick={() => handleScheduleClick(it)}
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

      <Modal
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
        centered
        size="md"
        backdrop="static"
        className="login-modal"
      >
        <Modal.Body className="bg-dark text-light p-4 rounded-3">
          <h5 className="text-center mb-3">Faça login para continuar</h5>
          <LoginFormComponent onSuccess={handleLoginSuccess} />
        </Modal.Body>
      </Modal>
    </>
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
