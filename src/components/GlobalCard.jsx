// src/components/GlobalCard.jsx
import { useRef, useState, useMemo, useCallback } from "react";
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
  actions,
}) {
  const { imageUrl, handleImgError: baseHandleImgError } = useImageUtils();
  const cardRef = useRef(null);

  const [mainImageBroken, setMainImageBroken] = useState(false);
  const [establishmentLogoBroken, setEstablishmentLogoBroken] = useState(false);

  const safeItem = item || {};
  const establishment = safeItem.establishment || {};

  // ✅ Produtos NÃO podem agendar
  const isProduct =
    safeItem.type === "product" ||
    safeItem.is_product === true ||
    safeItem.isProduct === true ||
    !!safeItem.product_id ||
    !!safeItem.productId ||
    safeItem.item_type === "product"; // ✅ compat (itens normalizados)

  const canSchedule =
    !!showSchedule && typeof openSchedulePopup === "function" && !isProduct;

  const handleMainImgError = (e) => {
    baseHandleImgError(e);
    setMainImageBroken(true);
  };

  const handleEstablishmentLogoError = (e) => {
    baseHandleImgError(e);
    setEstablishmentLogoBroken(true);
  };

  const image = useMemo(() => {
    const paths = [
      safeItem.image,
      safeItem.avatar,
      safeItem.images?.avatar,
      safeItem.images?.logo,
      safeItem.images?.background,
      Array.isArray(safeItem.images?.gallery) ? safeItem.images.gallery[0] : null,
    ];

    for (const p of paths) {
      const url = imageUrl(p);
      if (url) return url;
    }
    return null;
  }, [safeItem, imageUrl]);

  const establishmentLogo = useMemo(() => {
    const paths = [
      establishment?.images?.logo,
      establishment?.logo,
      establishment?.image,
      establishment?.images?.background,
    ];

    for (const p of paths) {
      const url = imageUrl(p);
      if (url) return url;
    }
    return null;
  }, [establishment, imageUrl]);

  const getInitials = useCallback(() => {
    if (!safeItem.name) return "?";
    const parts = String(safeItem.name).trim().split(" ").filter(Boolean);
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : parts[0][0].toUpperCase() + parts.at(-1)[0].toUpperCase();
  }, [safeItem]);

  const getShape = useCallback(() => {
    if (safeItem.type === "employer") return "img-round";
    if (safeItem.type === "establishment") return "img-establishment";
    return "img-square";
  }, [safeItem]);

  // ✅ resolve destino do "Detalhes" SEM depender de slug (employer não tem slug)
  const detailsPath = useMemo(() => {
    if (!safeItem || typeof navigate !== "function") return null;

    if (safeItem.type === "establishment") {
      return safeItem.slug ? `/establishment/view/${safeItem.slug}` : null;
    }

    if (safeItem.type === "employer") {
      const userName =
        safeItem.user_name ||
        safeItem.username ||
        safeItem.user?.user_name ||
        safeItem.user?.username ||
        null;

      if (userName) return `/employer/view/${userName}`;

      // fallback (rota protegida) se tiver id
      const id = safeItem.id || safeItem.user_id || safeItem.user?.id || null;
      if (id) return `/employer/${id}`;

      return null;
    }

    // item
    return safeItem.slug ? `/item/view/${safeItem.slug}` : null;
  }, [safeItem, navigate]);

  const canOpenDetails = !!detailsPath;

  const handleDetails = () => {
    if (!canOpenDetails) return;
    navigate(detailsPath);
  };

  const handleEstablishmentClick = (e) => {
    e.stopPropagation();
    if (!navigate || !establishment?.slug) return;
    navigate(`/establishment/view/${establishment.slug}`);
  };

  const shape = getShape();
  const isEstablishment = safeItem.type === "establishment";

  const placeholderSvg = useMemo(() => {
    const initials = getInitials();
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0b1c2d" />
            <stop offset="100%" stop-color="#020617" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" rx="18" ry="18" fill="url(#g)" />
        <text
          x="50%"
          y="54%"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="64"
          font-weight="700"
          fill="#e5e7eb"
          font-family="Inter, Arial, sans-serif"
          letter-spacing="2"
        >
          ${initials}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [getInitials]);

  if (!item) return null;

  return (
    <div
      ref={cardRef}
      className={`carousel-card hologram-container type-${safeItem.type} ${
        isEstablishment ? "establishment-horizontal" : ""
      }`}
    >
      <div
        className={`carousel-image-wrap ${shape}`}
        onClick={handleDetails}
        role={canOpenDetails ? "button" : undefined}
      >
        <img
          src={image && !mainImageBroken ? image : placeholderSvg}
          alt={safeItem.name}
          loading="lazy"
          className="carousel-image"
          onError={handleMainImgError}
        />
      </div>

      <div className="carousel-item-content">
        <div
          className="carousel-item-name"
          onClick={handleDetails}
          role={canOpenDetails ? "button" : undefined}
          title={safeItem.name || ""}
        >
          {safeItem.name}
        </div>

        {!isEstablishment && establishment?.name && (
          <div
            className="globalcard-establishment"
            role="button"
            onClick={handleEstablishmentClick}
            title={establishment.name}
          >
            {establishmentLogo && !establishmentLogoBroken && (
              <img
                src={establishmentLogo}
                alt={establishment.name}
                className="globalcard-establishment-logo"
                onError={handleEstablishmentLogoError}
              />
            )}
            <span className="globalcard-establishment-name">
              {establishment.name}
            </span>
          </div>
        )}

        {(safeItem.city || safeItem.uf) && (
          <div className="globalcard-location">
            <FaMapMarkerAlt size={12} className="globalcard-location__icon" />
            <span className="globalcard-location__text">
              {safeItem.city}
              {safeItem.uf ? ` - ${safeItem.uf}` : ""}
            </span>
          </div>
        )}

        {safeItem.price !== undefined && (
          <div className="carousel-item-price">{fmtBRL(safeItem.price)}</div>
        )}

        {safeItem.duration !== null && safeItem.duration !== undefined && (
          <div className="carousel-item-duration">{safeItem.duration} min</div>
        )}

        <div className="carousel-item-metrics">
          {safeItem.metrics && (
            <>
              <Badge bg="secondary" className="px-2 py-1 rounded-pill">
                {safeItem.metrics.total_views ?? 0} Views
              </Badge>

              {"completed_orders" in safeItem.metrics && (
                <Badge bg="secondary" className="px-2 py-1 rounded-pill">
                  {safeItem.metrics.completed_orders ?? 0} Pedidos
                </Badge>
              )}
            </>
          )}
        </div>

        <div className="carousel-item-actions">
         

          {canSchedule && (
            <GlobalButton
              size="sm"
              full
              variant="primary"
              stopPropagation
              onClick={() => openSchedulePopup(safeItem)}
              className="carousel-btn"
            >
              Agendar
            </GlobalButton>
          )}

          {actions && <div className="establishment-actions-slot">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

GlobalCard.propTypes = {
  item: PropTypes.object,
  fmtBRL: PropTypes.func,
  navigate: PropTypes.func,
  showSchedule: PropTypes.bool,
  openSchedulePopup: PropTypes.func,
  actions: PropTypes.node,
};

GlobalCard.defaultProps = {
  fmtBRL: (v) => v,
  showSchedule: false,
  openSchedulePopup: null,
};
