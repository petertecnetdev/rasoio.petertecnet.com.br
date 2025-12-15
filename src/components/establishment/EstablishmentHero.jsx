// src/components/establishment/EstablishmentHero.jsx
import React from "react";
import PropTypes from "prop-types";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./EstablishmentHero.css";

export default function EstablishmentHero({
  title,
  subtitle,
  icon,
  badge,
  backTo,
}) {
  const navigate = useNavigate();

  return (
    <div className="esth-root mb-4">
      <Container fluid className="esth-container">
        <Row className="align-items-center">
          <Col className="esth-left">
            <div className="esth-card">
              <div className="esth-content">
                <div className="esth-icon">
                  <i className={`bi ${icon}`} />
                </div>

                <div className="esth-text">
                  <h1>{title}</h1>
                  {subtitle && <p>{subtitle}</p>}
                </div>
              </div>

              <div className="esth-actions">
                {badge && <span className="esth-badge">{badge}</span>}
                {backTo && (
                  <Button
                    size="sm"
                    variant="outline-light"
                    onClick={() => navigate(backTo)}
                  >
                    Voltar
                  </Button>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

EstablishmentHero.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.string,
  badge: PropTypes.string,
  backTo: PropTypes.string,
};
