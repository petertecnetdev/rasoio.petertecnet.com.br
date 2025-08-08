// src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Spinner, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../config";
import NavlogComponent from "../components/NavlogComponent";
import { FaMapMarkerAlt } from "react-icons/fa";
import "./HomePage.css";

export default function HomePage() {
  const [barbershops, setBarbershops] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${apiBaseUrl}/establishment/category/barbershop`);
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (Array.isArray(data.establishments)) list = data.establishments;
        else if (data.establishments?.data) list = data.establishments.data;
        else if (Array.isArray(data.data)) list = data.data;
        setBarbershops(list);
      } catch {
        navigate("/404");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return (
      <div className="hp-root">
        <NavlogComponent />
        <div className="hp-loading">
          <Spinner animation="border" variant="warning" />
        </div>
      </div>
    );
  }

  return (
    <div className="hp-root">
      <NavlogComponent />
      <Container className="hp-container py-4">
        <h2 className="hp-title">Escolha a melhor barbearia</h2>
        <Row className="hp-grid">
          {barbershops.map((shop) => (
            <Col key={shop.id} md={6} lg={4} xl={3} className="hp-col">
              <div
                className="hp-card"
                style={{
                  backgroundImage: `url("${
                    shop.background
                      ? `${storageUrl}/${shop.background}`
                      : "/images/default-bg.png"
                  }")`,
                }}
                onClick={() => navigate(`/establishment/view/${shop.slug}`)}
              >
                <div className="hp-hero-overlay" />
                <div className="hp-logo-bubble">
                  <img
                    src={
                      shop.logo
                        ? `${storageUrl}/${shop.logo}`
                        : "/images/logo.png"
                    }
                    alt={shop.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/images/logo.png";
                    }}
                  />
                </div>
                <div className="hp-info">
                  <h3 className="hp-name">{shop.name}</h3>
                  {shop.address && (
                    <div className="hp-address">
                      <FaMapMarkerAlt />{" "}
                      {shop.address +
                        (shop.city ? `, ${shop.city}` : "")}
                    </div>
                  )}
                  {(Array.isArray(shop.segments)
                    ? shop.segments
                    : shop.segments
                    ? JSON.parse(shop.segments)
                    : []
                  ).map((seg) => (
                    <Badge key={seg} bg="warning" text="dark" className="me-1">
                      {seg}
                    </Badge>
                  ))}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
}
