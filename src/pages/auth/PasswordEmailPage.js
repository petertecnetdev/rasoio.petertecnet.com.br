// src/pages/auth/PasswordEmailPage.jsx
import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl } from "../../config";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import "./Auth.css";

export default function PasswordEmailPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async (targetEmail) => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${apiBaseUrl}/auth/password-email`,
        { email: targetEmail }
      );
      Swal.fire({
        title: "Sucesso",
        text:
          data.message ||
          "Código enviado para o e-mail com sucesso! Verifique seu email.",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Recebi o Código",
        cancelButtonText: "Não recebi o Código",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/password-reset";
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: "Reenviar Código",
            input: "email",
            inputPlaceholder: "Digite seu e-mail",
            inputValue: targetEmail,
            showCancelButton: true,
            confirmButtonText: "Reenviar Código",
            cancelButtonText: "Cancelar",
            customClass: {
              popup: "custom-swal",
              title: "custom-swal-title",
              content: "custom-swal-text",
            },
          }).then((resend) => {
            if (resend.isConfirmed) {
              setEmail(resend.value);
              sendCode(resend.value);
            }
          });
        }
      });
    } catch (err) {
      Swal.fire({
        title: "Erro",
        text:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Ocorreu um erro inesperado.",
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

  const handleSubmit = (e) => {
    e.preventDefault();
    sendCode(email);
  };

  return (
    <div className="login-bg">
      {loading ? (
        <ProcessingIndicatorComponent
          messages={["Enviando código...", "Por favor, aguarde...", "Código enviado...", "Verifique seu email!"]}
        />
      ) : (
        <Container fluid className="login-container">
          <Row className="justify-content-center">
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card className="login-card">
                <Card.Body className="text-center">
                  <img
                    src="/images/logo.png"
                    alt="Buddy’s Royale"
                    className="logo"
                  />
                  <p className="mt-3 mb-4 text-uppercase custom-swal-title">
                    Recuperar Senha
                  </p>
                  <Form onSubmit={handleSubmit}>
                    <Form.Control
                      type="email"
                      placeholder="Digite seu e-mail"
                      className="neon-input mb-4"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Button
                      type="submit"
                      className="neon-button w-100 mb-3"
                      disabled={loading}
                    >
                      Enviar Código
                    </Button>
                  </Form>
                  <div className="login-links">
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
