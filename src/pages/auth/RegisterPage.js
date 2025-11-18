// src/pages/auth/RegisterPage.jsx
import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import RegisterFormComponent from "../../components/auth/RegisterFormComponent";
import "./Auth.css";

export default function RegisterPage() {
  return (
    <div className="login-bg">
      <Container fluid className="login-container">
        <Row className="justify-content-center">
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card className="login-card">
              <Card.Body className="text-center">
                <a href="/">
                  <img src="/images/logo.png" alt="Rasoio" className="logo" />
                </a>
                <RegisterFormComponent redirectTo="/login" />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
