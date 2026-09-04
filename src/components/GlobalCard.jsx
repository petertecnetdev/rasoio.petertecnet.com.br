import { useRef, useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Badge } from "react-bootstrap";
import { FaBoxOpen, FaBriefcase, FaIdBadge, FaMapMarkerAlt, FaStore } from "react-icons/fa";
import useImageUtils from "../hooks/useImageUtils";
import GlobalButton from "./GlobalButton";
import "./GlobalCard.css";

export default function GlobalCard({ item, fmtBRL, navigate, showSchedule, openSchedulePopup, actions }) {
  const { imageUrl, handleImgError: baseHandleImgError } = useImageUtils();
  const cardRef = useRef(null);
  const [mainImageBroken, setMainImageBroken] = useState(false);
  const [establishmentLogoBroken, setEstablishmentLogoBroken] = useState(false);

  const safeItem = useMemo(() => item || {}, [item]);
  const establishment = useMemo(() => safeItem.establishment || {}, [safeItem]);
  const isProduct =
    safeItem.type === "product" ||
    safeItem.is_product === true ||
    safeItem.isProduct === true ||
    Boolean(safeItem.product_id) ||
    Boolean(safeItem.productId) ||
    safeItem.item_type === "product";
  const isEmployer = safeItem.type === "employer";
  const isEstablishment = safeItem.type === "establishment";
  const isService = !isProduct && !isEmployer && !isEstablishment;

  const cardKind = isEstablishment
    ? "establishment"
    : isEmployer
      ? "employer"
      : isProduct
        ? "product"
        : "service";
  const kindMeta = {
    establishment: { label: "Estabelecimento", icon: <FaStore /> },
    employer: { label: "Profissional", icon: <FaIdBadge /> },
    service: { label: "Serviço", icon: <FaBriefcase /> },
    product: { label: "Produto", icon: <FaBoxOpen /> },
  }[cardKind];

  const canSchedule =
    Boolean(showSchedule) &&
    typeof openSchedulePopup === "function" &&
    !isProduct &&
    safeItem.can_schedule !== false;

  const image = useMemo(() => {
    const paths = [
      safeItem.image,
      safeItem.avatar,
      safeItem.images?.avatar,
      safeItem.images?.logo,
      safeItem.images?.background,
      Array.isArray(safeItem.images?.gallery) ? safeItem.images.gallery[0] : null,
    ];
    for (const path of paths) {
      const url = imageUrl(path);
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
    for (const path of paths) {
      const url = imageUrl(path);
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

  const detailsPath = useMemo(() => {
    if (typeof navigate !== "function") return null;
    if (isEstablishment) return safeItem.slug ? `/establishment/view/${safeItem.slug}` : null;
    if (isEmployer) {
      const userName =
        safeItem.user_name ||
        safeItem.username ||
        safeItem.user?.user_name ||
        safeItem.user?.username ||
        null;
      return userName ? `/employer/view/${encodeURIComponent(userName)}` : null;
    }
    return safeItem.slug ? `/item/view/${safeItem.slug}` : null;
  }, [safeItem, navigate, isEstablishment, isEmployer]);

  const handleDetails = useCallback(() => {
    if (detailsPath) navigate(detailsPath);
  }, [detailsPath, navigate]);

  const handleKeyboardDetails = useCallback(
    (event) => {
      if (!detailsPath || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      handleDetails();
    },
    [detailsPath, handleDetails]
  );

  const handleEstablishmentClick = (event) => {
    event.stopPropagation();
    if (navigate && establishment?.slug) navigate(`/establishment/view/${establishment.slug}`);
  };

  const handleEstablishmentKeyDown = (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    handleEstablishmentClick(event);
  };

  const placeholderSvg = useMemo(() => {
    const initials = getInitials();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0b1c2d"/><stop offset="100%" stop-color="#020617"/></linearGradient></defs><rect width="200" height="200" rx="18" fill="url(#g)"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="64" font-weight="700" fill="#e5e7eb" font-family="Inter,Arial,sans-serif">${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [getInitials]);

  if (!item) return null;

  return (
    <article
      ref={cardRef}
      className={`carousel-card hologram-container type-${safeItem.type || "item"} card-kind-${cardKind}`}
    >
      <div className="globalcard-kind">{kindMeta.icon}<span>{kindMeta.label}</span></div>

      <div
        className={`carousel-image-wrap ${isEmployer ? "img-round" : isEstablishment ? "img-establishment" : "img-square"}`}
        onClick={handleDetails}
        onKeyDown={handleKeyboardDetails}
        role={detailsPath ? "button" : undefined}
        tabIndex={detailsPath ? 0 : undefined}
        aria-label={detailsPath ? `Ver detalhes de ${safeItem.name || kindMeta.label}` : undefined}
      >
        <img
          src={image && !mainImageBroken ? image : placeholderSvg}
          alt={safeItem.name || kindMeta.label}
          loading="lazy"
          className="carousel-image"
          onError={(event) => {
            baseHandleImgError(event);
            setMainImageBroken(true);
          }}
        />
      </div>

      <div className="carousel-item-content">
        <div
          className="carousel-item-name"
          onClick={handleDetails}
          onKeyDown={handleKeyboardDetails}
          role={detailsPath ? "button" : undefined}
          tabIndex={detailsPath ? 0 : undefined}
          title={safeItem.name || ""}
        >
          {safeItem.name}
        </div>

        {!isEstablishment && establishment?.name && (
          <div
            className="globalcard-establishment"
            role="button"
            tabIndex={0}
            onClick={handleEstablishmentClick}
            onKeyDown={handleEstablishmentKeyDown}
            title={establishment.name}
          >
            {establishmentLogo && !establishmentLogoBroken && (
              <img
                src={establishmentLogo}
                alt=""
                className="globalcard-establishment-logo"
                onError={(event) => {
                  baseHandleImgError(event);
                  setEstablishmentLogoBroken(true);
                }}
              />
            )}
            <span className="globalcard-establishment-name">{establishment.name}</span>
          </div>
        )}

        {(safeItem.city || safeItem.uf) && (
          <div className="globalcard-location">
            <FaMapMarkerAlt size={12} className="globalcard-location__icon" />
            <span className="globalcard-location__text">
              {safeItem.city}{safeItem.uf ? ` - ${safeItem.uf}` : ""}
            </span>
          </div>
        )}

        {safeItem.price !== undefined && <div className="carousel-item-price">{fmtBRL(safeItem.price)}</div>}
        {isService && safeItem.duration != null && <div className="carousel-item-duration">{safeItem.duration} min de atendimento</div>}
        {isProduct && <div className="globalcard-productHint">Item para compra • não utiliza agenda</div>}
        {isEmployer && <div className="globalcard-professionalHint">Profissional disponível para agendamento</div>}

        <div className="carousel-item-metrics">
          {safeItem.metrics && (
            <>
              <Badge bg="secondary" className="px-2 py-1 rounded-pill">
                {safeItem.metrics.total_views ?? 0} visualizações
              </Badge>
              {"completed_orders" in safeItem.metrics && (
                <Badge bg="secondary" className="px-2 py-1 rounded-pill">
                  {safeItem.metrics.completed_orders ?? 0} concluídos
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
    </article>
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
  fmtBRL: (value) => value,
  showSchedule: false,
  openSchedulePopup: null,
};
