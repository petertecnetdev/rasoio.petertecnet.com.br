// src/components/GlobalHero.jsx
import React from "react";
import PropTypes from "prop-types";
import { Container, Row, Col } from "react-bootstrap";
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
  user,
  interactionSummary,
  establishment,
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
          {/* ===== LOGO ===== */}
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
            <h1 className="global-hero-title">{title}</h1>
            {description && <p className="global-hero-desc">{description}</p>}

            <div className="global-hero-details mt-3">
              {user && (
                <div
                  className="detail-item owner-link"
                  onClick={() => navigate(`/user/view/${user.id}`)}
                >
                  <FaUser className="detail-icon" />
                  <span>
                    Proprietário:{" "}
                    <strong>
                      {user.first_name} {user.last_name}
                    </strong>
                  </span>
                </div>
              )}

              {establishment?.category && (
                <div className="detail-item">
                  <FaStar className="detail-icon" />
                  <span>Categoria: {establishment.category}</span>
                </div>
              )}

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
                  </span>
                </div>
              )}

              {/* ===== SOCIALS ===== */}
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

              {/* ===== STATUS ===== */}
              <div className="status-flags mt-3">
                {establishment?.is_published && (
                  <span className="status-badge published">
                    <FaCheckCircle /> Publicado
                  </span>
                )}
                {establishment?.is_featured && (
                  <span className="status-badge featured">
                    <FaStar /> Destaque
                  </span>
                )}
                {establishment?.is_approved && (
                  <span className="status-badge approved">
                    <FaCheckCircle /> Aprovado
                  </span>
                )}
              </div>

              {/* ===== INTERACTION METRICS ===== */}
              <div className="interaction-metrics mt-4">
                <div className="metric-box glow-cyan">
                  <div className="metric-value">{totalViews.toLocaleString()}</div>
                  <div className="metric-label">Visualizações</div>
                </div>
                <div className="metric-box glow-purple">
                  <div className="metric-value">{uniqueUsers.toLocaleString()}</div>
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
  user: PropTypes.object,
  establishment: PropTypes.object,
  interactionSummary: PropTypes.object,
  children: PropTypes.node,
};

GlobalHero.defaultProps = {
  overlay: true,
  children: null,
  user: null,
  establishment: null,
  interactionSummary: null,
};
