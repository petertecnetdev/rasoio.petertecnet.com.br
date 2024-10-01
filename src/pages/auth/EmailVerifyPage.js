import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import authService from "../../services/AuthService";
import Navlog from "../../components/NavlogComponent";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import LoadingComponent from "../../components/LoadingComponent";

const EmailVerifyPage = () => {
  const [verificationCode, setVerificationCode] = useState("");
  const [loadingVerify, setLoadingVerify] = useState(false); // Carregamento para verificação de email
  const [loadingResend, setLoadingResend] = useState(false); // Carregamento para reenviar código
  const [redirect, setRedirect] = useState(false);

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setLoadingVerify(true); // Inicia o carregamento do botão de verificação
    try {
      const emailVerified = await authService.emailVerify(verificationCode);
      if (emailVerified) {
        Swal.fire({
          icon: "success",
          title: "Sucesso",
          text: "Email verificado com sucesso. Redirecionando...",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });

        setTimeout(() => {
          setRedirect(true);
        }, 1500); // Aguarda 1.5s antes de redirecionar
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro na verificação de email. Certifique-se de inserir o código corretamente.",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro na verificação de email. Por favor, tente novamente mais tarde.",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
    } finally {
      setLoadingVerify(false); // Finaliza o carregamento do botão de verificação
    }
  };

  const handleResendVerificationCode = async () => {
    setLoadingResend(true); // Inicia o carregamento do botão de reenvio
    try {
      const codeResent = await authService.resendCodeEmailVerification();
      if (codeResent) {
        Swal.fire({
          icon: "success",
          title: "Sucesso",
          text: "Código de verificação reenviado com sucesso.",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Erro ao reenviar o código de verificação.",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao reenviar o código de verificação. Por favor, tente novamente mais tarde.",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
    } finally {
      setLoadingResend(false); // Finaliza o carregamento do botão de reenvio
    }
  };

  if (redirect) {
    return <Navigate to="/dashboard" />; // Redireciona o usuário para o dashboard após a verificação do e-mail
  }

  return (
    <div className="App">
      <Navlog />
      <Container>
        <Row className="justify-content-center mt-5">
          <Col md={6} className="mt-5">
            <Card>
              <Card.Body>
                <div className="text-center">
                  <img
                    src="/images/logo.png"
                    alt="Logo"
                    className="logo rounded-circle img-thumbnail"
                    style={{ width: "150px", height: "150px" }}
                  />
                </div>
                <Card.Title className="text-center">Verificar Email</Card.Title>
                <p className="text-center">
                  Bem-vindo ao Rasoio! Estamos felizes em tê-lo conosco.
                  Para garantir a segurança da sua conta e aproveitar ao máximo
                  nossos serviços, por favor, verifique seu endereço de email
                  inserindo o código que enviamos para você. Isso permitirá que
                  você tenha acesso a recursos exclusivos e fique sempre
                  atualizado sobre suas interações.
                </p>
                <Form onSubmit={handleVerifyEmail}>
                  <Form.Group className="mb-3">
                    <Form.Label>Código de Verificação</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Insira o código"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <div className="d-grid">
                    <Button type="submit" variant="primary" disabled={loadingVerify}>
                      {loadingVerify ? "Verificando..." : "Verificar email"}
                    </Button>
                  </div>
                </Form>
                <div className="text-center mt-3">
                  <Button
                    variant="secondary"
                    onClick={handleResendVerificationCode}
                    disabled={loadingResend}
                  >
                    {loadingResend ? "Enviando..." : "Reenviar Código de Verificação"}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      {(loadingVerify || loadingResend) && <LoadingComponent />}{" "}
    </div>
  );
};

export default EmailVerifyPage;
