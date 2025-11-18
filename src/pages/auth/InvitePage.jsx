import React from "react";
import GlobalNav from "../../components/GlobalNav";
import InviteFormComponent from "../../components/auth/InviteFormComponent";
import { Container, Row, Col, Card } from "react-bootstrap";
import "./InvitePage.css";

export default function InvitePage() {
  return (
    <>
      <GlobalNav />

      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card
              className="p-4"
              style={{
                background: "rgba(15,15,17,0.65)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
                borderRadius: "14px",
              }}
            >
              <h3 className="text-center mb-3" style={{ color: "#e5e5e5" }}>
                Convidar Usuário
              </h3>

              <InviteFormComponent redirectTo="/user/list" />
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
