// src/pages/HomePage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import NavlogComponent from "../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../config";
import "./homepage.css";

export default function HomePage() {
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBarbershops() {
      try {
        const { data } = await axios.get(
          `${apiBaseUrl}/establishment/category/barbershop`
        );
        setEstablishments(data.establishments || []);
      } catch {
        setError("Não foi possível carregar as barbearias.");
      } finally {
        setLoading(false);
      }
    }
    fetchBarbershops();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="home-page my-4">
      <NavlogComponent />
      <h1 className="mb-4">Barbearias</h1>
      <Row>
        {establishments.map(est => (
          <Col key={est.id} xs={12} md={6} lg={4} className="mb-4">
            <Card className="h-100 est-card">
              {est.logo && (
                <Card.Img
                  variant="top"
                  src={`${storageUrl}/${est.logo}`}
                  className="est-logo"
                />
              )}
              <Card.Body className="d-flex flex-column">
                <Card.Title>{est.fantasy || est.name}</Card.Title>
                <Card.Text>{est.city}</Card.Text>
                <Link
                  to={`/establishment/view/${est.slug}`}
                  className="btn btn-primary mt-auto"
                >
                  Ver detalhes
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
