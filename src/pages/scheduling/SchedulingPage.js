import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import NavlogComponent from "../../components/NavlogComponent";

import {  useNavigate } from "react-router-dom";
const SchedulingPage = () => {
    const navigate = useNavigate();
  return (
    <>
      <NavlogComponent />
      <Container fluid className="main-content">
        <Row className="justify-content-center mt-5">
          <Col md={8}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h1 className="h4 text-uppercase ">Em Construção</h1>
                <p className="mt-3 text-center">
                  A funcionalidade de agendamento está em desenvolvimento e em
                  breve estará disponível na plataforma Razoio. Fique atento
                  para novidades!
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate(`/dashboard`)}
                >
                  Voltar para Dashboard
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default SchedulingPage;
