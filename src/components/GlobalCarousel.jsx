import React, { useRef, useLayoutEffect, useState } from "react";
import { Card, Button, Modal, Badge } from "react-bootstrap";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
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

  const handleDetails = (it) => {
    if (!it.slug && !it.user_name) return;
    switch (it.type) {
      case "establishment":
        navigate(`/establishment/view/${it.slug}`);
        break;
      case "employer":
        navigate(`/employer/view/${it.user?.user_name || it.slug}`);
        break;
      case "item":
      case "service":
        navigate(`/item/view/${it.slug}`);
        break;
      default:
        if (it.slug) navigate(`/item/view/${it.slug}`);
        break;
    }
  };

  const getImageForItem = (it, title) => {
  const lower = (title || "").toLowerCase();

  if (lower.includes("outros estabelecimentos")) {
    return it.logo || it.image || null;
  }

  if (lower.includes("outros colaboradores")) {
    return it.user?.avatar || it.image || null;
  }

  if (lower.includes("colegas") || lower.includes("colaboradores") || lower.includes("trabalho")) {
    return it.avatar || it.user?.avatar || it.image || null;
  }

  // fallback geral
  return it.image || it.logo || it.user?.avatar || null;
};


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
            {items.map((it, idx) => {
              const imgSrc = getImageForItem(it, title);
              const showImage = !!imgSrc;

              return (
                <div key={it.id || idx} className="carousel-card">
                  {showImage && (
                    <div
                      className="carousel-image-wrap cursor-pointer"
                      onClick={() => handleDetails(it)}
                    >
                      <img
                        loading="lazy"
                        src={imgSrc}
                        alt={it.name || it.user?.first_name || "Sem nome"}
                        className="carousel-image"
                      />
                    </div>
                  )}

                  <div className="carousel-item-content">
                    <div
                      className="carousel-item-name cursor-pointer"
                      onClick={() => handleDetails(it)}
                    >
                      {it.name ||
                        `${it.user?.first_name || ""} ${it.user?.last_name || ""}`.trim() ||
                        "Sem nome"}
                    </div>

                    {it.price && (
                      <div className="carousel-item-price">
                        {fmtBRL(it.price)}
                      </div>
                    )}

                    <div className="d-flex justify-content-center align-items-center gap-2 mt-2 flex-wrap">
                      <Badge bg="secondary" className="px-2 py-1 rounded-pill">
                        {it.total_views ?? 0}{" "}
                        {it.total_views === 1 ? "View" : "Views"}
                      </Badge>

                      {"completed_appointments" in it && (
                        <Badge bg="success" className="px-2 py-1 rounded-pill">
                          {it.completed_appointments ?? 0}{" "}
                          {it.completed_appointments === 1
                            ? "Concluído"
                            : "Concluídos"}
                        </Badge>
                      )}
                    </div>

                    {showSchedule && it.type === "service" && (
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
                      onClick={() => handleDetails(it)}
                    >
                      Detalhes
                    </Button>
                  </div>
                </div>
              );
            })}
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
