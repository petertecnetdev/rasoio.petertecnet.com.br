import React, { Component } from "react";
import axios from "axios";
import { Button, Card, Col, Container, Row, Form } from "react-bootstrap";
import Swal from "sweetalert2"; // Importando SweetAlert
import { apiBaseUrl } from "../../config"; // Importando a configuração da URL base da API
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent"; // Indicador de processamento

class LoginPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      loading: false,
    };
  }

  // Função para armazenar o token no localStorage
  setToken = (token) => localStorage.setItem("token", token);

  onChangeEmail = (e) => {
    this.setState({ email: e.target.value });
  };

  onChangePassword = (e) => {
    this.setState({ password: e.target.value });
  };

  onSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = this.state;

    this.setState({ loading: true });

    try {
      const response = await axios.post(`${apiBaseUrl}/auth/login`, { email, password });
      const token = response?.data?.token.original.access_token;

      // Armazena o token no localStorage
      if (token) {
        this.setToken(token);
      }

      // Redireciona para o dashboard após o login bem-sucedido
      window.location.href = "/dashboard";

    } catch (error) {
      console.error(error.response?.data);
      let errorMessage = "Ocorreu um erro. Por favor, tente novamente.";

      if (error.response) {
        const { data } = error.response;
        errorMessage = data.error || data.password || data.email || errorMessage;
      }

      Swal.fire({
        title: "Erro!",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "Ok",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
        iconColor: "#dc3545", // Vermelho para erro
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { loading, email, password } = this.state;

    return (
      <Container fluid>
        {loading && <ProcessingIndicatorComponent messages={["Autenticando...", "Por favor, aguarde..."]} />}

        {!loading && (
          <Row>
            <Col md={12} className="d-flex align-items-center justify-content-center">
              <Card>
              <p className="labeltitle h7 text-uppercase">Login</p>
                <Card.Body>
                  <div className="text-center">
                    <img
                      src="/images/logo.png"
                      alt="Logo"
                      className="logo rounded-circle img-thumbnail"
                      style={{ width: "80px", height: "80px" }}
                    />
                  </div>
                  <Card.Title className="text-center mb-2 h2">ENTRAR</Card.Title>
                  <Form onSubmit={this.onSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Control
                        type="email"
                        placeholder="Insira o Email"
                        onChange={this.onChangeEmail}
                        value={email}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Control
                        type="password"
                        placeholder="Insira a Senha"
                        onChange={this.onChangePassword}
                        value={password}
                      />
                    </Form.Group>

                    <Button type="submit" disabled={loading} className="btn btn-primary w-100">
                      {loading ? "Entrando..." : "Entrar"}
                    </Button>
                    <p className="forgot-password text-right text-center mt-3">
                      Não tem conta? <a href="/register" className="auth-link">Registrar-se</a>
                    </p>
                    <p className="forgot-password text-right text-center mt-3">
                      Esqueceu a senha? <a href="/password-email" className="auth-link">Recuperar senha</a>
                    </p>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    );
  }
}

export default LoginPage;
