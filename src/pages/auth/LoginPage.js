// src/pages/auth/LoginPage.jsx
import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { GoogleLogin } from "@react-oauth/google";
import Swal from "sweetalert2";
import api from "../../services/api";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import "./Auth.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const setToken = (token) => localStorage.setItem("token", token);
  const extractToken = (p) =>
    p.token?.access_token ??
    p.token?.original?.access_token ??
    p.access_token ??
    p.token;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { username, password });
      const token = extractToken(data);
      if (!token) throw new Error("Token nÃ£o recebido");
      setToken(token);
      window.location.href = "/dashboard";
    } catch (err) {
      let msg = "Ocorreu um erro.";
      if (err.response) msg = err.response.data.error || err.response.data.message || msg;
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

  const handleGoogleSuccess = async ({ credential }) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/google", { token_id: credential });
      const token = extractToken(data);
      if (!token) throw new Error("Token Google nÃ£o recebido");
      setToken(token);
      window.location.href = "/dashboard";
    } catch (err) {
      let msg = "Falha no login com Google";
      if (err.response) msg = err.response.data.error || err.response.data.message || msg;
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

  const handleGoogleError = () => {
    Swal.fire({
      title: "Erro",
      text: "Falha no login com Google",
      icon: "error",
      confirmButtonText: "Ok",
      customClass: {
        popup: "custom-swal",
        title: "custom-swal-title",
        content: "custom-swal-text",
      },
    });
  };

  return (
    <div className="login-bg">
      {loading && (
        <ProcessingIndicatorComponent
          messages={["Autenticando...", "Aguarde..."]}
        />
      )}
      {!loading && (
        <Container fluid className="login-container">
          <Row className="justify-content-center">
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card className="login-card">
                <Card.Body className="text-center">
                  <a href="/">
                    <img src="/images/logo.png" alt="Rasoio" className="logo" />
                  </a>
                  <Form onSubmit={handleSubmit} className="mt-4">
                    <Form.Control
                      type="text"
                      placeholder="UsuÃ¡rio ou e-mail"
                      className="neon-input mb-3"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                    <Form.Control
                      type="password"
                      placeholder="Senha"
                      className="neon-input mb-4"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button type="submit" className="neon-button w-100 mb-3">
                      Entrar
                    </Button>
                  </Form>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    render={(props) => (
                      <Button
                        onClick={props.onClick}
                        disabled={props.disabled}
                        className="google-button w-100 mb-3"
                      >
                        Continuar com Google
                      </Button>
                    )}
                  />
                  <div className="login-links">
                    <a href="/register">Registrar-se</a>
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
