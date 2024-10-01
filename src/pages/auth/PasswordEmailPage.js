import React, { Component } from "react";
import authService from "../../services/AuthService";
import { Link, Navigate } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import Swal from "sweetalert2";

class PasswordEmailPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      loading: false,
      loadingResend: false, // Novo estado para o carregamento do botão de reenviar
      showPasswordResetForm: false,
      code: "",
      newPassword: "",
      confirmPassword: "",
      redirectToLogin: false,
    };
  }

  onChangeEmail = (e) => {
    this.setState({ email: e.target.value });
  };
  onSubmitEmail = async (e) => {
    e.preventDefault();
    this.setState({ loading: true });

    try {
        // Tenta enviar o email para a API
        const response = await authService.passwordEmail(this.state.email);
        
        this.setState({ loading: false, showPasswordResetForm: true });

        // Exibe a mensagem de sucesso vinda da API
        Swal.fire({
            title: 'Sucesso',
            text: response,  // 'response' já contém a mensagem da API
            icon: 'success',
            customClass: {
                popup: 'custom-swal',
                title: 'custom-swal-title',
                content: 'custom-swal-text',
            },
            timer: 5000,
            timerProgressBar: true,
        });

    } catch (error) {
        this.setState({ loading: false });
        
        // Exibe a mensagem de erro da API se disponível
        if (error.message) {
            Swal.fire({
                title: 'Erro',
                text: error.message, // Exibe a mensagem de erro recebida da API
                icon: 'error',
                customClass: {
                    popup: 'custom-swal',
                    title: 'custom-swal-title',
                    content: 'custom-swal-text',
                },
                timer: 5000,
                timerProgressBar: true,
            });
        } else {
            // Exibe uma mensagem genérica para erros inesperados
            Swal.fire({
                title: 'Erro',
                text: "Ocorreu um erro inesperado.",
                icon: 'error',
                customClass: {
                    popup: 'custom-swal',
                    title: 'custom-swal-title',
                    content: 'custom-swal-text',
                },
                timer: 5000,
                timerProgressBar: true,
            });
        }
    }
};

  onChangeCode = (e) => {
    this.setState({ code: e.target.value });
  };

  onChangeNewPassword = (e) => {
    this.setState({ newPassword: e.target.value });
  };

  onChangeConfirmPassword = (e) => {
    this.setState({ confirmPassword: e.target.value });
  };

  onSubmitResetPassword = async (e) => {
    e.preventDefault();
    const { code, newPassword, confirmPassword } = this.state;

    this.setState({ loading: true });

    try {
      const email = this.state.email;
      const response = await authService.passwordReset(
        email,
        code,
        newPassword,
        confirmPassword
      );
      Swal.fire({
        title: 'Sucesso',
        text: response.data.message,
        icon: 'success',
        customClass: {
          popup: 'custom-swal',
          title: 'custom-swal-title',
          content: 'custom-swal-text',
        },
      });
      this.setState({
        redirectToLogin: true,
        showPasswordResetForm: false,
        code: "",
        newPassword: "",
        confirmPassword: "",
        loading: false
      });
    } catch (error) {
      this.setState({ loading: false });
      Swal.fire({
        title: 'Erro',
        text: error.response?.data || "Ocorreu um erro inesperado.",
        icon: 'error',
        customClass: {
          popup: 'custom-swal-title',
          content: 'custom-swal-text',
        },
      });
    }
  };

  // Função para reenviar o código
  onResendCode = async () => {
    this.setState({ loadingResend: true });

    try {
      const response = await authService.passwordEmail(this.state.email);
      this.setState({ loadingResend: false });
      Swal.fire({
        title: 'Sucesso',
        text: response.data.message,
        icon: 'success',
        customClass: {
          popup: 'custom-swal',
          title: 'custom-swal-title',
          content: 'custom-swal-text',
        },
        timer: 5000,
        timerProgressBar: true,
      });
    } catch (error) {
      this.setState({ loadingResend: false });
      Swal.fire({
        title: 'Erro',
        text: error.response?.data || "Ocorreu um erro inesperado.",
        icon: 'error',
        customClass: {
          popup: 'custom-swal-title',
          content: 'custom-swal-text',
        },
      });
    }
  };

  render() {
    if (this.state.redirectToLogin) {
      return <Navigate to="/login" replace />;
    }

    return (
<Container fluid className="login-container" style={{ height: '100vh' }}>
        <Row className="vh-100">
          {/* Coluna única com background e conteúdo centralizado */}
          <Col
            md={12}
            className="d-flex align-items-center justify-content-center position-relative"
            style={{
              background: `url('/images/background-2.png') no-repeat center center`,
              backgroundSize: 'cover',
            }}
          >
            <Card>
              <Card.Body>
                <div className="text-center">
                  <img
                    src="/images/logo.png"
                    alt="Logo"
                    className="logo rounded-circle img-thumbnail m-2"
                    style={{ width: "150px", height: "150px" }}
                  />
                </div>

                {!this.state.showPasswordResetForm ? (
                  <Form onSubmit={this.onSubmitEmail}>
                    <Card.Title className="text-center">
                      Recuperar senha
                    </Card.Title>
                    <Form.Group className="m-3">
                      <Form.Control
                        type="email"
                        placeholder="Insira o email"
                        onChange={this.onChangeEmail}
                        value={this.state.email}
                        required
                        autoComplete="off" // Impede o preenchimento automático
                      />
                    </Form.Group>
                    <div className="text-center">
                      <Button
                        className="m-3"
                        variant="primary"
                        type="submit"
                        disabled={this.state.loading}
                      >
                        {this.state.loading ? "Enviando código para o email..." : "Enviar Código"}
                      </Button>
                    </div>

                    <p className="forgot-password text-right">
                      Já está registrado? <Link to="/login" className="auth-link">Entrar</Link>
                    </p>
                    <p className="forgot-password text-right">
                      Não tem uma conta?{" "}
                      <Link to="/register" className="auth-link">Novo cadastro</Link>
                    </p>
                  </Form>
                ) : (
                  <Form onSubmit={this.onSubmitResetPassword}>
                    <h3>Redefinir Senha</h3>
                    <Form.Label>Email: {this.state.email}</Form.Label> 
                    <Form.Group className="mb-3">
                      <Form.Label>Código de Verificação</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Insira o código"
                        onChange={this.onChangeCode}
                        value={this.state.code}
                        required
                        autoComplete="off" // Impede o preenchimento automático
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Nova Senha</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Digite a nova senha"
                        onChange={this.onChangeNewPassword}
                        value={this.state.newPassword}
                        required
                        autoComplete="off" // Impede o preenchimento automático
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirme a Nova Senha</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Confirme a nova senha"
                        onChange={this.onChangeConfirmPassword}
                        value={this.state.confirmPassword}
                        required
                        autoComplete="off" // Impede o preenchimento automático
                      />
                    </Form.Group>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={this.state.loading}
                      style={{ position: "relative" }}
                    >
                      {this.state.loading ? "Alterando senha..." : "Redefinir Senha"}
                    </Button>
                    <p className="forgot-password text-right">
                      Não tenho cadastro: <Link to="/register" className="auth-link">Cadastro</Link>
                    </p>
                    <p className="forgot-password text-right text-center mt-3">
                    Já está registrado? <a href="/login" className="auth-link">Entrar</a>
                  </p>
                    <p className="forgot-password text-right">
                      Não recebi o código.{" "}
                      <Button   variant="primary"   style={{ position: "relative" }} onClick={this.onResendCode} disabled={this.state.loadingResend}>
                        {this.state.loadingResend ? "Reenviando..." : "Reenviar código"}
                      </Button>
                    </p>
                  </Form>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default PasswordEmailPage;
