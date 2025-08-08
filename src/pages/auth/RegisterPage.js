// src/pages/auth/RegisterPage.jsx
import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import api from "../../services/api";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import "./Auth.css";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
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
      await api.post("/auth/register", {
        username,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      Swal.fire({
        title: "Sucesso",
        text: "Cadastro realizado com sucesso!",
        icon: "success",
        confirmButtonText: "Entrar",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      }).then(() => {
        window.location.href = "/login";
      });
    } catch (err) {
      let msg = "Ocorreu um erro.";
      if (err.response) {
        msg = err.response.data.error ||
              err.response.data.message ||
              (err.response.data.errors
                ? Object.values(err.response.data.errors).flat().join(" ")
                : msg);
      }
      Swal.fire({
        title: "Erro",
        text: msg,
        icon: "error",
        confirmButtonText: "Ok",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      {loading && (
        <ProcessingIndicatorComponent
          messages={["Registrando...", "Aguarde..."]}
        />
      )}
      {!loading && (
        <Container fluid className="login-container">
          <Row className="justify-content-center">
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card className="login-card">
                <Card.Body className="text-center">
                  <img src="/images/logo.png" alt="Buddy’s Royale" className="logo" />
                  <Form onSubmit={handleSubmit} className="mt-4">
                    <Form.Control
                      type="text"
                      placeholder="Usuário"
                      className="neon-input mb-3"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                    <Form.Control
                      type="email"
                      placeholder="E-mail"
                      className="neon-input mb-3"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Form.Control
                      type="password"
                      placeholder="Senha"
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
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      required
                    />
                    <Button type="submit" className="neon-button w-100 mb-3">
                      Registrar
                    </Button>
                  </Form>
                  <div className="login-links">
                    <a href="/login">Já tenho conta</a>
                    <span className="sep">|</span>
                    <a href="/password-email">Recuperar senha</a>
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
