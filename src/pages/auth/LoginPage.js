import React, { Component } from "react";
import authService from "../../services/AuthService";
import Swal from "sweetalert2";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import './css/Auth.css'; // Estilos adicionais

class LoginPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      senha: "",
      loading: false,
    };
  }

  onChangeEmailUsuario = (e) => {
    this.setState({ email: e.target.value });
  };

  onChangeSenha = (e) => {
    this.setState({ senha: e.target.value });
  };

  onSubmit = async (e) => {
    e.preventDefault();
    this.setState({ loading: true });

    try {
      await authService.login(this.state.email, this.state.senha);
      window.location.href = '/dashboard';
    } catch (error) {
      let errorMessages = error.message || "Erro desconhecido ao tentar fazer login.";

      Swal.fire({
        title: "Erro!",
        text: errorMessages,
        icon: "error",
        confirmButtonText: "Ok",
        customClass: {
          popup: 'custom-swal',
          title: 'custom-swal-title',
          content: 'custom-swal-text',
        },
        iconColor: '#dc3545',
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
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
              height: '100vh',
            }}
          >
            <Card className="login-card">
              <Card.Body>
                <div className="text-center mb-4">
                  <img
                    src="/images/logo.png"
                    alt="Logo"
                    className="logo rounded-circle img-thumbnail"
                    style={{ width: "120px", height: "120px" }}
                  />
                </div>
                <Card.Title className="text-center mb-4">LOGIN</Card.Title>
                <Form onSubmit={this.onSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="email"
                      placeholder="Insira o email"
                      onChange={this.onChangeEmailUsuario}
                      value={this.state.email}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="password"
                      placeholder="Insira a senha"
                      onChange={this.onChangeSenha}
                      value={this.state.senha}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="formBasicCheckbox">
                    <Form.Check
                      type="checkbox"
                      label="Lembrar-me"
                      id="customCheck1"
                    />
                  </Form.Group>
                  <Button type="submit" className="btn btn-primary w-100" disabled={this.state.loading}>
                    {this.state.loading ? "Efetuando login..." : "Entrar"}
                  </Button>

                  <p className="forgot-password text-center mt-3">
                    Não tem registro? <a href="/register" className="auth-link">Registrar</a>
                  </p>
                  <p className="forgot-password text-center mt-3">
                    Esqueceu a senha? <a href="/password-email" className="auth-link">Recuperar senha</a>
                  </p>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default LoginPage;
