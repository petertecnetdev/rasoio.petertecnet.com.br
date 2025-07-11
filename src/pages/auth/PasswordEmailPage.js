import React, { useState } from 'react';
import { Button, Form, Container, Row, Col, Card } from 'react-bootstrap';
import Swal from 'sweetalert2';
import axios from 'axios';
import { apiBaseUrl } from "../../config";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import './css/Auth.css';

const PasswordEmailPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);

<<<<<<< HEAD
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowProcessing(true);

    try {
      const response = await axios.post(`${apiBaseUrl}/auth/password-email`, { email });
=======
  const sendCode = async (targetEmail) => {
    setLoading(true);
    setShowProcessing(true);
    try {
      const response = await axios.post(`${apiBaseUrl}/auth/password-email`, { email: targetEmail });
>>>>>>> b6dc8a5d0af000183a529371eabcd70a64f359c4

      Swal.fire({
        title: 'Sucesso!',
        text: response.data.message || 'Código enviado para o e-mail com sucesso! Verifique seu email.',
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Recebi o Código',
        cancelButtonText: 'Não recebi o Código',
        customClass: {
          popup: 'custom-swal',
          title: 'custom-swal-title',
          content: 'custom-swal-text',
        },
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/password-reset';
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: 'Reenviar Código',
            text: 'Por favor, digite seu e-mail novamente para reenviar o código.',
            input: 'email',
            inputPlaceholder: 'Digite seu e-mail',
<<<<<<< HEAD
            inputValue: email,
=======
            inputValue: targetEmail,
>>>>>>> b6dc8a5d0af000183a529371eabcd70a64f359c4
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
              setEmail(resendResult.value);
<<<<<<< HEAD
              handleSubmit(e);
=======
              sendCode(resendResult.value);
>>>>>>> b6dc8a5d0af000183a529371eabcd70a64f359c4
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
      setShowProcessing(false);
    }
  };

<<<<<<< HEAD
=======
  const handleSubmit = async (e) => {
    e.preventDefault();
    sendCode(email);
  };

>>>>>>> b6dc8a5d0af000183a529371eabcd70a64f359c4
  return (
    <Container fluid className="page-container">
      <Row className="page-row">
        <Col md={12} className="page-col">
          {showProcessing ? (
            <ProcessingIndicatorComponent messages={['Enviando código...', 'Por favor, aguarde...']} />
          ) : (
            <Card className="card-container">
              <p className="page-header text-uppercase">Recuperar Senha</p>
              <Card.Body className="card-body">
                <div className="logo-container">
                  <img
                    src="/images/logo.png"
                    alt="Logo"
                    className="logo-image"
                  />
                </div>
                <Form onSubmit={handleSubmit} className="form-container">
                  <Form.Group className="form-group">
                    <Form.Control
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input-email"
                    />
                  </Form.Group>
                  <Button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar Código'}
                  </Button>
                  <p className="footer-text">
                    Voltar para <a href="/login" className="footer-link">Login</a>
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
