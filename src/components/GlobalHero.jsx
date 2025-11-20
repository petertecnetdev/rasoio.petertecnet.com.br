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
  } from "react-icons/fa";
  import { useNavigate } from "react-router-dom";
  import GlobalMapButton from "./GlobalMapButton";
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

    return (
      <div
        className={`gh-root ${isList ? "gh-list-mode" : ""}`}
        style={{
          backgroundImage: `linear-gradient(
          rgba(0, 0, 0, 0.55),
          rgba(0, 0, 0, 0.85)
        ), url("${imageUrl(background)}")`,
        }}
      >
        {overlay && <div className="gh-overlay" />}

        <Container fluid className="gh-container">
          <div className={`gh-grid ${isList ? "gh-list-grid" : ""}`}>

            {/* LOGO */}
            <div className={`gh-logo-box ${isList ? "gh-logo-list" : ""}`}>
              <img
                src={imageUrl(logo || PLACEHOLDER)}
                alt={title}
                className="gh-logo"
                onError={handleImgError}
              />
            </div>

            {/* INFO */}
            <div className="gh-info">
              <h1 className={`gh-title ${isList ? "gh-title-list" : ""}`}>
                <span className="gh-icon">{iconByEntity[entity]}</span>
                {title}
              </h1>

              {/* LIST MODE */}
              {isList && establishment && (
                <>
                  <div className="gh-list-location">
                    <FaMapMarkerAlt className="me-1" />
                    {establishment.city}
                    {establishment.uf ? ` - ${establishment.uf}` : ""}
                  </div>

                  {children && (
                    <div className="gh-list-children-box">{children}</div>
                  )}
                </>
              )}

              {/* NORMAL VIEW */}
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

                    {entity === "establishment" && establishment?.category && (
                      <div className="gh-detail-line">
                        <FaTag />
                        <span>Categoria: {establishment.category}</span>
                      </div>
                    )}

                    {entity === "item" && extraInfo?.category && (
                      <div className="gh-detail-line">
                        <FaTag />
                        <span>Categoria: {extraInfo.category}</span>
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

                    {/* SOCIALS */}
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

                    {/* METRICS */}
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

                    {/* MAP BUTTON */}
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
    imageUrl: PropTypes.func.isRequired,
    handleImgError: PropTypes.func.isRequired,
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
    extraInfo: PropTypes.object,
    children: PropTypes.node,
  };
