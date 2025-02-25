import React, { useState } from 'react';
import { Button, Form, Container, Row, Col, Card } from 'react-bootstrap';
import Swal from 'sweetalert2';
import axios from 'axios';
import { apiBaseUrl } from "../../config"; // Importando o apiBaseUrl
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent"; // Importando o componente de indicador de processamento
import './css/Auth.css'; 

const PasswordEmailPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowProcessing(true); // Exibe o indicador de processamento

    try {
      const response = await axios.post(`${apiBaseUrl}/auth/password-email`, { email });

      Swal.fire({
        title: 'Sucesso!',
        text: response.data.message || 'Código enviado para o e-mail com sucesso! Verifique seu email.',
        icon: 'success',
        showCancelButton: true, // Habilita o botão de cancelar
        confirmButtonText: 'Recebi o Código',
        cancelButtonText: 'Não recebi o Código',
        customClass: {
          popup: 'custom-swal',
          title: 'custom-swal-title',
          content: 'custom-swal-text',
        },
      }).then((result) => {
        if (result.isConfirmed) {
          // O usuário confirmou que recebeu o código
          window.location.href = '/password-reset'; // Redireciona para a página de redefinição de senha
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          // O usuário não recebeu o código
          Swal.fire({
            title: 'Reenviar Código',
            text: 'Por favor, digite seu e-mail novamente para reenviar o código.',
            input: 'email',
            inputPlaceholder: 'Digite seu e-mail',
            inputValue: email, // Manter o email previamente preenchido
            showCancelButton: true,
            confirmButtonText: 'Reenviar Código',
            cancelButtonText: 'Cancelar', 
            customClass: {
              popup: 'custom-swal',
              title: 'custom-swal-title',
              content: 'custom-swal-text',
            },
          }).then((resendResult) => {
            if (resendResult.isConfirmed) {
              // Envia o código novamente
              setEmail(resendResult.value);
              handleSubmit(e); // Chama o envio do código novamente
            }
          });
        }
      });
    } catch (error) {
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
    } finally {
      setLoading(false);
      setShowProcessing(false); // Esconde o indicador de processamento
    }
  };

  return (
    <Container fluid className="login-container" style={{ height: '100vh' }}>
      <Row className="vh-100">
        <Col
          md={12}
          className="d-flex align-items-center justify-content-center position-relative"
          style={{
            background: `url('/images/background-2.png') no-repeat center center`,
            backgroundSize: 'cover',
            height: '100vh',
          }}
        >
          {/* Exibe o indicador de processamento se showProcessing for true */}
          {showProcessing ? (
            <ProcessingIndicatorComponent messages={['Enviando código...', 'Por favor, aguarde...']} />
          ) : (
            <Card className="login-card">
              <Card.Body>
                <div className="text-center mb-4">
                  <img
                    src="/images/logo.png"
                    alt="Logo"
                    className="logo rounded-circle"
                    style={{ width: '120px', height: '120px' }}
                  />
                </div>
                <Card.Title className="text-center mb-4">Recuperar Senha</Card.Title>
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
                  
                  <Button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : 'Enviar Código'}
                  </Button>

                  <p className="forgot-password text-center mt-3">
                    Voltar para <a href="/login" className="auth-link">Login</a>
                  </p>
                </Form>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default PasswordEmailPage;
