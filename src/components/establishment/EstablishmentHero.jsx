// src/components/establishment/EstablishmentHero.jsx
import React from "react";
import { Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import "./EstablishmentHero.css";

export default function EstablishmentHero({
  title,
  subtitle,
  city,
  uf,
  icon,
  backLabel,
}) {
  const navigate = useNavigate();

  return (
    <Row className="esh-root mb-5">
      <Col>
        <div className="esh-card">
          <div className="esh-top">
            <Button
              variant="link"
              className="esh-back-btn"
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left me-2" />
              {backLabel}
            </Button>
          </div>

          <div className="esh-content">
            <div className="esh-left">
              <div className="esh-icon">
                <i className={`bi ${icon}`} />
              </div>

              <div className="esh-text">
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
                {(city || uf) && (
                  <span className="esh-location">
                    <i className="bi bi-geo-alt-fill me-1" />
                    {city}
                    {city && uf ? " / " : ""}
                    {uf}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
}

EstablishmentHero.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  city: PropTypes.string,
  uf: PropTypes.string,
  icon: PropTypes.string,
  backLabel: PropTypes.string,
};

EstablishmentHero.defaultProps = {
  icon: "bi-shop",
  backLabel: "Voltar",
};
