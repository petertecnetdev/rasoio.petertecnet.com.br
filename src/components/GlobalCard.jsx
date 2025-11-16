import React, { useRef } from "react";
import PropTypes from "prop-types";
import { Badge } from "react-bootstrap";
import { FaMapMarkerAlt, FaTrash, FaEdit } from "react-icons/fa";
import useImageUtils from "../hooks/useImageUtils";
import GlobalButton from "./GlobalButton";
import "./GlobalCard.css";

export default function GlobalCard({
  item,
  fmtBRL,
  navigate,
  showSchedule,
  openSchedulePopup,
  onEdit,
  onDelete,
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
    if (p.length === 1) return p[0][0].toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };

  const firstValidImage = () => {
    if (!item.images) return null;

    if (item.images.avatar) return imageUrl(item.images.avatar);
    if (item.images.logo) return imageUrl(item.images.logo);
    if (item.images.background) return imageUrl(item.images.background);

    if (Array.isArray(item.images.gallery) && item.images.gallery.length > 0) {
      return imageUrl(item.images.gallery[0]);
    }

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
      return navigate(`/employer/view/${item.slug}`);

    return navigate(`/item/view/${item.id}`);
  };

  return (
    <div
      ref={cardRef}
      className={`carousel-card hologram-container type-${item.type}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="hologram-overlay"></div>

      <div className={`carousel-image-wrap ${getShape()}`} onClick={handleDetails}>
        {firstValidImage() ? (
          <img
            src={firstValidImage()}
            loading="lazy"
            alt={item.name}
            className="carousel-image"
            onError={handleImgError}
          />
        ) : (
          <div className={`carousel-placeholder ${getShape()}`}>
            {getInitials(item.name)}
          </div>
        )}
      </div>

      <div className="carousel-item-content">
        <div className="carousel-item-name" onClick={handleDetails}>
          {item.name}
        </div>

        {(item.city || item.uf) && (
          <div className="globalcard-location d-flex align-items-center gap-1 mt-1">
            <FaMapMarkerAlt size={12} className="text-warning" />
            <span className="text-light-50">
              {item.city}
              {item.uf ? ` - ${item.uf}` : ""}
            </span>
          </div>
        )}

        {item.price !== undefined && (
          <div className="carousel-item-price">{fmtBRL(item.price)}</div>
        )}

        {item.establishment && item.type !== "establishment" && (
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

        <div className="d-flex flex-column align-items-center gap-2 mt-2">
          <Badge bg="secondary" className="px-2 py-1 rounded-pill">
            {item.total_views ?? 0} Views
          </Badge>

          {item.total_completed_appointments !== undefined && (
            <Badge bg="success" className="px-2 py-1 rounded-pill">
              {item.total_completed_appointments} Atendimentos
            </Badge>
          )}
        </div>

        <GlobalButton
          size="sm"
          full
          variant="outline"
          stopPropagation
          onClick={handleDetails}
        >
          Detalhes
        </GlobalButton>

        {(onEdit || onDelete) && (
          <div className="admin-actions mt-3 d-flex gap-2 w-100">
            {onEdit && (
              <GlobalButton
                size="sm"
                full
                variant="primary"
                stopPropagation
                onClick={() => onEdit(item)}
              >
                <FaEdit className="me-1" /> Editar
              </GlobalButton>
            )}

            {onDelete && (
              <GlobalButton
                size="sm"
                full
                variant="danger"
                stopPropagation
                onClick={() => onDelete(item)}
              >
                <FaTrash className="me-1" /> Excluir
              </GlobalButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

GlobalCard.propTypes = {
  item: PropTypes.object.isRequired,
  fmtBRL: PropTypes.func,
  navigate: PropTypes.func.isRequired,
  showSchedule: PropTypes.bool,
  openSchedulePopup: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

GlobalCard.defaultProps = {
  showSchedule: false,
  openSchedulePopup: () => {},
  onEdit: null,
  onDelete: null,
};
