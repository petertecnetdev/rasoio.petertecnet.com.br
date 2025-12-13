// src/components/GlobalCard.jsx
import { useRef, useState, useMemo } from "react";
import PropTypes from "prop-types";
import { Badge } from "react-bootstrap";
import { FaMapMarkerAlt } from "react-icons/fa";
import useImageUtils from "../hooks/useImageUtils";
import GlobalButton from "./GlobalButton";
import "./GlobalCard.css";

export default function GlobalCard({
  item,
  fmtBRL,
  navigate,
  showSchedule,
  openSchedulePopup,
}) {
  const { imageUrl, handleImgError: baseHandleImgError } = useImageUtils();
  const cardRef = useRef(null);
  const [broken, setBroken] = useState(false);

  const handleImgError = (e) => {
    baseHandleImgError(e);
    setBroken(true);
  };

  const image = useMemo(() => {
  const paths = [
  item?.image,               // 👈 PRIORIDADE MÁXIMA (backend já resolveu)
  item?.avatar,
  item?.images?.avatar,
  item?.images?.logo,
  item?.images?.background,
  Array.isArray(item?.images?.gallery) ? item.images.gallery[0] : null,
];

    for (const p of paths) {
      const url = imageUrl(p);
      if (url) return url;
    }
    return null;
  }, [item, imageUrl]);

  const getInitials = () => {
    if (!item?.name) return "?";
    const parts = item.name.trim().split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : parts[0][0].toUpperCase() + parts.at(-1)[0].toUpperCase();
  };

  const getShape = () => {
    if (item.type === "employer") return "img-round";
    if (item.type === "establishment") return "img-establishment";
    return "img-square";
  };

  const handleDetails = () => {
    if (item.type === "establishment") {
      navigate(`/establishment/view/${item.slug}`);
      return;
    }
    if (item.type === "employer") {
      navigate(`/employer/view/${item.slug}`);
      return;
    }
    navigate(`/item/view/${item.slug}`);
  };

  const shape = getShape();

  return (
    <div
      ref={cardRef}
      className={`carousel-card hologram-container type-${item.type}`}
    >
      <div className={`carousel-image-wrap ${shape}`} onClick={handleDetails}>
        {image && !broken ? (
          <img
            src={image}
            loading="lazy"
            alt={item.name}
            className="carousel-image"
            onError={handleImgError}
          />
        ) : (
          <div className={`carousel-placeholder ${shape}`}>{getInitials()}</div>
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

        {item.duration !== null && item.duration !== undefined && (
          <div className="text-light-50 small mb-1">
            {item.duration} min
          </div>
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
        </div>

        <GlobalButton
          className="mt-3"
          size="sm"
          full
          variant="outline"
          stopPropagation
          onClick={handleDetails}
        >
          Detalhes
        </GlobalButton>

        {showSchedule && typeof openSchedulePopup === "function" && (
          <GlobalButton
            size="sm"
            full
            variant="primary"
            stopPropagation
            onClick={() => openSchedulePopup(item)}
            className="mt-2"
          >
            Agendar
          </GlobalButton>
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
};

GlobalCard.defaultProps = {
  fmtBRL: (v) => v,
  showSchedule: false,
  openSchedulePopup: null,
};
