import React from "react";
import PropTypes from "prop-types";
import { Row, Col } from "react-bootstrap";

import HomeCard from "./HomeCard";
import HomeSkeletonCard from "./HomeSkeletonCard";

export default function HomeGrid({ loading = false, error = null, items = [], onClick }) {
  if (loading) {
    return (
      <Row className="hp-grid" aria-busy="true" aria-label="Carregando estabelecimentos">
        {[...Array(4)].map((_, index) => (
          <Col key={index} md={6} lg={4} xl={3} className="hp-col">
            <HomeSkeletonCard />
          </Col>
        ))}
      </Row>
    );
  }

  if (error) return <div className="hp-empty" role="alert">{error}</div>;
  if (!items.length) return <div className="hp-empty">Nenhum estabelecimento encontrado.</div>;

  return (
    <Row className="hp-grid">
      {items.map((establishment) => (
        <Col key={establishment.id} md={6} lg={4} xl={3} className="hp-col mt-4">
          <HomeCard shop={establishment} onClick={onClick} />
        </Col>
      ))}
    </Row>
  );
}

HomeGrid.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  items: PropTypes.array,
  onClick: PropTypes.func,
};
