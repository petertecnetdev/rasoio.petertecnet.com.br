// src/components/GlobalHero.jsx
import React from "react";
import PropTypes from "prop-types";
import { Container } from "react-bootstrap";
import {
  FaUser,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaGlobe,
  FaInstagram,
  FaFacebook,
  FaStore,
  FaCalendarAlt,
  FaTag,
  FaBox,
  FaInfoCircle,
  FaChartLine,
  FaPercent,
  FaWhatsapp,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import GlobalMapButton from "./GlobalMapButton";
import GlobalButton from "./GlobalButton";
import "./GlobalHero.css";

const PLACEHOLDER = "/images/logo.png";

const safeImageUrl = (fn) => {
  if (typeof fn === "function") return fn;
  return (path) => path || PLACEHOLDER;
};

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
  metrics,
  ordersSummary,
  whatsappLink,
  onScheduleClick,
  extraInfo,
  children,
}) {
  const navigate = useNavigate();
  const img = safeImageUrl(imageUrl);
  const onImgError =
    typeof handleImgError === "function" ? handleImgError : undefined;

  const totalViews = interactionSummary?.total_views || 0;
  const uniqueUsers = interactionSummary?.unique_users || 0;

  const socials = [
    { icon: <FaInstagram />, url: establishment?.instagram_url },
    { icon: <FaFacebook />, url: establishment?.facebook_url },
    { icon: <FaGlobe />, url: establishment?.website_url },
  ];

  const iconByEntity = {
    establishment: <FaStore />,
    employer: <FaUser />,
    item: <FaBox />,
    list: <FaBox />,
    order: <FaCalendarAlt />,
    user: <FaUser />,
    generic: <FaInfoCircle />,
  };

  const isList = entity === "list";

  const fmtBRL = (v) =>
    `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

  const fmtPercent = (v) => `${Number(v || 0).toFixed(1)}%`;

  const totalItems = metrics?.total_items ?? 0;
  const totalEmployers = metrics?.total_employers ?? 0;
  const totalOrders = metrics?.total_orders ?? ordersSummary?.total_orders ?? 0;
  const totalRevenue =
    metrics?.total_revenue ?? ordersSummary?.total_revenue ?? 0;
  const averageTicket =
    metrics?.average_ticket ?? ordersSummary?.average_ticket ?? 0;
  const completionRate =
    metrics?.completion_rate ?? ordersSummary?.completion_rate ?? 0;
  const returnRate =
    metrics?.return_rate ?? ordersSummary?.return_rate ?? 0;
  const engagementScore = metrics?.engagement_score ?? null;

  const handleSchedule = () => {
    if (onScheduleClick) {
      onScheduleClick();
      return;
    }
    navigate("/order/create");
  };

  return (
    <div
      className={`gh-root ${isList ? "gh-list-mode" : ""}`}
      style={{
        backgroundImage: `linear-gradient(
          rgba(7, 7, 12, 0.75),
          rgba(3, 3, 8, 0.96)
        ), url("${img(background)}")`,
      }}
    >
      {overlay && <div className="gh-overlay" />}

      <Container fluid className="gh-container">
        <div className={`gh-grid ${isList ? "gh-list-grid" : ""}`}>
          <div className={`gh-logo-box ${isList ? "gh-logo-list" : ""}`}>
            <div className="gh-logo-glow">
              <img
                src={img(logo || PLACEHOLDER)}
                alt={title}
                className="gh-logo"
                onError={onImgError}
              />
            </div>
          </div>

          <div className="gh-info">
            <div className="gh-header-row">
              <h1 className={`gh-title ${isList ? "gh-title-list" : ""}`}>
                <span className="gh-icon">{iconByEntity[entity]}</span>
                {title}
              </h1>

              {!isList && (
                <div className="gh-cta-group">
                  <GlobalButton
                    variant="primary"
                    size="md"
                    rounded
                    onClick={handleSchedule}
                  >
                    <FaCalendarAlt className="me-2" />
                    Agendar agora
                  </GlobalButton>

                  {whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="gh-whatsapp-link"
                    >
                      <GlobalButton variant="outline" size="md" rounded>
                        <FaWhatsapp className="me-2" />
                        WhatsApp
                      </GlobalButton>
                    </a>
                  )}
                </div>
              )}
            </div>

            {!isList && (
              <div className="gh-badges-row">
                {establishment?.city && (
                  <div className="gh-badge">
                    <FaMapMarkerAlt className="me-1" />
                    <span>
                      {establishment.city}
                      {establishment.uf ? ` - ${establishment.uf}` : ""}
                    </span>
                  </div>
                )}

                {establishment?.category && (
                  <div className="gh-badge">
                    <FaTag className="me-1" />
                    <span>{establishment.category}</span>
                  </div>
                )}

                {totalItems > 0 && (
                  <div className="gh-badge gh-badge-soft">
                    <FaBox className="me-1" />
                    <span>{totalItems} serviços/produtos</span>
                  </div>
                )}

                {totalEmployers > 0 && (
                  <div className="gh-badge gh-badge-soft">
                    <FaUser className="me-1" />
                    <span>{totalEmployers} profissionais</span>
                  </div>
                )}

                {engagementScore !== null && (
                  <div className="gh-badge gh-badge-score">
                    <FaChartLine className="me-1" />
                    <span>Score engajamento: {engagementScore}</span>
                  </div>
                )}
              </div>
            )}

            {isList && establishment && (
              <>
                {establishment.city && (
                  <div className="gh-list-location">
                    <FaMapMarkerAlt className="me-1" />
                    {establishment.city}
                    {establishment.uf ? ` - ${establishment.uf}` : ""}
                  </div>
                )}

                {children && (
                  <div className="gh-list-children-box">{children}</div>
                )}
              </>
            )}

            {!isList && (
              <>
                {description && <p className="gh-desc">{description}</p>}

                <div className="gh-details">
                  {entity === "employer" && user && (
                    <div
                      className="gh-detail-line gh-click"
                      onClick={() =>
                        navigate(`/user/view/${user.user_name || user.id}`)
                      }
                    >
                      <FaUser />
                      <span>
                        Profissional:{" "}
                        <strong>
                          {user.first_name} {user.last_name}
                        </strong>
                      </span>
                    </div>
                  )}

                  {establishment?.phone && (
                    <div className="gh-detail-line">
                      <FaPhoneAlt />
                      <span>{establishment.phone}</span>
                    </div>
                  )}

                  {establishment?.address && (
                    <div className="gh-detail-line">
                      <FaMapMarkerAlt />
                      <span>
                        {establishment.address}
                        {establishment.city ? ` - ${establishment.city}` : ""}
                        {establishment.uf ? `/${establishment.uf}` : ""}
                      </span>
                    </div>
                  )}

                  {socials.some((s) => s.url) && (
                    <div className="gh-socials">
                      {socials.map(
                        (s, i) =>
                          s.url && (
                            <span
                              key={i}
                              className="gh-social-icon"
                              onClick={() => window.open(s.url, "_blank")}
                            >
                              {s.icon}
                            </span>
                          )
                      )}
                    </div>
                  )}

                  <div className="gh-stats-row">
                    <div className="gh-stat-card">
                      <div className="gh-stat-icon">
                        <FaPercent />
                      </div>
                      <div className="gh-stat-content">
                        <div className="gh-stat-label">Taxa conclusão</div>
                        <div className="gh-stat-value">
                          {fmtPercent(completionRate)}
                        </div>
                        <div className="gh-stat-sub">
                          Retorno clientes {fmtPercent(returnRate)}
                        </div>
                      </div>
                    </div>

                    <div className="gh-stat-card">
                      <div className="gh-stat-icon">
                        <FaChartLine />
                      </div>
                      <div className="gh-stat-content">
                        <div className="gh-stat-label">Atendimentos</div>
                        <div className="gh-stat-value">
                          {totalOrders.toLocaleString()}
                        </div>
                        <div className="gh-stat-sub">
                          {totalViews.toLocaleString()} visualizações
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="gh-metrics">
                    <div className="gh-metric">
                      <div className="gh-metric-value">
                        {totalViews.toLocaleString()}
                      </div>
                      <div className="gh-metric-label">Visualizações</div>
                    </div>

                    <div className="gh-metric">
                      <div className="gh-metric-value">
                        {uniqueUsers.toLocaleString()}
                      </div>
                      <div className="gh-metric-label">Usuários únicos</div>
                    </div>
                  </div>

                  {establishment && (
                    <div className="gh-mapbutton-box">
                      <GlobalMapButton
                        location={establishment?.location}
                        address={establishment?.address}
                        city={establishment?.city}
                        uf={establishment?.uf}
                      />
                    </div>
                  )}
                </div>

                {children && <div className="gh-children">{children}</div>}
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

GlobalHero.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  background: PropTypes.string,
  logo: PropTypes.string,
  imageUrl: PropTypes.func,
  handleImgError: PropTypes.func,
  overlay: PropTypes.bool,
  entity: PropTypes.oneOf([
    "establishment",
    "employer",
    "item",
    "list",
    "order",
    "user",
    "generic",
  ]),
  user: PropTypes.object,
  establishment: PropTypes.object,
  interactionSummary: PropTypes.object,
  metrics: PropTypes.object,
  ordersSummary: PropTypes.object,
  whatsappLink: PropTypes.string,
  onScheduleClick: PropTypes.func,
  extraInfo: PropTypes.object,
  children: PropTypes.node,
};
