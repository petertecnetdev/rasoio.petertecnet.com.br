import React, { useState } from 'react';
import { Button, Form, Container, Row, Col, Card } from 'react-bootstrap';
import Swal from 'sweetalert2';
import axios from 'axios';
import { apiBaseUrl } from "../../config"; // Importando a URL base da API
import './css/Auth.css'; // Estilos adicionais

const PasswordResetPage = () => {
  const [email, setEmail] = useState('');
  const [resetPasswordCode, setResetPasswordCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (newPassword !== confirmPassword) {
      Swal.fire({
        title: 'Erro!',
        text: 'As senhas não coincidem. Por favor, tente novamente.',
        icon: 'error',
        confirmButtonText: 'Ok',
        customClass: {
          popup: 'custom-swal',
          title: 'custom-swal-title',
          content: 'custom-swal-text',
        },
      });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${apiBaseUrl}/auth/password-reset`, {
        email,
        reset_password_code: resetPasswordCode,
        password: newPassword, // campo esperado pelo backend
      });

      Swal.fire({
        title: 'Sucesso!',
        text: response.data.message || 'Senha alterada com sucesso!',
        icon: 'success',
        confirmButtonText: 'Ok',
        customClass: {
          popup: 'custom-swal',
          title: 'custom-swal-title',
          content: 'custom-swal-text',
        },
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/login'; // Redireciona para a página de login
        }
      });
    } catch (error) {
      if (error.response) {
        Swal.fire({
          title: 'Erro!',
          text: error.response?.data?.message || 'Ocorreu um erro inesperado.',
          icon: 'error',
          confirmButtonText: 'Tente Novamente',
          customClass: {
            popup: 'custom-swal',
            title: 'custom-swal-title',
            content: 'custom-swal-text',
          },
        });
      } else {
        Swal.fire({
          title: 'Erro!',
          text: 'Não foi possível conectar ao servidor. Tente novamente mais tarde.',
          icon: 'error',
          confirmButtonText: 'Tente Novamente',
          customClass: {
            popup: 'custom-swal',
            title: 'custom-swal-title',
            content: 'custom-swal-text',
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="login-container" style={{ height: '100vh' }}>
      <Row className="vh-100">
        <Col
          md={12}
          className="d-flex align-items-center justify-content-center position-relative"
        >
          <Card className="login-card">
            <Card.Body>
              <div className="text-center mb-4">
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  className="logo rounded-circle"
                  style={{ width: "120px", height: "120px" }}
                />
              </div>
              <Card.Title className="text-center mb-4">Redefinir Senha</Card.Title>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Código de redefinição"
                    value={resetPasswordCode}
                    onChange={(e) => setResetPasswordCode(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="password"
                    placeholder="Nova Senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="password"
                    placeholder="Confirmar Nova Senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                <Button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Alterando...' : 'Alterar Senha'}
                </Button>
                <p className="forgot-password text-center mt-3">
                   Não recebeu o codigo seu email?{" "}
                      <a href="/password-email" className="auth-link">
                      Solicitar novo código
                      </a>
                    </p>
                <p className="forgot-password text-center mt-3">
                  Voltar para <a href="/login" className="auth-link">Login</a>
                </p>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PasswordResetPage;
