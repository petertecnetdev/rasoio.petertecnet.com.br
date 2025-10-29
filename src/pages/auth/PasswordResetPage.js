// src/pages/auth/PasswordResetPage.jsx
import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl } from "../../config";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import "./Auth.css";

export default function PasswordResetPage() {
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== passwordConfirmation) {
      Swal.fire({
        title: "Erro",
        text: "As senhas não coincidem.",
        icon: "error",
        confirmButtonText: "Ok",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(`${apiBaseUrl}/auth/password-reset`, {
        email,
        reset_password_code: resetCode,
        password,
      });

      Swal.fire({
        title: "Sucesso",
        text: data.message || "Senha alterada com sucesso!",
        icon: "success",
        confirmButtonText: "Entrar",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      }).then(() => {
        window.location.replace("/login");
      });
    } catch (err) {
      Swal.fire({
        title: "Erro",
        text:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Ocorreu um erro.",
        icon: "error",
        confirmButtonText: "Ok",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      {loading && (
        <ProcessingIndicatorComponent
          messages={["Redefinindo senha...", "Por favor, aguarde..."]}
        />
      )}
      {!loading && (
        <Container fluid className="login-container">
          <Row className="justify-content-center">
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card className="login-card">
                <Card.Body className="text-center">
                  <img
                    src="/images/logo.png"
                    alt="Rasoio"
                    className="logo"
                  />
                  <p className="mt-3 mb-4 text-uppercase custom-swal-title">
                    Redefinir Senha
                  </p>
                  <Form onSubmit={handleSubmit}>
                    <Form.Control
                      type="email"
                      placeholder="E-mail"
                      className="neon-input mb-3"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Form.Control
                      type="text"
                      placeholder="Código de redefinição"
                      className="neon-input mb-3"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      required
                    />
                    <Form.Control
                      type="password"
                      placeholder="Nova Senha"
                      className="neon-input mb-3"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Form.Control
                      type="password"
                      placeholder="Confirmar Senha"
                      className="neon-input mb-4"
                      value={passwordConfirmation}
                      onChange={(e) =>
                        setPasswordConfirmation(e.target.value)
                      }
                      required
                    />
                    <Button
                      type="submit"
                      className="neon-button w-100 mb-3"
                      disabled={loading}
                    >
                      Alterar Senha
                    </Button>
                  </Form>
                  <div className="login-links">
                    <a href="/password-email">Pedir novo código</a>
                    <span className="sep">|</span>
                    <a href="/login">Voltar ao Login</a>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      )}
    </div>
  );
}
