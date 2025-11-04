// src/components/GlobalHero.jsx
import React from "react";
import PropTypes from "prop-types";
import { Container, Row, Col, Badge } from "react-bootstrap";
import {
  FaUser,
  FaEye,
  FaUsers,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaGlobe,
  FaInstagram,
  FaFacebook,
  FaCheckCircle,
  FaStar,
  FaStore,
  FaCalendarAlt,
  FaTag,
  FaBox,
  FaInfoCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./GlobalHero.css";

const PLACEHOLDER = "/images/logo.png";

export default function GlobalHero({
  title,
  description,
  background,
  logo,
  imageUrl,
  handleImgError,
  overlay = true,
  entity = "generic",
  user,
  interactionSummary,
  establishment,
  extraInfo,
  children,
}) {
  const navigate = useNavigate();
  const totalViews = interactionSummary?.total_views || 0;
  const uniqueUsers = interactionSummary?.unique_users || 0;

  const socials = [
    { icon: <FaInstagram />, url: establishment?.instagram_url },
    { icon: <FaFacebook />, url: establishment?.facebook_url },
    { icon: <FaGlobe />, url: establishment?.website_url },
  ];

  const handleLink = (url) => {
    if (url && url !== "#") window.open(url, "_blank", "noopener,noreferrer");
  };

  // 🌍 Define ícones e textos conforme o tipo de entidade
  const iconByEntity = {
    establishment: <FaStore className="me-2 text-info" />,
    employer: <FaUser className="me-2 text-warning" />,
    item: <FaBox className="me-2 text-success" />,
    order: <FaCalendarAlt className="me-2 text-primary" />,
    user: <FaUser className="me-2 text-light" />,
    generic: <FaInfoCircle className="me-2 text-secondary" />,
  };

  const labelByEntity = {
    establishment: "Estabelecimento",
    employer: "Colaborador",
    item: "Item",
    order: "Pedido",
    user: "Usuário",
    generic: "Informação",
  };

  return (
    <div
      className="global-hero"
      style={{
        backgroundImage: `url("${imageUrl(background)}")`,
      }}
    >
      {overlay && <div className="global-hero-overlay" />}

      <Container fluid className="global-hero-content">
        <Row className="align-items-center">
          {/* ===== LOGO / AVATAR ===== */}
          <Col md="auto" className="text-center mb-3 mb-md-0">
            <img
              src={imageUrl(logo || PLACEHOLDER)}
              alt={title}
              className="global-hero-logo"
              onError={handleImgError}
            />
          </Col>

          {/* ===== MAIN INFO ===== */}
          <Col>
            <h1 className="global-hero-title d-flex align-items-center">
              {iconByEntity[entity]} {title}
            </h1>

            {description && <p className="global-hero-desc">{description}</p>}

            <div className="global-hero-details mt-3">
              {/* 🔹 EXIBE INFO CONFORME O TIPO */}
              {entity === "employer" && user && (
                <div
                  className="detail-item owner-link"
                  onClick={() => navigate(`/user/view/${user.user_name || user.id}`)}
                >
                  <FaUser className="detail-icon" />
                  <span>
                    Profissional:{" "}
                    <strong>
                      {user.first_name} {user.last_name}
                    </strong>
                  </span>
                </div>
              )}

              {entity === "establishment" && establishment?.category && (
                <div className="detail-item">
                  <FaTag className="detail-icon" />
                  <span>Categoria: {establishment.category}</span>
                </div>
              )}

              {entity === "item" && extraInfo?.category && (
                <div className="detail-item">
                  <FaTag className="detail-icon" />
                  <span>Categoria: {extraInfo.category}</span>
                </div>
              )}

              {entity === "order" && extraInfo?.order_number && (
                <div className="detail-item">
                  <FaCalendarAlt className="detail-icon" />
                  <span>Pedido nº {extraInfo.order_number}</span>
                </div>
              )}

              {/* 🔹 Telefone / Localização / Rede Social */}
              {establishment?.phone && (
                <div className="detail-item">
                  <FaPhoneAlt className="detail-icon" />
                  <span>{establishment.phone}</span>
                </div>
              )}

              {establishment?.address && (
                <div className="detail-item">
                  <FaMapMarkerAlt className="detail-icon" />
                  <span>
                    {establishment.address}
                    {establishment.city ? ` - ${establishment.city}` : ""}
                    {establishment.uf ? `/${establishment.uf}` : ""}
                  </span>
                </div>
              )}

              {/* 🔹 Social links */}
              {socials.some((s) => s.url) && (
                <div className="social-links mt-2">
                  {socials.map(
                    (s, i) =>
                      s.url && (
                        <span
                          key={i}
                          className="social-icon"
                          onClick={() => handleLink(s.url)}
                        >
                          {s.icon}
                        </span>
                      )
                  )}
                </div>
              )}

              {/* 🔹 Status (publicação, destaque etc.) */}
              {establishment && (
                <div className="status-flags mt-3">
                  {establishment.is_published && (
                    <span className="status-badge published">
                      <FaCheckCircle /> Publicado
                    </span>
                  )}
                  {establishment.is_featured && (
                    <span className="status-badge featured">
                      <FaStar /> Destaque
                    </span>
                  )}
                  {establishment.is_approved && (
                    <span className="status-badge approved">
                      <FaCheckCircle /> Aprovado
                    </span>
                  )}
                </div>
              )}

              {/* 🔹 Métricas */}
              <div className="interaction-metrics mt-4">
                <div className="metric-box glow-cyan">
                  <div className="metric-value">
                    {totalViews.toLocaleString()}
                  </div>
                  <div className="metric-label">Visualizações</div>
                </div>
                <div className="metric-box glow-purple">
                  <div className="metric-value">
                    {uniqueUsers.toLocaleString()}
                  </div>
                  <div className="metric-label">Usuários únicos</div>
                </div>
              </div>
            </div>

            {children && <div className="global-hero-extra mt-3">{children}</div>}
          </Col>
        </Row>
      </Container>
    </div>
  );
}

GlobalHero.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  background: PropTypes.string,
  logo: PropTypes.string,
  imageUrl: PropTypes.func.isRequired,
  handleImgError: PropTypes.func.isRequired,
  overlay: PropTypes.bool,
  entity: PropTypes.oneOf(["establishment", "employer", "item", "order", "user", "generic"]),
  user: PropTypes.object,
  establishment: PropTypes.object,
  interactionSummary: PropTypes.object,
  extraInfo: PropTypes.object,
  children: PropTypes.node,
};

GlobalHero.defaultProps = {
  overlay: true,
  children: null,
  user: null,
  establishment: null,
  interactionSummary: null,
  extraInfo: null,
  entity: "generic",
};
