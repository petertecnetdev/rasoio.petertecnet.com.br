import React, { useRef } from "react";
import PropTypes from "prop-types";
import { Badge, Button } from "react-bootstrap";
import useImageUtils from "../hooks/useImageUtils";
import "./GlobalCard.css";

export default function GlobalCard({
  item,
  fmtBRL,
  navigate,
  showSchedule,
  openSchedulePopup,
}) {
  const { imageUrl, handleImgError } = useImageUtils("/images/logo.png");
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const intensity = Math.min(rect.width, rect.height) * 0.02;
    const rotateX = (y / intensity) * -1;
    const rotateY = x / intensity;
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.06)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (card) card.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
  };

  const getInitials = (text) => {
    if (!text) return "?";
    const p = text.trim().split(" ");
    let initials = p[0]?.[0] || "";
    if (p.length > 1) initials += p[p.length - 1][0] || "";
    return initials.toUpperCase();
  };

  const isPlaceholder = (path) => {
    if (!path) return true;
    const p = String(path).toLowerCase();
    return p.includes("default") || p.includes("logo") || p.includes("rasoio");
  };

  const getImageForItem = () => {
    if (item.type === "employer")
      return item.user?.avatar ? imageUrl(item.user.avatar) : null;
    if (item.type === "establishment")
      return item.logo ? imageUrl(item.logo) : null;
    if (item.image && !isPlaceholder(item.image))
      return imageUrl(item.image);
    return null;
  };

  const getShape = () => {
    if (item.type === "employer") return "img-round";
    if (item.type === "establishment") return "img-establishment";
    return "img-square";
  };

  const handleDetails = () => {
    if (item.type === "establishment")
      return navigate(`/establishment/view/${item.slug}`);
    if (item.type === "employer")
      return navigate(`/employer/view/${item.user?.user_name || item.slug}`);
    return navigate(`/item/view/${item.slug}`);
  };

  const handleSchedule = () => {
    openSchedulePopup({ ...item, type: "service" });
  };

  const fullName =
    item.name ||
    `${item.user?.first_name || ""} ${item.user?.last_name || ""}`.trim();

  const initials = getInitials(fullName);
  const imgSrc = getImageForItem();
  const shape = getShape();

  return (
    <div
      ref={cardRef}
      className={`carousel-card hologram-container type-${item.type}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="hologram-overlay"></div>

      <div className={`carousel-image-wrap ${shape}`} onClick={handleDetails}>
        {imgSrc ? (
          <img
            src={imgSrc}
            loading="lazy"
            alt={fullName}
            className="carousel-image"
            onError={handleImgError}
          />
        ) : (
          <div className={`carousel-placeholder ${shape}`}>{initials}</div>
        )}
      </div>

      <div className="carousel-item-content">
        <div className="carousel-item-name" onClick={handleDetails}>
          {fullName || "Sem nome"}
        </div>

        {"price" in item && item.price !== null && (
          <div className="carousel-item-price">{fmtBRL(item.price)}</div>
        )}

        {item.entity?.name && item.type !== "establishment" && (
          <div
            className="globalcard-entity"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/establishment/view/${item.entity.slug}`);
            }}
          >
            {item.entity.name}
          </div>
        )}

        {item.establishment && item.type === "employer" && (
          <div
            className="globalcard-entity"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/establishment/view/${item.establishment.slug}`);
            }}
          >
            {item.establishment.name}
          </div>
        )}

        <div className="d-flex flex-column align-items-center gap-2 mt-2 flex-wrap">
          <Badge bg="secondary" className="px-2 py-1 rounded-pill">
            {item.total_views ?? 0} Views
          </Badge>

          {(item.total_completed_appointments ||
            item.total_completed_appointments === 0) && (
            <Badge bg="success" className="px-2 py-1 rounded-pill">
              {item.total_completed_appointments} Atendimentos
            </Badge>
          )}

          {(item.unique_clients_attended ||
            item.unique_clients_attended === 0) && (
            <Badge bg="info" className="px-2 py-1 rounded-pill">
              {item.unique_clients_attended} Clientes
            </Badge>
          )}

          {item.top_employer && (
            <Badge bg="warning" className="px-2 py-1 rounded-pill text-dark">
              Mais atendido por {item.top_employer.first_name}
            </Badge>
          )}
        </div>

        {showSchedule && item.type === "service" && (
          <Button
            size="sm"
            className="w-100 mb-2 btn-flat-primary mt-2"
            onClick={(e) => {
              e.stopPropagation();
              handleSchedule();
            }}
          >
            Agendar
          </Button>
        )}

        <Button
          size="sm"
          variant="outline-light"
          className="w-100 btn-flat-outline mt-2"
          onClick={handleDetails}
        >
          Detalhes
        </Button>
      </div>
    </div>
  );
}

GlobalCard.propTypes = {
  item: PropTypes.object.isRequired,
  fmtBRL: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showSchedule: PropTypes.bool,
  openSchedulePopup: PropTypes.func.isRequired,
};

GlobalCard.defaultProps = {
  showSchedule: false,
};
